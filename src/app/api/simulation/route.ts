import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitVehicleUpdate, emitShipmentUpdate } from '@/lib/realtime';

/**
 * POST /api/simulation
 * Simulate vehicle movement for active shipments
 * This moves vehicles towards their destination and updates statuses
 */
export async function POST() {
    try {
        // Get all vehicles with active shipments (IN_TRANSIT status)
        const activeVehicles = await prisma.vehicle.findMany({
            where: {
                status: 'IN_TRANSIT',
                currentShipmentId: { not: null }
            },
            include: {
                currentShipment: true
            }
        });

        const updates = [];

        for (const vehicle of activeVehicles) {
            if (!vehicle.currentShipment || vehicle.latitude === null || vehicle.longitude === null) {
                continue;
            }

            const shipment = vehicle.currentShipment;
            const destLat = shipment.destLat;
            const destLng = shipment.destLng;

            // Calculate distance to destination
            const latDiff = destLat - vehicle.latitude;
            const lngDiff = destLng - vehicle.longitude;
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

            // Speed based on vehicle type (degrees per update)
            const speed = vehicle.type === 'DRONE' ? 0.5 : 
                         vehicle.type === 'TRUCK' ? 0.3 : 0.2;

            // If close enough to destination, mark as delivered
            if (distance < 0.5) {
                // Update vehicle to IDLE and remove shipment
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        status: 'IDLE',
                        currentShipmentId: null,
                        latitude: destLat,
                        longitude: destLng,
                        currentFuel: Math.max(vehicle.currentFuel - 5, 10)
                    }
                });

                // Update shipment to DELIVERED
                await prisma.shipment.update({
                    where: { id: shipment.id },
                    data: { status: 'DELIVERED' }
                });

                // Emit updates
                emitVehicleUpdate({
                    id: vehicle.id,
                    licenseId: vehicle.licenseId,
                    type: vehicle.type,
                    status: 'IDLE',
                    latitude: destLat,
                    longitude: destLng,
                    currentFuel: Math.max(vehicle.currentFuel - 5, 10)
                });

                emitShipmentUpdate({
                    id: shipment.id,
                    trackingId: shipment.trackingId,
                    status: 'DELIVERED'
                });

                updates.push({
                    vehicleId: vehicle.id,
                    action: 'DELIVERED',
                    shipmentId: shipment.id
                });
            } else {
                // Move towards destination
                const ratio = speed / distance;
                const newLat = vehicle.latitude + latDiff * ratio;
                const newLng = vehicle.longitude + lngDiff * ratio;
                const newFuel = Math.max(vehicle.currentFuel - 0.5, 10);

                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        latitude: newLat,
                        longitude: newLng,
                        currentFuel: newFuel
                    }
                });

                // Emit vehicle update
                emitVehicleUpdate({
                    id: vehicle.id,
                    licenseId: vehicle.licenseId,
                    type: vehicle.type,
                    status: 'IN_TRANSIT',
                    latitude: newLat,
                    longitude: newLng,
                    currentFuel: newFuel
                });

                updates.push({
                    vehicleId: vehicle.id,
                    action: 'MOVED',
                    position: { lat: newLat, lng: newLng }
                });
            }
        }

        return NextResponse.json({
            message: 'Simulation step completed',
            vehiclesUpdated: updates.length,
            updates
        });
    } catch (error) {
        console.error('Simulation error:', error);
        return NextResponse.json(
            { error: 'Simulation failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/simulation/status
 * Get current simulation status
 */
export async function GET() {
    try {
        const activeVehicles = await prisma.vehicle.findMany({
            where: { status: 'IN_TRANSIT' },
            include: {
                currentShipment: {
                    select: {
                        id: true,
                        trackingId: true,
                        destLat: true,
                        destLng: true,
                        destCity: true,
                        destCountry: true
                    }
                }
            }
        });

        return NextResponse.json({
            activeDeliveries: activeVehicles.length,
            vehicles: activeVehicles.map(v => ({
                id: v.id,
                licenseId: v.licenseId,
                type: v.type,
                position: { lat: v.latitude, lng: v.longitude },
                destination: v.currentShipment ? {
                    lat: v.currentShipment.destLat,
                    lng: v.currentShipment.destLng,
                    city: v.currentShipment.destCity
                } : null
            }))
        });
    } catch (error) {
        console.error('Error getting simulation status:', error);
        return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }
}
