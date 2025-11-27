import { Shipment, ShipmentType } from './Shipment';
import { User, Customer } from './User';
import { Location, VehicleType } from './types';
import { Drone, Truck, Ship, Vehicle } from './Vehicle';
import { 
    PricingStrategy, 
    AirPricingStrategy, 
    GroundPricingStrategy, 
    SeaPricingStrategy,
    PricingStrategyFactory 
} from './PricingStrategy';

/**
 * ============================================================================
 * SHIPMENT FACTORY - Factory & Abstract Factory Design Patterns
 * ============================================================================
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * 1. Factory Method Pattern: createShipment() creates objects without exposing creation logic
 * 2. Abstract Factory Pattern: VehicleFactory creates families of related objects
 * 
 * OOP PILLARS DEMONSTRATED:
 * 1. ABSTRACTION: Factory interface hides creation complexity
 * 2. POLYMORPHISM: Factory methods return different types based on inputs
 * 3. ENCAPSULATION: Creation logic is hidden inside factory methods
 * 4. INHERITANCE: Concrete factories can extend abstract factory
 */

/**
 * Shipment Creation Result
 * Encapsulates the result of shipment creation
 */
export interface ShipmentCreationResult {
    shipment: Shipment;
    recommendedVehicle: Vehicle;
    pricingStrategy: PricingStrategy;
    estimatedCost: number;
    estimatedDeliveryDays: number;
}

/**
 * Shipment Creation Options
 * ENCAPSULATION: Groups related parameters into a single object
 */
export interface ShipmentOptions {
    trackingId: string;
    weight: number;
    origin: Location;
    destination: Location;
    customer: User;
    urgency?: 'critical' | 'high' | 'standard' | 'low';
    shipmentType?: ShipmentType;
    insuranceValue?: number;
}

/**
 * Vehicle Factory Interface (ABSTRACTION)
 * ===========================================
 * Defines the contract for creating vehicles
 */
export interface IVehicleFactory {
    createVehicle(): Vehicle;
    getVehicleType(): VehicleType;
}

/**
 * Abstract Vehicle Factory (ABSTRACTION + INHERITANCE)
 * ====================================================
 * Base class for all vehicle factories
 */
abstract class AbstractVehicleFactory implements IVehicleFactory {
    // ENCAPSULATION: Protected counter for unique IDs
    protected static idCounter: number = 0;

    abstract createVehicle(): Vehicle;
    abstract getVehicleType(): VehicleType;

    protected generateId(): string {
        return `VEH-${Date.now()}-${++AbstractVehicleFactory.idCounter}`;
    }

