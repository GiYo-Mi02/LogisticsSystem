/**
 * Shipment Processing Job Endpoint
 * =================================
 * Called by Upstash QStash to process shipments asynchronously.
 * 
 * Flow:
 * 1. QStash delivers the job payload
 * 2. We process vehicle recommendation & pricing
 * 3. Update shipment in DB
 * 4. Emit SSE event for real-time update
 */

import { NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { prisma } from '@/lib/prisma';
import { updateJobStatus } from '@/lib/queue';
import { ShipmentFactory } from '@/core/ShipmentFactory';
import { UserService } from '@/services/UserService';
import { emitShipmentUpdate, emitStatsUpdate } from '@/lib/realtime';

// QStash signature verification
const receiver = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    })
    : null;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        
        // Verify QStash signature in production
        if (receiver && process.env.NODE_ENV === 'production') {
            const signature = request.headers.get('upstash-signature');
            if (!signature) {
                return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
            }
            
            const isValid = await receiver.verify({
                signature,
                body,
            });
            
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }
        
        const payload = JSON.parse(body);
        const { jobId, shipmentId, customerId, weight, origin, destination, urgency } = payload;
        
        console.log(`Processing job ${jobId} for shipment ${shipmentId}`);
        
        // Update job status to processing
        if (jobId) {
            await updateJobStatus(jobId, 'processing');
        }
        
        // Get the PENDING shipment from DB
        const existingShipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
        });
        
        if (!existingShipment) {
            throw new Error(`Shipment ${shipmentId} not found`);
        }
        
        // Get customer for factory
        const userService = new UserService();
        const customer = await userService.getUserById(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }
        
        // Use Factory to determine vehicle and pricing (the "slow" operation)
        const { shipment: oopShipment, recommendedVehicle } = ShipmentFactory.createSimple(
            existingShipment.trackingId,
            weight,
            origin,
            destination,
            customer,
            urgency
        );
        
        // Create vehicle record
        const vehicleRecord = await prisma.vehicle.create({
            data: {
                licenseId: recommendedVehicle.licenseId,
                type: recommendedVehicle.type,
                capacity: recommendedVehicle.capacity,
                currentFuel: recommendedVehicle.currentFuel,
                status: 'ASSIGNED',
            },
        });
        
        // Update shipment with calculated values
        const updatedShipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                status: 'ASSIGNED',
                cost: oopShipment.cost,
            },
        });
        
        // Link vehicle to shipment
        await prisma.vehicle.update({
            where: { id: vehicleRecord.id },
            data: { currentShipmentId: shipmentId },
        });
        
        // Prepare result for SSE broadcast
        const result = {
            id: updatedShipment.id,
            trackingId: updatedShipment.trackingId,
            weight: updatedShipment.weight,
            status: updatedShipment.status,
            origin: {
                address: existingShipment.originAddress,
                city: existingShipment.originCity,
                country: existingShipment.originCountry,
            },
            destination: {
                address: existingShipment.destAddress,
                city: existingShipment.destCity,
                country: existingShipment.destCountry,
            },
            cost: updatedShipment.cost,
            assignedVehicle: {
                id: vehicleRecord.id,
                type: vehicleRecord.type,
                licenseId: vehicleRecord.licenseId,
            },
            createdAt: updatedShipment.createdAt,
        };
        
        // Emit real-time events
        emitShipmentUpdate(result);
        
        // Update stats
        const totalShipments = await prisma.shipment.count();
        emitStatsUpdate({ totalShipments });
        
        // Update job status to completed
        if (jobId) {
            await updateJobStatus(jobId, 'completed', result);
        }
        
        console.log(`✓ Job ${jobId} completed successfully`);
        
        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Job processing error:', error);
        
        // Try to update job status to failed
        try {
            const body = await request.clone().text();
            const { jobId } = JSON.parse(body);
            if (jobId) {
                await updateJobStatus(
                    jobId,
                    'failed',
                    undefined,
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }
        } catch {}
        
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Processing failed' },
            { status: 500 }
        );
    }
}
