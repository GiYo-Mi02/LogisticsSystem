import { NextResponse } from 'next/server';
import { ShipmentService } from '@/services/ShipmentService';
import { emitNewShipment, emitStatsUpdate } from '@/lib/realtime';
import { prisma } from '@/lib/prisma';
import { validateRequestBody, validateQueryParams, validationErrorResponse } from '@/lib/validate';
import { createShipmentSchema, getShipmentsQuerySchema } from '@/lib/validations';
import { enqueueShipmentJob, isQueueAvailable } from '@/lib/queue';

const shipmentService = new ShipmentService();

/**
 * POST /api/shipments
 * Create a new shipment
 * 
 * With async queue (Upstash QStash):
 * 1. Validates input with Zod
 * 2. Creates PENDING shipment in DB
 * 3. Enqueues processing job
 * 4. Returns 202 Accepted immediately
 * 
 * Without queue (fallback):
 * - Processes synchronously as before
 */
export async function POST(request: Request) {
    try {
        // Validate request body with Zod
        const validation = await validateRequestBody(request, createShipmentSchema);
        
        if ('error' in validation) {
            return validation.error;
        }
        
        const { customerId, weight, origin, destination, urgency } = validation.data;
        
        // Check if async queue is available
        if (isQueueAvailable()) {
            // ASYNC PATH: Create pending shipment and enqueue job
            
            // Generate tracking ID
            const trackingId = 'TRK-' + Math.floor(Math.random() * 1000000);
            
            // Create shipment with PENDING status
            const pendingShipment = await prisma.shipment.create({
                data: {
                    trackingId,
                    weight,
                    status: 'PENDING',
                    originAddress: origin.address || null,
                    originCity: origin.city || null,
                    originCountry: origin.country || null,
                    originLat: origin.lat,
                    originLng: origin.lng,
                    destAddress: destination.address || null,
                    destCity: destination.city || null,
                    destCountry: destination.country || null,
                    destLat: destination.lat,
                    destLng: destination.lng,
                    cost: 0, // Will be calculated by worker
                    customerId,
                },
            });
            
            // Enqueue job for async processing
            const jobId = await enqueueShipmentJob({
                shipmentId: pendingShipment.id,
                customerId,
                weight,
                origin,
                destination,
                urgency,
            });
            
            // Emit new shipment event (PENDING status)
            emitNewShipment({
                id: pendingShipment.id,
                trackingId: pendingShipment.trackingId,
                status: 'PENDING',
                origin: { city: origin.city, country: origin.country },
                destination: { city: destination.city, country: destination.country },
                weight,
            });
            
            // Return 202 Accepted with job ID for tracking
            return NextResponse.json(
                {
                    message: 'Shipment accepted for processing',
                    shipment: {
                        id: pendingShipment.id,
                        trackingId: pendingShipment.trackingId,
                        status: 'PENDING',
                    },
                    jobId,
                },
                { status: 202 }
            );
        }
        
        // SYNC PATH: Process immediately (fallback when queue unavailable)
        const shipment = await shipmentService.createShipment(
            customerId,
            weight,
            origin,
            destination,
            urgency
        );

        // Emit real-time event for new shipment
        emitNewShipment(shipment);

        // Also emit stats update
        const totalShipments = await prisma.shipment.count();
        emitStatsUpdate({ totalShipments });

        return NextResponse.json({ shipment });
    } catch (error) {
        console.error('Shipment creation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create shipment' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/shipments?customerId=xxx
 * Get shipments for a customer
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Validate query parameters with Zod
        const validation = validateQueryParams(searchParams, getShipmentsQuerySchema);
        
        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }
        
        const { customerId } = validation.data;
        const shipments = await shipmentService.getShipmentsByCustomer(customerId);
        
        return NextResponse.json({ shipments });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipments', shipments: [] },
            { status: 500 }
        );
    }
}
