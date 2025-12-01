import { NextResponse } from 'next/server';
import { VehicleService } from '@/services/VehicleService';
import { VehicleType } from '@/core/types';
import { validateRequestBody } from '@/lib/validate';
import { createVehicleSchema } from '@/lib/validations';

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
        // Validate request body with Zod
        const validation = await validateRequestBody(request, createVehicleSchema);
        
        if ('error' in validation) {
            return validation.error;
        }
        
        const { type, licenseId } = validation.data;

        const vehicle = await vehicleService.createVehicle(type as VehicleType, licenseId);
        return NextResponse.json({ vehicle });
    } catch (error) {
        console.error('Vehicle creation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create vehicle' },
            { status: 500 }
        );
    }
}
