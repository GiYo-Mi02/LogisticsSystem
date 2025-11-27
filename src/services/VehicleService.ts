import { prisma } from '@/lib/prisma';
import { Vehicle, Drone, Truck, Ship } from '@/core/Vehicle';
import { VehicleType } from '@/core/types';
import { Vehicle as PrismaVehicle } from '@prisma/client';

export class VehicleService {

    async getAllVehicles(): Promise<Vehicle[]> {
        const records = await prisma.vehicle.findMany();

        return records.map((record: PrismaVehicle) => {
            switch (record.type) {
                case 'DRONE':
                    return new Drone(record.id, record.licenseId, record.maxAltitude || 100);
                case 'TRUCK':
                    return new Truck(record.id, record.licenseId, record.numberOfAxles || 4);
                case 'SHIP':
                    return new Ship(record.id, record.licenseId);
                default:
                    throw new Error(`Unknown vehicle type: ${record.type}`);
            }
        });
    }

    async createVehicle(type: VehicleType, licenseId: string): Promise<Vehicle> {
        const record = await prisma.vehicle.create({
            data: {
                type,
                licenseId,
                capacity: type === 'DRONE' ? 50 : type === 'TRUCK' ? 5000 : 50000,
                currentFuel: 100,
                status: 'IDLE',
                // Set defaults for specific props
                maxAltitude: type === 'DRONE' ? 120 : null,
                numberOfAxles: type === 'TRUCK' ? 4 : null,
            }
        });

        switch (type) {
            case VehicleType.DRONE:
                return new Drone(record.id, record.licenseId, 120);
            case VehicleType.TRUCK:
                return new Truck(record.id, record.licenseId, 4);
            case VehicleType.SHIP:
                return new Ship(record.id, record.licenseId);
            default:
                throw new Error('Invalid type');
        }
    }
}
