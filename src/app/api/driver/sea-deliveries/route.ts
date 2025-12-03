import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitShipmentUpdate, emitVehicleUpdate, emitAssignmentUpdate } from '@/lib/realtime';

/**
 * GET /api/driver/sea-deliveries
 * Get all sea/ship deliveries from the database
 * Optionally filter by driverId for assigned shipments
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const driverId = searchParams.get('driverId');
        const status = searchParams.get('status'); // Optional status filter

        // Build status filter
        const statusFilter = status 
            ? { status: status as any }
            : {};

        // Get all sea-related shipments
        // Primary filter: transportMode = SHIP
        // Fallback for old data: heavy shipments (> 1000kg) that don't have a transport mode set
        const seaShipments = await prisma.shipment.findMany({
            where: {
                OR: [
                    // Shipments explicitly marked for SHIP transport
                    { transportMode: 'SHIP' },
                    // Fallback: Heavy shipments without transport mode (legacy data)
                    { 
                        AND: [
                            { weight: { gte: 1000 } },
                            { transportMode: null }
                        ]
                    }
                ],
                ...statusFilter
            },
            include: {
                customer: {
                    select: { id: true, name: true, email: true }
                },
                driver: {
                    select: { id: true, name: true, email: true }
                },
                vehicle: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get statistics for sea deliveries
        const stats = {
            total: seaShipments.length,
            pending: seaShipments.filter(s => s.status === 'PENDING').length,
            inTransit: seaShipments.filter(s => s.status === 'IN_TRANSIT').length,
            delivered: seaShipments.filter(s => s.status === 'DELIVERED').length,
            assigned: seaShipments.filter(s => s.status === 'ASSIGNED').length,
            totalWeight: seaShipments.reduce((acc, s) => acc + s.weight, 0),
            totalRevenue: seaShipments.reduce((acc, s) => acc + (s.cost || 0), 0)
        };

        // If driverId provided, also get driver's specific assignments
        let driverAssignments = null;
        let driverVehicle = null;
        
        if (driverId) {
            const driver = await prisma.user.findUnique({
                where: { id: driverId },
                include: {
                    currentVehicle: true,
                    assignedJobs: {
                        where: {
                            status: { in: ['ASSIGNED', 'IN_TRANSIT'] }
                        },
                        include: { customer: true }
                    }
                }
            });

            if (driver) {
                driverAssignments = driver.assignedJobs;
                driverVehicle = driver.currentVehicle;
            }
        }

        // Get available ship vehicles
        const availableShipVehicles = await prisma.vehicle.findMany({
            where: {
                type: 'SHIP',
                status: 'IDLE',
                currentShipmentId: null
            }
        });

        return NextResponse.json({
            shipments: seaShipments,
            stats,
            driverAssignments,
            driverVehicle,
            availableShipVehicles
        });
    } catch (error) {
        console.error('Sea deliveries fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sea deliveries' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/driver/sea-deliveries
 * Accept a sea delivery job
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { driverId, shipmentId, vehicleId } = body;

        if (!driverId || !shipmentId) {
            return NextResponse.json(
                { error: 'driverId and shipmentId are required' },
                { status: 400 }
            );
        }

        // Get driver with their vehicle
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

        // Get or assign a ship vehicle
        let shipVehicleId = driver.currentVehicle?.id;
        let shipVehicleType = driver.currentVehicle?.type;
        
        if (!shipVehicleId || shipVehicleType !== 'SHIP') {
            // Try to get the specified vehicle or find an available ship
            let foundVehicle;
            if (vehicleId) {
                foundVehicle = await prisma.vehicle.findUnique({
                    where: { id: vehicleId, type: 'SHIP' }
                });
            } else {
                foundVehicle = await prisma.vehicle.findFirst({
                    where: {
                        type: 'SHIP',
                        status: 'IDLE',
                        currentShipmentId: null
                    }
                });
            }

            if (!foundVehicle) {
                return NextResponse.json({
                    error: 'No ship vehicle available. Please wait for one to become available.'
                }, { status: 400 });
            }

            shipVehicleId = foundVehicle.id;

            // Assign ship to driver
            await prisma.user.update({
                where: { id: driverId },
                data: { currentVehicleId: foundVehicle.id }
            });
        }

        // Clear any existing vehicle links to this shipment (from old process-shipment job)
        await prisma.vehicle.updateMany({
            where: { currentShipmentId: shipmentId },
            data: { currentShipmentId: null, status: 'IDLE' }
        });

        // Update shipment with driver assignment
        const updatedShipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                driverId: driverId,
                status: 'IN_TRANSIT'
            },
            include: { customer: true }
        });

        // Update vehicle
        const updatedVehicle = await prisma.vehicle.update({
            where: { id: shipVehicleId },
            data: {
                currentShipmentId: shipmentId,
                status: 'IN_TRANSIT'
            }
        });

        // Emit real-time events
        emitShipmentUpdate(updatedShipment);
        emitAssignmentUpdate({ driverId, shipment: updatedShipment });
        emitVehicleUpdate({
            ...updatedVehicle,
            status: 'IN_TRANSIT',
            currentShipmentId: shipmentId
        });

        return NextResponse.json({
            success: true,
            shipment: updatedShipment,
            vehicle: updatedVehicle
        });
    } catch (error) {
        console.error('Accept sea job error:', error);
        return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
    }
}

/**
 * PATCH /api/driver/sea-deliveries
 * Update delivery status (mark as delivered, update location, etc.)
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { shipmentId, driverId, action, location } = body;

        if (!shipmentId) {
            return NextResponse.json(
                { error: 'shipmentId is required' },
                { status: 400 }
            );
        }

        if (action === 'deliver') {
            // Mark shipment as delivered
            const updatedShipment = await prisma.shipment.update({
                where: { id: shipmentId },
                data: { status: 'DELIVERED' }
            });

            // Update vehicle status
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

                    emitVehicleUpdate({
                        ...driver.currentVehicle,
                        currentShipmentId: null,
                        status: 'IDLE'
                    });
                }
            }

            emitShipmentUpdate(updatedShipment);
            emitAssignmentUpdate({ driverId, shipment: updatedShipment, delivered: true });

            return NextResponse.json({
                success: true,
                shipment: updatedShipment
            });
        }

        if (action === 'updateLocation' && location) {
            // Update vehicle location (for tracking)
            if (driverId) {
                const driver = await prisma.user.findUnique({
                    where: { id: driverId },
                    include: { currentVehicle: true }
                });

                if (driver?.currentVehicle) {
                    const updatedVehicle = await prisma.vehicle.update({
                        where: { id: driver.currentVehicle.id },
                        data: {
                            latitude: location.lat,
                            longitude: location.lng
                        }
                    });

                    emitVehicleUpdate(updatedVehicle);

                    return NextResponse.json({
                        success: true,
                        vehicle: updatedVehicle
                    });
                }
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Update sea delivery error:', error);
        return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 });
    }
}
