import { NextResponse } from 'next/server';
import { ShipmentService } from '@/services/ShipmentService';

const shipmentService = new ShipmentService();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shipment = await shipmentService.getShipment(id);
        if (!shipment) {
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }
        return NextResponse.json({ shipment });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
