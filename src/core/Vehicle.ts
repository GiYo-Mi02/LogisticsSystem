import { Location, Route, VehicleType } from './types';
import { ITrackable, TrackingEvent } from './interfaces/ITrackable';
import { BaseEntity } from './base/BaseEntity';

/**
 * ============================================================================
 * VEHICLE CLASS HIERARCHY - Demonstrating All Four OOP Pillars
 * ============================================================================
 * 
 * 1. ENCAPSULATION: Private fields with getters/setters, internal state protection
 * 2. ABSTRACTION: Abstract class with abstract method move(), ITrackable interface
 * 3. INHERITANCE: Drone, Truck, Ship extend Vehicle; Vehicle extends BaseEntity
 * 4. POLYMORPHISM: Each vehicle type implements move() differently
 */

/**
 * VehicleStatus Enum
 * Encapsulates the possible states of a vehicle
 */
export enum VehicleStatus {
    IDLE = 'IDLE',
    IN_TRANSIT = 'IN_TRANSIT',
    MAINTENANCE = 'MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

/**
 * Abstract Vehicle Class
 * ======================
 * ABSTRACTION: Defines the common interface for all vehicle types.
 * INHERITANCE: Extends BaseEntity, implements ITrackable.
 * ENCAPSULATION: Private fields with controlled access.
 * 
 * This is an ABSTRACT class - you cannot instantiate it directly.
 * You MUST use one of the concrete subclasses: Drone, Truck, or Ship.
 */
export abstract class Vehicle extends BaseEntity implements ITrackable {
    // ENCAPSULATION: Private fields - cannot be accessed directly
    private _licenseId: string;
    private _type: VehicleType;
    private _capacity: number;
    private _currentFuel: number;
    private _maxFuel: number;
    private _status: VehicleStatus;
    private _currentLocation: Location;
    private _trackingHistory: TrackingEvent[];

    // Protected field - accessible by subclasses
    protected maintenanceLog: string[] = [];

    constructor(
        id: string,
        licenseId: string,
        type: VehicleType,
        capacity: number,
        maxFuel: number
    ) {
        super(id); // INHERITANCE: Call parent constructor
        this._licenseId = licenseId;
        this._type = type;
        this._capacity = capacity;
        this._maxFuel = maxFuel;
        this._currentFuel = maxFuel; // Start with full tank
        this._status = VehicleStatus.IDLE;
        this._currentLocation = { lat: 0, lng: 0 };
        this._trackingHistory = [];

        this.addTrackingEvent('Vehicle registered in system');
    }

    // ==================== ENCAPSULATION: Getters (Read-only access) ====================

    public get licenseId(): string {
        return this._licenseId;
    }

    public get type(): VehicleType {
        return this._type;
    }

    public get capacity(): number {
        return this._capacity;
    }

    public get currentFuel(): number {
        return this._currentFuel;
    }

    public get maxFuel(): number {
        return this._maxFuel;
    }

    public get status(): VehicleStatus {
        return this._status;
    }

    public get fuelPercentage(): number {
        return Math.round((this._currentFuel / this._maxFuel) * 100);
    }

    // ==================== ENCAPSULATION: Controlled Setters ====================

    /**
     * Update vehicle status with validation
     * ENCAPSULATION: Business rules are enforced internally
     */
    public setStatus(newStatus: VehicleStatus): void {
        // Validate state transition
        if (this._status === VehicleStatus.OUT_OF_SERVICE && newStatus !== VehicleStatus.MAINTENANCE) {
            throw new Error('Out of service vehicles must go to maintenance first');
        }

        const oldStatus = this._status;
        this._status = newStatus;
        this.touch();
        this.addTrackingEvent(`Status changed from ${oldStatus} to ${newStatus}`);
    }

