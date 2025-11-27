import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const totalShipments = await prisma.shipment.count();
        
        const activeDrones = await prisma.vehicle.count({
            where: { type: 'DRONE', status: { not: 'MAINTENANCE' } }
        });
        
        const activeTrucks = await prisma.vehicle.count({
            where: { type: 'TRUCK', status: { not: 'MAINTENANCE' } }
        });

        const revenueResult = await prisma.shipment.aggregate({
            _sum: { cost: true }
        });

        // Get all vehicles with their positions
        const vehicles = await prisma.vehicle.findMany({
            include: {
                currentShipment: true
            }
        });

        // Get recent shipments
        const recentShipments = await prisma.shipment.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { customer: true }
        });

        return NextResponse.json({
            totalShipments,
            activeDrones,
            activeTrucks,
            revenue: revenueResult._sum.cost || 0,
            vehicles,
            recentShipments
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
