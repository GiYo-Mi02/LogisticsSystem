import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitShipmentUpdate, emitVehicleUpdate, emitAssignmentUpdate } from '@/lib/realtime';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const driverId = searchParams.get('driverId');

        if (!driverId) {
            return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
        }

        // Get driver with their vehicle and any active shipment
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            include: { 
                currentVehicle: {
                    include: {
                        currentShipment: {
                            include: {
                                customer: true
                            }
                        }
                    }
                },
                assignedJobs: {
                    where: {
                        status: { in: ['ASSIGNED', 'IN_TRANSIT'] }
                    },
                    include: { customer: true },
                    take: 1
                }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Current assignment can be from vehicle's shipment or driver's assigned jobs
        const currentShipment = driver.currentVehicle?.currentShipment || driver.assignedJobs?.[0] || null;

        // Available jobs: PENDING or ASSIGNED shipments without a driver
        const availableJobs = await prisma.shipment.findMany({
            where: { 
                OR: [
                    { status: 'PENDING' },
                    { status: 'ASSIGNED', driverId: null }
                ]
            },
            include: { customer: true },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ 
            currentAssignment: currentShipment,
            availableJobs,
            vehicle: driver.currentVehicle
        });
    } catch (error) {
        console.error('Driver assignment error:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// Accept a job
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { driverId, shipmentId } = body;

        if (!driverId || !shipmentId) {
            return NextResponse.json({ error: 'Driver ID and Shipment ID required' }, { status: 400 });
        }

        // Get driver's vehicle with current shipment
        const driver = await prisma.user.findUnique({
            where: { id: driverId },
            include: { 
                currentVehicle: {
                    include: { currentShipment: true }
                }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
        }

        // Check if driver already has an active assignment
        if (driver.currentVehicle?.currentShipment && 
            driver.currentVehicle.currentShipment.status !== 'DELIVERED') {
            return NextResponse.json({ 
                error: 'You already have an active delivery. Complete it first.' 
            }, { status: 400 });
        }

        // CRITICAL FIX: Check if shipment is already assigned to another vehicle
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { currentShipmentId: shipmentId }
        });

        // If shipment is linked to another vehicle, clear it first
        if (existingVehicle && existingVehicle.id !== driver.currentVehicle?.id) {
            await prisma.vehicle.update({
                where: { id: existingVehicle.id },
                data: { 
                    currentShipmentId: null,
                    status: 'IDLE'
                }
            });
        }

        // If driver's vehicle has an old completed shipment, clear it
        if (driver.currentVehicle?.currentShipmentId && 
            driver.currentVehicle.currentShipmentId !== shipmentId) {
            await prisma.vehicle.update({
                where: { id: driver.currentVehicle.id },
                data: { currentShipmentId: null }
            });
        }

        // Update shipment with driver assignment
        const updatedShipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                driverId: driverId,
                status: 'IN_TRANSIT'
            },
            include: { customer: true }
        });

        // If driver has a vehicle, link the shipment to it
        if (driver.currentVehicle) {
            await prisma.vehicle.update({
                where: { id: driver.currentVehicle.id },
                data: { 
                    currentShipmentId: shipmentId,
                    status: 'IN_TRANSIT'
                }
            });
        }

        // Emit real-time events
        emitShipmentUpdate(updatedShipment);
        emitAssignmentUpdate({ driverId, shipment: updatedShipment });
        if (driver.currentVehicle) {
            emitVehicleUpdate({ 
                ...driver.currentVehicle, 
                status: 'IN_TRANSIT', 
                currentShipmentId: shipmentId 
            });
        }

        return NextResponse.json({ 
            success: true,
            shipment: updatedShipment
        });
    } catch (error) {
        console.error('Accept job error:', error);
        return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
    }
}

// Mark shipment as delivered
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { shipmentId, driverId } = body;

        if (!shipmentId) {
            return NextResponse.json({ error: 'Shipment ID required' }, { status: 400 });
        }

        // Update shipment status to DELIVERED
        const updatedShipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: { status: 'DELIVERED' }
        });

        // Get driver and update vehicle status
        if (driverId) {
            const driver = await prisma.user.findUnique({
                where: { id: driverId },
                include: { currentVehicle: true }
            });

            if (driver?.currentVehicle) {
                await prisma.vehicle.update({
                    where: { id: driver.currentVehicle.id },
                    data: { 
                        currentShipmentId: null,
                        status: 'IDLE'
                    }
                });
            }
        }

        // Emit real-time events
        emitShipmentUpdate(updatedShipment);
        emitAssignmentUpdate({ driverId, shipment: updatedShipment, delivered: true });

        return NextResponse.json({ 
            success: true,
            shipment: updatedShipment
        });
    } catch (error) {
        console.error('Deliver shipment error:', error);
        return NextResponse.json({ error: 'Failed to deliver shipment' }, { status: 500 });
    }
}