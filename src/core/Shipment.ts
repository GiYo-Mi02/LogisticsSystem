import { Location, ShipmentStatus } from './types';
import { PricingStrategy } from './PricingStrategy';
import { Vehicle } from './Vehicle';
import { User } from './User';
import { BaseEntity } from './base/BaseEntity';
import { ITrackable, TrackingEvent } from './interfaces/ITrackable';
import { IPayable, PaymentRecord } from './interfaces/IPayable';

/**
 * ============================================================================
 * SHIPMENT CLASS - Demonstrating All Four OOP Pillars
 * ============================================================================
 * 
 * 1. ENCAPSULATION: Private fields with getters/setters, protected internal state
 * 2. ABSTRACTION: Implements ITrackable and IPayable interfaces
 * 3. INHERITANCE: Extends BaseEntity for common functionality
 * 4. POLYMORPHISM: Strategy pattern for pricing (different strategies for different calculations)
 * 
 * DESIGN PATTERN: Strategy Pattern - PricingStrategy allows runtime selection of algorithm
 */

/**
 * ShipmentType Enum
 * Categorizes shipments for priority and handling
 */
export enum ShipmentType {
    STANDARD = 'STANDARD',
    EXPRESS = 'EXPRESS',
    OVERNIGHT = 'OVERNIGHT',
    FRAGILE = 'FRAGILE',
    HAZARDOUS = 'HAZARDOUS',
}

/**
 * Shipment Class
 * ==============
 * INHERITANCE: Extends BaseEntity for ID, timestamps, and validation
 * ABSTRACTION: Implements ITrackable and IPayable for tracking and payments
 * ENCAPSULATION: Private fields protect internal state integrity
 */
export class Shipment extends BaseEntity implements ITrackable, IPayable {
    // ==================== ENCAPSULATION: Private Fields ====================
    private _trackingId: string;
    private _weight: number;
    private _origin: Location;
    private _destination: Location;
    private _customer: User;
    private _status: ShipmentStatus;
    private _type: ShipmentType;
    private _cost: number;
    private _assignedVehicle: Vehicle | null;
    private _estimatedDeliveryTime: Date | null;
    private _actualDeliveryTime: Date | null;
    private _trackingHistory: TrackingEvent[];
    private _paymentHistory: PaymentRecord[];
    private _notes: string[];
    private _signature: string | null;
    private _insuranceValue: number;
    private _isInsured: boolean;

    constructor(
        id: string,
        trackingId: string,
        weight: number,
        origin: Location,
        destination: Location,
        customer: User,
        type: ShipmentType = ShipmentType.STANDARD
    ) {
        super(id); // INHERITANCE: Call parent constructor

        // ENCAPSULATION: Initialize private fields
        this._trackingId = trackingId;
        this._weight = weight;
        this._origin = { ...origin }; // Copy to prevent external mutation
        this._destination = { ...destination };
        this._customer = customer;
        this._status = ShipmentStatus.PENDING;
        this._type = type;
        this._cost = 0;
        this._assignedVehicle = null;
        this._estimatedDeliveryTime = null;
        this._actualDeliveryTime = null;
        this._trackingHistory = [];
        this._paymentHistory = [];
        this._notes = [];
        this._signature = null;
        this._insuranceValue = 0;
        this._isInsured = false;

        // Initialize tracking
        this.addTrackingEvent('Shipment created', this._origin);
    }

    // ==================== ENCAPSULATION: Getters (Read-only access) ====================

    public get trackingId(): string {
        return this._trackingId;
    }

    public get weight(): number {
        return this._weight;
    }

    public get origin(): Location {
        return { ...this._origin }; // Return copy for ENCAPSULATION
    }

    public get destination(): Location {
        return { ...this._destination };
    }

    public get customer(): User {
        return this._customer;
    }

    public get status(): ShipmentStatus {
        return this._status;
    }

    public get type(): ShipmentType {
        return this._type;
    }

    public get cost(): number {
        return this._cost;
    }

    public get assignedVehicle(): Vehicle | null {
        return this._assignedVehicle;
    }

    public get estimatedDeliveryTime(): Date | null {
        return this._estimatedDeliveryTime ? new Date(this._estimatedDeliveryTime) : null;
    }

    public get actualDeliveryTime(): Date | null {
        return this._actualDeliveryTime ? new Date(this._actualDeliveryTime) : null;
    }

    public get isInsured(): boolean {
        return this._isInsured;
    }

    public get insuranceValue(): number {
        return this._insuranceValue;
    }

    public get notes(): readonly string[] {
        return Object.freeze([...this._notes]);
    }

