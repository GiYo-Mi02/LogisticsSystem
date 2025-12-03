import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/first-captain
 * Get or create the first ship captain (driver with SHIP vehicle)
 * This is separate from the regular driver to avoid conflicts
 */
export async function GET() {
    try {
        // First, try to find an existing captain (driver with SHIP vehicle)
        let captain = await prisma.user.findFirst({
            where: { 
                role: 'DRIVER',
                currentVehicle: { type: 'SHIP' }
            },
            include: { currentVehicle: true }
        });

        // If no captain exists, find a driver without a vehicle and assign them a ship
        if (!captain) {
            // Find or create a ship vehicle
            let ship = await prisma.vehicle.findFirst({
                where: { 
                    type: 'SHIP',
                    driver: null // Not assigned to any driver
                }
            });

            if (!ship) {
                // Create a new ship if none available
                ship = await prisma.vehicle.create({
                    data: {
                        licenseId: `CPT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                        type: 'SHIP',
                        capacity: 50000,
                        currentFuel: 100,
                        status: 'IDLE',
                        latitude: 33.7283, // Los Angeles Port
                        longitude: -118.2616,
                    }
                });
            }

            // Try to find a driver to become captain, or create one
            let driverForCaptain = await prisma.user.findFirst({
                where: {
                    role: 'DRIVER',
                    currentVehicleId: null
                }
            });

            if (!driverForCaptain) {
                // Create a new captain user
                driverForCaptain = await prisma.user.create({
                    data: {
                        email: `captain_${Date.now()}@logiq.com`,
                        name: 'Captain Morgan',
                        password: 'hashed_password',
                        role: 'DRIVER',
                    }
                });
            }

            // Assign the ship to this driver
            captain = await prisma.user.update({
                where: { id: driverForCaptain.id },
                data: { currentVehicleId: ship.id },
                include: { currentVehicle: true }
            });
        }

        return NextResponse.json({ driver: captain });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
            error: 'Failed to get captain. Please ensure database is seeded.' 
        }, { status: 500 });
    }
}
