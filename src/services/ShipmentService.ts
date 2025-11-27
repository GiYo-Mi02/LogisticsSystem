import { prisma } from '@/lib/prisma';
import { Shipment } from '@/core/Shipment';
import { ShipmentFactory } from '@/core/ShipmentFactory';
import { UserService } from './UserService';
import { Location } from '@/core/types';

export class ShipmentService {
    private userService = new UserService();

    /**
     * Creates a shipment using the Factory Pattern and persists it.
     */
    async createShipment(
        customerId: string,
        weight: number,
        origin: Location,
        destination: Location,
        urgency: 'high' | 'standard' | 'low'
    ): Promise<Shipment> {
        // 1. Get Customer
        const customer = await this.userService.getUserById(customerId);
        if (!customer) throw new Error('Customer not found');

        // 2. Use Factory to create OOP Shipment & determine Vehicle/Strategy
        const trackingId = 'TRK-' + Math.floor(Math.random() * 1000000);
        const { shipment, recommendedVehicle } = ShipmentFactory.createSimple(
            trackingId,
            weight,
            origin,
            destination,
            customer,
            urgency
        );

        // 3. Persist Vehicle (if it doesn't exist, or find available one)
        // For this demo, we'll create a new vehicle record for the recommended type
        const vehicleRecord = await prisma.vehicle.create({
            data: {
                licenseId: recommendedVehicle.licenseId,
                type: recommendedVehicle.type,
                capacity: recommendedVehicle.capacity,
                currentFuel: recommendedVehicle.currentFuel,
                status: 'ASSIGNED',
            },
        });

        // 4. Persist Shipment
        const shipmentRecord = await prisma.shipment.create({
            data: {
                trackingId: trackingId,
                weight: shipment.weight,
                status: 'ASSIGNED', // Factory assigns it immediately in our logic
                originLat: origin.lat,
                originLng: origin.lng,
                destLat: destination.lat,
                destLng: destination.lng,
                cost: shipment.cost,
                customerId: customer.id,
            },
        });

        // 5. Link Vehicle to Shipment
        await prisma.vehicle.update({
            where: { id: vehicleRecord.id },
            data: { currentShipmentId: shipmentRecord.id }
        });

        // 6. Return the shipment object
        return shipment;
    }

    /**
     * Retrieves a shipment by tracking ID.
     * Returns simplified data for API responses.
     */
    async getShipment(trackingId: string): Promise<any | null> {
        const record = await prisma.shipment.findUnique({
            where: { trackingId },
            include: { customer: true, vehicle: true },
        });

        if (!record) return null;

        return {
            id: record.id,
            trackingId: record.trackingId,
            weight: record.weight,
            status: record.status,
            origin: { lat: record.originLat, lng: record.originLng },
            destination: { lat: record.destLat, lng: record.destLng },
            cost: record.cost || 0,
            customerId: record.customerId,
            assignedVehicle: record.vehicle ? {
                id: record.vehicle.id,
                type: record.vehicle.type,
                licenseId: record.vehicle.licenseId,
            } : null,
            createdAt: record.createdAt,
        };
    }

    /**
     * Retrieves all shipments for a specific customer.
     * Returns simplified shipment data for API responses.
     */
    async getShipmentsByCustomer(customerId: string): Promise<any[]> {
        const records = await prisma.shipment.findMany({
            where: { customerId },
            include: { customer: true, vehicle: true },
            orderBy: { createdAt: 'desc' }
        });

        // Return data in a format suitable for the frontend
        return records.map(record => ({
            id: record.id,
            trackingId: record.trackingId,
            weight: record.weight,
            status: record.status,
            origin: { lat: record.originLat, lng: record.originLng },
            destination: { lat: record.destLat, lng: record.destLng },
            cost: record.cost || 0,
            assignedVehicle: record.vehicle ? {
                id: record.vehicle.id,
                type: record.vehicle.type,
                licenseId: record.vehicle.licenseId,
            } : null,
            createdAt: record.createdAt,
        }));
    }
}
