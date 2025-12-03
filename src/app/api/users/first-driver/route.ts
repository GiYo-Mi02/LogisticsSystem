import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/first-driver
 * Get or create a driver for truck/drone deliveries (excludes ship captains)
 */
export async function GET() {
    try {
        // First, try to find the demo driver by email
        let driver = await prisma.user.findUnique({
            where: { email: 'driver@logiq.demo' },
            include: { currentVehicle: true }
        });

        if (!driver) {
            // Create the demo driver
            driver = await prisma.user.create({
                data: {
                    email: 'driver@logiq.demo',
                    name: 'Driver Demo',
                    password: 'hashed_password',
                    role: 'DRIVER',
                },
                include: { currentVehicle: true }
            });
        }

        // If driver doesn't have a vehicle, assign a TRUCK (not SHIP)
        if (!driver.currentVehicle) {
            const availableTruck = await prisma.vehicle.findFirst({
                where: {
                    type: 'TRUCK',
                    status: 'AVAILABLE',
                    driver: null
                }
            });

            if (availableTruck) {
                // Assign truck to driver via user's currentVehicleId
                // The relation is User.currentVehicle -> Vehicle

                await prisma.user.update({
                    where: { id: driver.id },
                    data: { currentVehicleId: availableTruck.id }
                });

                // Re-fetch with vehicle
                driver = await prisma.user.findUnique({
                    where: { id: driver.id },
                    include: { currentVehicle: true }
                });
            }
        }

        return NextResponse.json({ driver });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database connection failed. Please run: npx prisma db push && npx tsx prisma/seed.ts' }, { status: 500 });
    }
}