    public get signature(): string | null {
        return this._signature;
    }

    /**
     * Calculate distance in kilometers (read-only computed property)
     */
    public get distanceKm(): number {
        const latDiff = this._destination.lat - this._origin.lat;
        const lngDiff = this._destination.lng - this._origin.lng;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    }

    // ==================== ENCAPSULATION: Controlled Setters ====================

    /**
     * Update shipment type with validation
     * ENCAPSULATION: Cannot change type once in transit
     */
    public setType(type: ShipmentType): void {
        if (this._status !== ShipmentStatus.PENDING) {
            throw new Error('Cannot change shipment type after processing has started');
        }
        this._type = type;
        this.touch();
        this.addTrackingEvent(`Shipment type changed to ${type}`, this.getCurrentLocation());
    }

    /**
     * STRATEGY PATTERN: Calculate cost using different strategies
     * POLYMORPHISM: The strategy interface allows for different pricing algorithms
     */
    public calculateCost(strategy: PricingStrategy): void {
        const distance = this.distanceKm;
        let baseCost = strategy.calculate(this._weight, distance);

        // Apply type multipliers (ENCAPSULATION: business logic hidden internally)
        const typeMultipliers: Record<ShipmentType, number> = {
            [ShipmentType.STANDARD]: 1.0,
            [ShipmentType.EXPRESS]: 1.5,
            [ShipmentType.OVERNIGHT]: 2.0,
            [ShipmentType.FRAGILE]: 1.3,
            [ShipmentType.HAZARDOUS]: 2.5,
        };

        this._cost = baseCost * typeMultipliers[this._type];

        // Add insurance cost if applicable
        if (this._isInsured) {
            this._cost += this._insuranceValue * 0.02; // 2% of insured value
        }

        this.touch();
        console.log(`Cost calculated for shipment ${this._trackingId}: $${this._cost.toFixed(2)}`);
        this.addTrackingEvent(`Cost calculated: $${this._cost.toFixed(2)}`, this.getCurrentLocation());
    }

    // ==================== Business Logic Methods ====================

    /**
     * Assign vehicle to shipment
     * ENCAPSULATION: Validates capacity before assignment
     */
    public assignVehicle(vehicle: Vehicle): void {
        if (vehicle.capacity < this._weight) {
            throw new Error(`Vehicle ${vehicle.licenseId} capacity insufficient for shipment ${this._trackingId}`);
        }

        if (this._status !== ShipmentStatus.PENDING && this._status !== ShipmentStatus.ASSIGNED) {
            throw new Error(`Cannot assign vehicle to shipment with status ${this._status}`);
        }

        this._assignedVehicle = vehicle;
        this._status = ShipmentStatus.ASSIGNED;
        this.touch();

        console.log(`Vehicle ${vehicle.licenseId} assigned to shipment ${this._trackingId}`);
        this.addTrackingEvent(`Assigned to vehicle ${vehicle.licenseId}`, this.getCurrentLocation());
    }

