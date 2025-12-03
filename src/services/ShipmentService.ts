import { prisma } from '@/lib/prisma';
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
    ): Promise<any> {
        // 1. Get Customer
        const customer = await this.userService.getUserById(customerId);
        if (!customer) throw new Error('Customer not found');

        // 2. Use Factory to calculate pricing and recommended transport mode
        const trackingId = 'TRK-' + Math.floor(Math.random() * 1000000);
        const { shipment, recommendedVehicle } = ShipmentFactory.createSimple(
            trackingId,
            weight,
            origin,
            destination,
            customer,
            urgency
        );

        // 3. Persist Shipment with full location data
        // Determine transport mode from urgency: low = SHIP, high = DRONE, standard = TRUCK
        const transportMode = urgency === 'low' ? 'SHIP' : urgency === 'high' ? 'DRONE' : 'TRUCK';
        
        // Using type assertion to work around stale TypeScript cache
        const shipmentData: any = {
            trackingId: trackingId,
            weight: shipment.weight,
            status: 'PENDING', // Start as PENDING - driver needs to accept
            transportMode: transportMode,
            // Origin location
            originAddress: origin.address || null,
            originCity: origin.city || null,
            originCountry: origin.country || null,
            originLat: origin.lat,
            originLng: origin.lng,
            // Destination location
            destAddress: destination.address || null,
            destCity: destination.city || null,
            destCountry: destination.country || null,
            destLat: destination.lat,
            destLng: destination.lng,
            // Cost and relations
            cost: shipment.cost,
            customerId: customer.id,
        };

        const shipmentRecord: any = await prisma.shipment.create({
            data: shipmentData,
        });

        // Don't link vehicle yet - driver will accept and get assigned a vehicle

        // 4. Return formatted shipment data
        return {
            id: shipmentRecord.id,
            trackingId: shipmentRecord.trackingId,
            weight: shipmentRecord.weight,
            status: shipmentRecord.status,
            transportMode: transportMode,
            origin: {
                address: shipmentRecord.originAddress,
                city: shipmentRecord.originCity,
                country: shipmentRecord.originCountry,
            },
            destination: {
                address: shipmentRecord.destAddress,
                city: shipmentRecord.destCity,
                country: shipmentRecord.destCountry,
            },
            cost: shipmentRecord.cost,
            recommendedVehicleType: recommendedVehicle.type, // Just the type, not assigned yet
            createdAt: shipmentRecord.createdAt,
        };
    }

    /**
     * Retrieves a shipment by tracking ID.
     * Returns simplified data for API responses.
     */
    async getShipment(trackingId: string): Promise<any | null> {
        const record: any = await prisma.shipment.findUnique({
            where: { trackingId },
            include: { customer: true, vehicle: true },
        });

        if (!record) return null;

        return {
            id: record.id,
            trackingId: record.trackingId,
            weight: record.weight,
            status: record.status,
            origin: {
                address: record.originAddress,
                city: record.originCity,
                country: record.originCountry,
                lat: record.originLat,
                lng: record.originLng,
            },
            destination: {
                address: record.destAddress,
                city: record.destCity,
                country: record.destCountry,
                lat: record.destLat,
                lng: record.destLng,
            },
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
        const records: any[] = await prisma.shipment.findMany({
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
            origin: {
                address: record.originAddress,
                city: record.originCity,
                country: record.originCountry,
                lat: record.originLat,
                lng: record.originLng,
            },
            destination: {
                address: record.destAddress,
                city: record.destCity,
                country: record.destCountry,
                lat: record.destLat,
                lng: record.destLng,
            },
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