    protected generateLicenseId(prefix: string): string {
        return `${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
}

/**
 * Drone Factory (POLYMORPHISM)
 * ============================
 * Concrete factory for creating drones
 */
class DroneFactory extends AbstractVehicleFactory {
    private _maxAltitude: number;

    constructor(maxAltitude: number = 120) {
        super();
        this._maxAltitude = maxAltitude;
    }

    createVehicle(): Drone {
        return new Drone(
            this.generateId(),
            this.generateLicenseId('DRN'),
            this._maxAltitude
        );
    }

    getVehicleType(): VehicleType {
        return VehicleType.DRONE;
    }
}

/**
 * Truck Factory (POLYMORPHISM)
 * ============================
 * Concrete factory for creating trucks
 */
class TruckFactory extends AbstractVehicleFactory {
    private _numberOfAxles: number;

    constructor(numberOfAxles: number = 4) {
        super();
        this._numberOfAxles = numberOfAxles;
    }

    createVehicle(): Truck {
        return new Truck(
            this.generateId(),
            this.generateLicenseId('TRK'),
            this._numberOfAxles
        );
    }

    getVehicleType(): VehicleType {
        return VehicleType.TRUCK;
    }
}

/**
 * Ship Factory (POLYMORPHISM)
 * ===========================
 * Concrete factory for creating ships
 */
class ShipFactory extends AbstractVehicleFactory {
    private _containerCapacity: number;

    constructor(containerCapacity: number = 1000) {
        super();
        this._containerCapacity = containerCapacity;
    }

    createVehicle(): Ship {
        return new Ship(
            this.generateId(),
            this.generateLicenseId('SHP'),
            this._containerCapacity
        );
    }

    getVehicleType(): VehicleType {
        return VehicleType.SHIP;
    }
}

/**
 * ============================================================================
 * SHIPMENT FACTORY - Main Factory Class
 * ============================================================================
 * ENCAPSULATION: All creation logic is hidden inside the factory
 * ABSTRACTION: Clients don't need to know how objects are created
 */
export class ShipmentFactory {
    // ENCAPSULATION: Private static counters and configurations
    private static shipmentCounter: number = 0;
    private static readonly VEHICLE_FACTORIES: Map<VehicleType, IVehicleFactory> = new Map([
        [VehicleType.DRONE, new DroneFactory()],
        [VehicleType.TRUCK, new TruckFactory()],
        [VehicleType.SHIP, new ShipFactory()],
    ]);

    /**
     * Factory Method: Create a complete shipment with all components
     * POLYMORPHISM: Returns different vehicles/strategies based on inputs
     */
    public static createShipment(options: ShipmentOptions): ShipmentCreationResult {
        const {
            trackingId,
            weight,
            origin,
            destination,
            customer,
            urgency = 'standard',
            shipmentType = ShipmentType.STANDARD,
            insuranceValue,
        } = options;

        // Generate unique ID
        const shipmentId = `SHIP-${Date.now()}-${++this.shipmentCounter}`;

        // Create shipment instance
        const shipment = new Shipment(
            shipmentId,
            trackingId,
            weight,
            origin,
            destination,
            customer,
            shipmentType
        );

        // Add insurance if specified
        if (insuranceValue && insuranceValue > 0) {
            shipment.addInsurance(insuranceValue);
        }

        // Determine optimal vehicle and strategy
        const { vehicle, strategy, estimatedDays } = this.determineOptimalDelivery(
            weight,
            origin,
            destination,
            urgency
        );

        // Calculate cost
        shipment.calculateCost(strategy);

        return {
            shipment,
            recommendedVehicle: vehicle,
            pricingStrategy: strategy,
            estimatedCost: shipment.cost,
            estimatedDeliveryDays: estimatedDays,
        };
    }

    /**
     * Simple Factory Method: Quick shipment creation (legacy support)
     */
    public static createSimple(
        trackingId: string,
        weight: number,
        origin: Location,
        destination: Location,
        customer: User,
        urgency: 'high' | 'standard' | 'low' = 'standard'
    ): { shipment: Shipment; recommendedVehicle: Vehicle } {
        const result = this.createShipment({
            trackingId,
            weight,
            origin,
            destination,
            customer,
            urgency: urgency as 'critical' | 'high' | 'standard' | 'low',
        });

        return {
            shipment: result.shipment,
            recommendedVehicle: result.recommendedVehicle,
        };
    }

    /**
     * Create bulk shipments efficiently
     * POLYMORPHISM: Handles different customer types
     */
    public static createBulkShipments(
        shipmentDataList: Omit<ShipmentOptions, 'customer'>[],
        customer: User
    ): ShipmentCreationResult[] {
        return shipmentDataList.map(data => 
            this.createShipment({ ...data, customer })
        );
    }

    /**
     * Create a vehicle using the appropriate factory
     * POLYMORPHISM: Different factories create different vehicle types
     */
    public static createVehicle(type: VehicleType): Vehicle {
        const factory = this.VEHICLE_FACTORIES.get(type);
        if (!factory) {
            throw new Error(`No factory registered for vehicle type: ${type}`);
        }
        return factory.createVehicle();
    }

    /**
     * Get estimated delivery time based on urgency
     */
    public static getEstimatedDeliveryDate(
        origin: Location,
        destination: Location,
        urgency: 'critical' | 'high' | 'standard' | 'low'
    ): Date {
        const distance = this.calculateDistance(origin, destination);
        const { estimatedDays } = this.getDeliveryEstimate(distance, urgency);
        
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
        return deliveryDate;
    }

    // ==================== Private Helper Methods (ENCAPSULATION) ====================

    /**
     * Determine the optimal delivery method
     * ENCAPSULATION: Complex decision logic hidden from clients
     */
    private static determineOptimalDelivery(
        weight: number,
        origin: Location,
        destination: Location,
        urgency: 'critical' | 'high' | 'standard' | 'low'
    ): { vehicle: Vehicle; strategy: PricingStrategy; estimatedDays: number } {
        const distance = this.calculateDistance(origin, destination);
        
        // Decision matrix for vehicle selection
        let vehicleType: VehicleType;
        let strategyType: 'air' | 'ground' | 'sea';

        if (urgency === 'critical' && weight <= 10) {
            // Critical & Very Light -> Priority Drone
            vehicleType = VehicleType.DRONE;
            strategyType = 'air';
        } else if (urgency === 'high' && weight <= 50) {
            // Urgent & Light -> Drone
            vehicleType = VehicleType.DRONE;
            strategyType = 'air';
        } else if (weight > 5000 || urgency === 'low') {
            // Heavy or Not Urgent -> Ship
            vehicleType = VehicleType.SHIP;
            strategyType = 'sea';
        } else if (weight > 1000) {
            // Medium Heavy -> Large Truck
            vehicleType = VehicleType.TRUCK;
            strategyType = 'ground';
        } else {
            // Standard -> Truck
            vehicleType = VehicleType.TRUCK;
            strategyType = 'ground';
        }

        // Create vehicle and strategy
        const vehicle = this.createVehicle(vehicleType);
        const strategy = PricingStrategyFactory.create(strategyType);
        const { estimatedDays } = this.getDeliveryEstimate(distance, urgency);

        return { vehicle, strategy, estimatedDays };
    }

    /**
     * Calculate distance between two points
     */
    private static calculateDistance(from: Location, to: Location): number {
        const latDiff = to.lat - from.lat;
        const lngDiff = to.lng - from.lng;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // km
    }

    /**
     * Get delivery estimate based on distance and urgency
     */
    private static getDeliveryEstimate(
        distance: number,
        urgency: 'critical' | 'high' | 'standard' | 'low'
    ): { estimatedDays: number } {
        const baseDeliveryDays: Record<typeof urgency, number> = {
            critical: 1,
            high: 2,
            standard: 5,
            low: 14,
        };

        // Add days based on distance
        const distanceMultiplier = Math.floor(distance / 1000);
        const estimatedDays = baseDeliveryDays[urgency] + distanceMultiplier;

        return { estimatedDays };
    }

    /**
     * Generate a unique tracking ID
     */
    public static generateTrackingId(): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `TRK-${timestamp}-${random}`;
    }
}

/**
 * ============================================================================
 * SHIPMENT BUILDER - Builder Pattern Bonus!
 * ============================================================================
 * An alternative to Factory for complex object creation with many options
 */
export class ShipmentBuilder {
    private _options: Partial<ShipmentOptions> = {};

    public setTrackingId(trackingId: string): this {
        this._options.trackingId = trackingId;
        return this;
    }

    public setWeight(weight: number): this {
        this._options.weight = weight;
        return this;
    }

    public setOrigin(origin: Location): this {
        this._options.origin = origin;
        return this;
    }

    public setDestination(destination: Location): this {
        this._options.destination = destination;
        return this;
    }

    public setCustomer(customer: User): this {
        this._options.customer = customer;
        return this;
    }

    public setUrgency(urgency: 'critical' | 'high' | 'standard' | 'low'): this {
        this._options.urgency = urgency;
        return this;
    }

    public setShipmentType(type: ShipmentType): this {
        this._options.shipmentType = type;
        return this;
    }

    public setInsurance(value: number): this {
        this._options.insuranceValue = value;
        return this;
    }

    public build(): ShipmentCreationResult {
        // Validate required fields
        const required: (keyof ShipmentOptions)[] = ['trackingId', 'weight', 'origin', 'destination', 'customer'];
        for (const field of required) {
            if (this._options[field] === undefined) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        return ShipmentFactory.createShipment(this._options as ShipmentOptions);
    }

    public static create(): ShipmentBuilder {
        return new ShipmentBuilder();
    }
}
