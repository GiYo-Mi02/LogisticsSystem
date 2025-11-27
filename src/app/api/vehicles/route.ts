import { NextResponse } from 'next/server';
import { VehicleService } from '@/services/VehicleService';
import { VehicleType } from '@/core/types';

const vehicleService = new VehicleService();

export async function GET(request: Request) {
    try {
        const vehicles = await vehicleService.getAllVehicles();
        return NextResponse.json({ vehicles });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, licenseId } = body;

        if (!type || !licenseId) {
            return NextResponse.json({ error: 'Type and License ID required' }, { status: 400 });
        }

        const vehicle = await vehicleService.createVehicle(type as VehicleType, licenseId);
        return NextResponse.json({ vehicle });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
}
