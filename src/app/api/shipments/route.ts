import { NextResponse } from 'next/server';
import { ShipmentService } from '@/services/ShipmentService';
import { emitNewShipment, emitStatsUpdate } from '@/lib/realtime';
import { prisma } from '@/lib/prisma';

const shipmentService = new ShipmentService();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerId, weight, origin, destination, urgency } = body;

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
        console.error(error);
        return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (customerId) {
            const shipments = await shipmentService.getShipmentsByCustomer(customerId);
            return NextResponse.json({ shipments });
        }

        return NextResponse.json({ message: 'Please provide customerId' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        return NextResponse.json({ error: 'Failed to fetch shipments', shipments: [] }, { status: 500 });
    }
}