    /**
     * Update location
     * ENCAPSULATION: Automatically adds to tracking history
     */
    public setLocation(location: Location): void {
        this._currentLocation = { ...location };
        this.touch();
        this.addTrackingEvent(`Moved to coordinates (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
    }

    // ==================== ABSTRACTION: Abstract Methods ====================

    /**
     * Abstract method for movement calculation.
     * POLYMORPHISM: Each subclass implements this differently:
     * - Drone: Straight line (geodesic) flight path
     * - Truck: Road network with turns
     * - Ship: Maritime routes with sea lane considerations
     */
    abstract move(from: Location, to: Location): Route;

    /**
     * Abstract method for calculating fuel consumption.
     * POLYMORPHISM: Different vehicles consume fuel at different rates.
     */
    abstract calculateFuelConsumption(distance: number): number;

    /**
     * Abstract method for maximum speed.
     * POLYMORPHISM: Each vehicle type has different speed characteristics.
     */
    abstract getMaxSpeed(): number;

    // ==================== ITrackable Implementation ====================

    public getTrackingId(): string {
        return this._licenseId;
    }

    public getStatus(): string {
        return this._status;
    }

    public getCurrentLocation(): Location {
        return { ...this._currentLocation }; // Return copy for ENCAPSULATION
    }

    public getTrackingHistory(): TrackingEvent[] {
        return [...this._trackingHistory]; // Return copy for ENCAPSULATION
    }

    // ==================== Common Methods (Inherited by all subclasses) ====================

    /**
     * Refuel the vehicle
     * ENCAPSULATION: Validates and constrains fuel amount
     */
    public refuel(amount: number): void {
        if (amount < 0) {
            throw new Error('Fuel amount cannot be negative');
        }

        const newFuel = Math.min(this._currentFuel + amount, this._maxFuel);
        const actualAdded = newFuel - this._currentFuel;
        this._currentFuel = newFuel;
        this.touch();

        console.log(`${this._type} ${this._licenseId} refueled +${actualAdded}. Current: ${this._currentFuel}/${this._maxFuel}`);
        this.addTrackingEvent(`Refueled: +${actualAdded} units`);
    }

    /**
     * Consume fuel during travel
     * ENCAPSULATION: Protected method for subclass use
     */
    protected consumeFuel(amount: number): boolean {
        if (amount > this._currentFuel) {
            console.warn(`${this._type} ${this._licenseId} has insufficient fuel!`);
            return false;
        }
        this._currentFuel -= amount;
        this.touch();
        return true;
    }

    /**
     * Check if vehicle can carry the given weight
     */
    public canCarry(weight: number): boolean {
        return weight <= this._capacity;
    }

    /**
     * Add maintenance record
     * ENCAPSULATION: Protected maintenance log
     */
    public performMaintenance(description: string): void {
        this._status = VehicleStatus.MAINTENANCE;
        this.maintenanceLog.push(`[${new Date().toISOString()}] ${description}`);
        this.touch();
        this.addTrackingEvent(`Maintenance: ${description}`);
    }

    public getMaintenanceHistory(): readonly string[] {
        return Object.freeze([...this.maintenanceLog]);
    }

    // ==================== BaseEntity Implementation ====================

    public validate(): boolean {
        return (
            this._licenseId.length > 0 &&
            this._capacity > 0 &&
            this._currentFuel >= 0 &&
            this._currentFuel <= this._maxFuel
        );
    }

    public toJSON(): object {
        return {
            id: this.id,
            licenseId: this._licenseId,
            type: this._type,
            capacity: this._capacity,
            currentFuel: this._currentFuel,
            maxFuel: this._maxFuel,
            status: this._status,
            currentLocation: this._currentLocation,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    // ==================== Private Helper Methods ====================

    private addTrackingEvent(description: string): void {
        this._trackingHistory.push({
            timestamp: new Date(),
            status: this._status,
            location: { ...this._currentLocation },
            description,
        });
    }
}

/**
 * ============================================================================
 * DRONE CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends Vehicle
 * POLYMORPHISM: Implements abstract methods with drone-specific behavior
 */
export class Drone extends Vehicle {
    // ENCAPSULATION: Drone-specific private fields
    private _maxAltitude: number;
    private _currentAltitude: number = 0;
    private _batteryHealth: number = 100;

    constructor(id: string, licenseId: string, maxAltitude: number = 120) {
        // INHERITANCE: Call parent constructor with drone-specific values
        super(id, licenseId, VehicleType.DRONE, 50, 100); // 50kg capacity, 100 battery units
        this._maxAltitude = maxAltitude;
    }

    // ENCAPSULATION: Drone-specific getters
    public get maxAltitude(): number {
        return this._maxAltitude;
    }

    public get currentAltitude(): number {
        return this._currentAltitude;
    }

    public get batteryHealth(): number {
        return this._batteryHealth;
    }

    /**
     * POLYMORPHISM: Drone-specific movement (straight line flight)
     * Drones fly in geodesic paths - the shortest distance between two points.
     */
    move(from: Location, to: Location): Route {
        console.log('Drone calculating geodesic flight path...');

        // Haversine-inspired distance calculation (simplified)
        const latDiff = to.lat - from.lat;
        const lngDiff = to.lng - from.lng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Convert to km

        // Consume fuel
        const fuelNeeded = this.calculateFuelConsumption(distance);
        this.consumeFuel(fuelNeeded);

        // Update location
        this.setLocation(to);

        return {
            path: [from, to], // Direct path
            distance: distance,
            estimatedTime: distance / this.getMaxSpeed() * 60, // Minutes
        };
    }

    /**
     * POLYMORPHISM: Drone fuel consumption (battery drain)
     * Drones are efficient but have limited range
     */
    calculateFuelConsumption(distance: number): number {
        // 0.5 battery units per km, plus altitude factor
        return distance * 0.5 * (1 + this._currentAltitude / this._maxAltitude * 0.2);
    }

    /**
     * POLYMORPHISM: Drone max speed (fast but affected by weather)
     */
    getMaxSpeed(): number {
        return 60; // 60 km/h
    }

    // Drone-specific methods
    public takeOff(targetAltitude: number): void {
        if (targetAltitude > this._maxAltitude) {
            throw new Error(`Cannot exceed max altitude of ${this._maxAltitude}m`);
        }
        this._currentAltitude = targetAltitude;
        console.log(`Drone ${this.licenseId} taking off to ${targetAltitude}m`);
    }

    public land(): void {
        this._currentAltitude = 0;
        console.log(`Drone ${this.licenseId} landing`);
    }

    public scanTerrain(): { obstacles: number; clearPath: boolean } {
        console.log('Scanning terrain for obstacles...');
        return { obstacles: 0, clearPath: true };
    }

    public checkBatteryHealth(): void {
        // Degradation simulation
        this._batteryHealth = Math.max(0, this._batteryHealth - 0.1);
    }
}

/**
 * ============================================================================
 * TRUCK CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends Vehicle
 * POLYMORPHISM: Implements abstract methods with truck-specific behavior
 */
export class Truck extends Vehicle {
    // ENCAPSULATION: Truck-specific private fields
    private _numberOfAxles: number;
    private _trailerAttached: boolean = false;
    private _mileage: number = 0;

    constructor(id: string, licenseId: string, numberOfAxles: number = 4) {
        // INHERITANCE: Trucks have high capacity and large fuel tanks
        super(id, licenseId, VehicleType.TRUCK, 5000, 500); // 5000kg, 500L fuel
        this._numberOfAxles = numberOfAxles;
    }

    // ENCAPSULATION: Truck-specific getters
    public get numberOfAxles(): number {
        return this._numberOfAxles;
    }

    public get trailerAttached(): boolean {
        return this._trailerAttached;
    }

    public get mileage(): number {
        return this._mileage;
    }

    /**
     * POLYMORPHISM: Truck-specific movement (road network)
     * Trucks follow roads - Manhattan distance approximation
     */
    move(from: Location, to: Location): Route {
        console.log('Truck calculating road network path...');

        // Manhattan distance - trucks can't fly in straight lines
        const latDiff = Math.abs(to.lat - from.lat);
        const lngDiff = Math.abs(to.lng - from.lng);
        const distance = (latDiff + lngDiff) * 111; // Convert to km

        // Consume fuel
        const fuelNeeded = this.calculateFuelConsumption(distance);
        this.consumeFuel(fuelNeeded);

        // Update mileage
        this._mileage += distance;

        // Update location
        this.setLocation(to);

        // Create L-shaped path (simplified road simulation)
        const waypoint: Location = { lat: to.lat, lng: from.lng };

        return {
            path: [from, waypoint, to],
            distance: distance,
            estimatedTime: distance / this.getMaxSpeed() * 60, // Minutes
        };
    }

    /**
     * POLYMORPHISM: Truck fuel consumption
     * Trucks use more fuel, especially with trailers
     */
    calculateFuelConsumption(distance: number): number {
        // Base: 0.3L per km, trailer adds 50%
        const baseFuel = distance * 0.3;
        return this._trailerAttached ? baseFuel * 1.5 : baseFuel;
    }

    /**
     * POLYMORPHISM: Truck max speed (highway limits)
     */
    getMaxSpeed(): number {
        return this._trailerAttached ? 70 : 90; // km/h
    }

    // Truck-specific methods
    public attachTrailer(): void {
        this._trailerAttached = true;
        console.log(`Trailer attached to truck ${this.licenseId}`);
    }

    public detachTrailer(): void {
        this._trailerAttached = false;
        console.log(`Trailer detached from truck ${this.licenseId}`);
    }

    public checkTireCondition(): { condition: string; needsReplacement: boolean } {
        const condition = this._mileage > 50000 ? 'worn' : 'good';
        return { condition, needsReplacement: this._mileage > 80000 };
    }
}

/**
 * ============================================================================
 * SHIP CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends Vehicle
 * POLYMORPHISM: Implements abstract methods with ship-specific behavior
 */
export class Ship extends Vehicle {
    // ENCAPSULATION: Ship-specific private fields
    private _containerCapacity: number;
    private _currentContainers: number = 0;
    private _draftDepth: number; // How deep the ship sits in water

    constructor(id: string, licenseId: string, containerCapacity: number = 1000) {
        // INHERITANCE: Ships have massive capacity but huge fuel tanks
        super(id, licenseId, VehicleType.SHIP, 50000, 10000); // 50000kg, 10000 units
        this._containerCapacity = containerCapacity;
        this._draftDepth = 10; // meters
    }

    // ENCAPSULATION: Ship-specific getters
    public get containerCapacity(): number {
        return this._containerCapacity;
    }

    public get currentContainers(): number {
        return this._currentContainers;
    }

    public get draftDepth(): number {
        return this._draftDepth;
    }

    /**
     * POLYMORPHISM: Ship-specific movement (maritime routes)
     * Ships follow sea lanes, which are longer than direct paths
     */
    move(from: Location, to: Location): Route {
        console.log('Ship calculating maritime route...');

        // Ships take longer routes due to sea lanes and ports
        const directDistance = Math.sqrt(
            Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)
        );
        const distance = directDistance * 111 * 1.3; // 30% longer for sea routes

        // Consume fuel
        const fuelNeeded = this.calculateFuelConsumption(distance);
        this.consumeFuel(fuelNeeded);

        // Update location
        this.setLocation(to);

        return {
            path: [from, to],
            distance: distance,
            estimatedTime: distance / this.getMaxSpeed() * 60, // Minutes
        };
    }

    /**
     * POLYMORPHISM: Ship fuel consumption
     * Ships are most efficient per kg of cargo but use lots of fuel overall
     */
    calculateFuelConsumption(distance: number): number {
        // Base: 5 units per km, increases with load
        const loadFactor = 1 + (this._currentContainers / this._containerCapacity) * 0.5;
        return distance * 5 * loadFactor;
    }

    /**
     * POLYMORPHISM: Ship max speed (slow but steady)
     */
    getMaxSpeed(): number {
        return 35; // 35 km/h (about 19 knots)
    }

    // Ship-specific methods
    public loadContainers(count: number): boolean {
        if (this._currentContainers + count > this._containerCapacity) {
            console.warn('Cannot exceed container capacity');
            return false;
        }
        this._currentContainers += count;
        this._draftDepth += count * 0.01; // Ship sits lower with more cargo
        console.log(`Loaded ${count} containers. Total: ${this._currentContainers}`);
        return true;
    }

    public unloadContainers(count: number): boolean {
        if (count > this._currentContainers) {
            console.warn('Cannot unload more containers than onboard');
            return false;
        }
        this._currentContainers -= count;
        this._draftDepth = Math.max(8, this._draftDepth - count * 0.01);
        console.log(`Unloaded ${count} containers. Remaining: ${this._currentContainers}`);
        return true;
    }

    public checkPortCompatibility(portDepth: number): boolean {
        return portDepth >= this._draftDepth + 2; // 2m safety margin
    }
}