    /**
     * Update shipment status with validation
     * ENCAPSULATION: Enforces valid state transitions
     */
    public updateStatus(newStatus: ShipmentStatus): void {
        // Validate state transition (simplified state machine)
        const validTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
            [ShipmentStatus.PENDING]: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
            [ShipmentStatus.ASSIGNED]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
            [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
            [ShipmentStatus.DELIVERED]: [], // Final state
            [ShipmentStatus.CANCELLED]: [], // Final state
        };

        if (!validTransitions[this._status]?.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${this._status} to ${newStatus}`);
        }

        const oldStatus = this._status;
        this._status = newStatus;

        if (newStatus === ShipmentStatus.DELIVERED) {
            this._actualDeliveryTime = new Date();
        }

        this.touch();
        console.log(`Shipment ${this._trackingId} status updated: ${oldStatus} → ${newStatus}`);
        this.addTrackingEvent(`Status changed to ${newStatus}`, this.getCurrentLocation());
    }

    /**
     * Set estimated delivery time
     */
    public setEstimatedDelivery(time: Date): void {
        if (time < new Date()) {
            throw new Error('Estimated delivery time cannot be in the past');
        }
        this._estimatedDeliveryTime = new Date(time);
        this.touch();
        this.addTrackingEvent(`Estimated delivery: ${time.toISOString()}`, this.getCurrentLocation());
    }

    /**
     * Add insurance to shipment
     * ENCAPSULATION: Can only add insurance before pickup
     */
    public addInsurance(value: number): void {
        if (this._status !== ShipmentStatus.PENDING) {
            throw new Error('Insurance can only be added before pickup');
        }
        if (value < 0) {
            throw new Error('Insurance value cannot be negative');
        }
        this._insuranceValue = value;
        this._isInsured = true;
        this.touch();
        this.addTrackingEvent(`Insurance added: $${value}`, this.getCurrentLocation());
    }

    /**
     * Add a note to the shipment
     */
    public addNote(note: string): void {
        if (note.trim().length === 0) {
            throw new Error('Note cannot be empty');
        }
        this._notes.push(`[${new Date().toISOString()}] ${note}`);
        this.touch();
    }

    /**
     * Record delivery signature
     * ENCAPSULATION: Only allowed upon delivery
     */
    public recordSignature(signature: string): void {
        if (this._status !== ShipmentStatus.DELIVERED) {
            throw new Error('Signature can only be recorded upon delivery');
        }
        this._signature = signature;
        this.touch();
        this.addTrackingEvent('Delivery signature recorded', this._destination);
    }

    // ==================== ITrackable Implementation ====================

    public getTrackingId(): string {
        return this._trackingId;
    }

    public getStatus(): string {
        return this._status;
    }

    public getCurrentLocation(): Location {
        // Return current location based on status
        switch (this._status) {
            case ShipmentStatus.PENDING:
                return { ...this._origin };
            case ShipmentStatus.DELIVERED:
                return { ...this._destination };
            default:
                // If vehicle assigned, use its location; otherwise estimate
                if (this._assignedVehicle) {
                    return this._assignedVehicle.getCurrentLocation();
                }
                return { ...this._origin };
        }
    }

    public getTrackingHistory(): TrackingEvent[] {
        return [...this._trackingHistory]; // Return copy for ENCAPSULATION
    }

    // ==================== IPayable Implementation ====================

    public processPayment(amount: number, method: string): PaymentRecord {
        if (amount <= 0) {
            throw new Error('Payment amount must be positive');
        }

        const record: PaymentRecord = {
            id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount,
            method,
            timestamp: new Date(),
            status: 'completed',
        };

        this._paymentHistory.push(record);
        this.touch();
        console.log(`Payment of $${amount} processed for shipment ${this._trackingId}`);
        this.addTrackingEvent(`Payment received: $${amount} via ${method}`, this.getCurrentLocation());

        return record;
    }

    public refund(paymentId: string, amount?: number): PaymentRecord {
        const originalPayment = this._paymentHistory.find(p => p.id === paymentId);
        if (!originalPayment) {
            throw new Error(`Payment ${paymentId} not found`);
        }

        const refundAmount = amount ?? originalPayment.amount;
        if (refundAmount > originalPayment.amount) {
            throw new Error('Refund amount cannot exceed original payment');
        }

        const refundRecord: PaymentRecord = {
            id: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount: -refundAmount,
            method: originalPayment.method,
            timestamp: new Date(),
            status: 'refunded',
            refundedPaymentId: paymentId,
        };

        this._paymentHistory.push(refundRecord);
        this.touch();
        console.log(`Refund of $${refundAmount} processed for shipment ${this._trackingId}`);
        this.addTrackingEvent(`Refund issued: $${refundAmount}`, this.getCurrentLocation());

        return refundRecord;
    }

    public getPaymentHistory(): PaymentRecord[] {
        return [...this._paymentHistory];
    }

    // ==================== BaseEntity Implementation ====================

    public validate(): boolean {
        return (
            this._trackingId.length > 0 &&
            this._weight > 0 &&
            this._origin.lat !== undefined &&
            this._origin.lng !== undefined &&
            this._destination.lat !== undefined &&
            this._destination.lng !== undefined &&
            this._customer !== null
        );
    }

    public toJSON(): object {
        return {
            id: this.id,
            trackingId: this._trackingId,
            weight: this._weight,
            origin: this._origin,
            destination: this._destination,
            customerId: this._customer.id,
            status: this._status,
            type: this._type,
            cost: this._cost,
            assignedVehicleId: this._assignedVehicle?.id ?? null,
            estimatedDeliveryTime: this._estimatedDeliveryTime?.toISOString() ?? null,
            actualDeliveryTime: this._actualDeliveryTime?.toISOString() ?? null,
            isInsured: this._isInsured,
            insuranceValue: this._insuranceValue,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    // ==================== Private Helper Methods ====================

    private addTrackingEvent(description: string, location: Location): void {
        this._trackingHistory.push({
            timestamp: new Date(),
            status: this._status,
            location: { ...location },
            description,
        });
    }
}
