import { UserRole } from './types';
import { INotifiable, NotificationType, NotificationPreferences } from './interfaces/INotifiable';
import { BaseEntity } from './base/BaseEntity';

/**
 * ============================================================================
 * USER CLASS HIERARCHY - Demonstrating All Four OOP Pillars
 * ============================================================================
 * 
 * 1. ENCAPSULATION: Private fields (_email, _password) with getters/setters
 * 2. ABSTRACTION: Abstract class with abstract method viewDashboard()
 * 3. INHERITANCE: Customer, Driver, Admin extend User
 * 4. POLYMORPHISM: Each subclass implements viewDashboard() differently
 */

/**
 * Abstract User Class
 * ===================
 * ABSTRACTION: Defines the contract for all user types.
 * INHERITANCE: Extends BaseEntity for common entity functionality.
 * ENCAPSULATION: Protects sensitive data like password and email.
 */
export abstract class User extends BaseEntity implements INotifiable {
    // ENCAPSULATION: Private fields with controlled access
    private _name: string;
    private _email: string;
    private _password: string;
    private _notificationPrefs: NotificationPreferences;
    private _notifications: { message: string; type: NotificationType; timestamp: Date }[] = [];

    // Protected field - accessible by subclasses only
    protected readonly role: UserRole;

    constructor(
        id: string,
        name: string,
        email: string,
        role: UserRole
    ) {
        super(id); // INHERITANCE: Call parent constructor
        this._name = name;
        this._email = email;
        this._password = '';
        this.role = role;
        this._notificationPrefs = { email: true, sms: false, push: true };
    }

    // ==================== ENCAPSULATION: Getters & Setters ====================

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        if (value.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        this._name = value.trim();
        this.touch(); // Update timestamp
    }

    public get email(): string {
        return this._email;
    }

    public set email(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Invalid email format');
        }
        this._email = value.toLowerCase();
        this.touch();
    }

    // Password is write-only for security (no getter)
    public set password(value: string) {
        if (value.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        // In real app, this would be hashed
        this._password = value;
        this.touch();
    }

    public getRole(): UserRole {
        return this.role;
    }

    // ==================== ABSTRACTION: Abstract Methods ====================

    /**
     * Abstract method to be implemented by concrete classes.
     * Each user type sees a different dashboard.
     * POLYMORPHISM: Same method signature, different behavior.
     */
    abstract viewDashboard(): string;

    /**
     * Abstract method for role-specific actions
     */
    abstract getPermissions(): string[];

    // ==================== INotifiable Implementation ====================

    public notify(message: string, type: NotificationType): void {
        this._notifications.push({ message, type, timestamp: new Date() });
        console.log(`[${type}] Notification for ${this._name}: ${message}`);
    }

    public getNotificationPreferences(): NotificationPreferences {
        // Return a copy to prevent external modification (ENCAPSULATION)
        return { ...this._notificationPrefs };
    }

    public setNotificationPreferences(prefs: NotificationPreferences): void {
        this._notificationPrefs = { ...prefs };
        this.touch();
    }

    public getNotifications(): readonly { message: string; type: NotificationType; timestamp: Date }[] {
        return Object.freeze([...this._notifications]);
    }

    // ==================== BaseEntity Implementation ====================

    public validate(): boolean {
        return this._name.length >= 2 && this._email.includes('@');
    }

    public toJSON(): object {
        return {
            id: this.id,
            name: this._name,
            email: this._email,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    // ==================== Common Methods ====================

    public login(): void {
        console.log(`${this.role} ${this._name} logged in.`);
    }

    public logout(): void {
        console.log(`${this.role} ${this._name} logged out.`);
    }
}

/**
 * ============================================================================
 * CUSTOMER CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends User
 * POLYMORPHISM: Implements abstract methods with customer-specific behavior
 */
export class Customer extends User {
    // ENCAPSULATION: Customer-specific private field
    private _loyaltyPoints: number = 0;
    private _shipmentHistory: string[] = [];

    constructor(id: string, name: string, email: string) {
        super(id, name, email, UserRole.CUSTOMER); // INHERITANCE
    }

    // POLYMORPHISM: Customer-specific dashboard
    viewDashboard(): string {
        return 'Displaying Customer Dashboard: Active Shipments, Create New Shipment, Track Orders';
    }

    // POLYMORPHISM: Customer-specific permissions
    getPermissions(): string[] {
        return ['create_shipment', 'track_shipment', 'view_history', 'update_profile'];
    }

    // Customer-specific methods
    public get loyaltyPoints(): number {
        return this._loyaltyPoints;
    }

    public addLoyaltyPoints(points: number): void {
        if (points < 0) throw new Error('Points cannot be negative');
        this._loyaltyPoints += points;
        this.touch();
    }

    public redeemPoints(points: number): boolean {
        if (points > this._loyaltyPoints) return false;
        this._loyaltyPoints -= points;
        this.touch();
        return true;
    }

    public createShipment(details: any): string {
        const trackingId = `TRK-${Date.now()}`;
        this._shipmentHistory.push(trackingId);
        console.log('Shipment created:', details);
        return trackingId;
    }

    public trackShipment(trackingId: string): void {
        console.log(`Tracking shipment: ${trackingId}`);
    }

    public getShipmentHistory(): readonly string[] {
        return Object.freeze([...this._shipmentHistory]);
    }
}

/**
 * ============================================================================
 * DRIVER CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends User
 * POLYMORPHISM: Implements abstract methods with driver-specific behavior
 */
export class Driver extends User {
    // ENCAPSULATION: Driver-specific private fields
    private _currentVehicleId: string | null = null;
    private _currentLocation: { lat: number; lng: number } | null = null;
    private _isAvailable: boolean = true;
    private _completedDeliveries: number = 0;
    private _rating: number = 5.0;

    constructor(id: string, name: string, email: string) {
        super(id, name, email, UserRole.DRIVER);
    }

    // POLYMORPHISM: Driver-specific dashboard
    viewDashboard(): string {
        return 'Displaying Driver Dashboard: Current Assignment, Route Map, Earnings';
    }

    // POLYMORPHISM: Driver-specific permissions
    getPermissions(): string[] {
        return ['view_assignments', 'accept_job', 'update_location', 'mark_delivered', 'view_earnings'];
    }

    // ENCAPSULATION: Getters
    public get currentVehicleId(): string | null {
        return this._currentVehicleId;
    }

    public get isAvailable(): boolean {
        return this._isAvailable;
    }

    public get completedDeliveries(): number {
        return this._completedDeliveries;
    }

    public get rating(): number {
        return this._rating;
    }

    // ENCAPSULATION: Controlled setters
    public assignVehicle(vehicleId: string): void {
        this._currentVehicleId = vehicleId;
        this.touch();
        console.log(`Vehicle ${vehicleId} assigned to driver ${this.name}`);
    }

    public unassignVehicle(): void {
        this._currentVehicleId = null;
        this.touch();
    }

    public acceptJob(shipmentId: string): void {
        this._isAvailable = false;
        this.touch();
        console.log(`Driver ${this.name} accepted job ${shipmentId}`);
    }

    public completeDelivery(): void {
        this._completedDeliveries++;
        this._isAvailable = true;
        this.touch();
    }

    public updateLocation(lat: number, lng: number): void {
        this._currentLocation = { lat, lng };
        console.log(`Driver ${this.name} location updated: ${lat}, ${lng}`);
    }

    public getCurrentLocation(): { lat: number; lng: number } | null {
        return this._currentLocation ? { ...this._currentLocation } : null;
    }

    public updateRating(newRating: number): void {
        if (newRating < 1 || newRating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        // Calculate average
        const totalRatings = this._completedDeliveries || 1;
        this._rating = ((this._rating * totalRatings) + newRating) / (totalRatings + 1);
        this.touch();
    }
}

/**
 * ============================================================================
 * ADMIN CLASS - Concrete Implementation
 * ============================================================================
 * INHERITANCE: Extends User
 * POLYMORPHISM: Implements abstract methods with admin-specific behavior
 */
export class Admin extends User {
    // ENCAPSULATION: Admin-specific private fields
    private _accessLevel: 'super' | 'standard' = 'standard';
    private _managedRegions: string[] = [];

    constructor(id: string, name: string, email: string, accessLevel: 'super' | 'standard' = 'standard') {
        super(id, name, email, UserRole.ADMIN);
        this._accessLevel = accessLevel;
    }

    // POLYMORPHISM: Admin-specific dashboard
    viewDashboard(): string {
        return 'Displaying Admin Dashboard: Fleet Overview, System Analytics, User Management';
    }

    // POLYMORPHISM: Admin-specific permissions (more extensive)
    getPermissions(): string[] {
        const basePermissions = [
            'view_all_shipments',
            'view_all_users',
            'manage_fleet',
            'view_analytics',
            'manage_drivers',
        ];

        if (this._accessLevel === 'super') {
            return [...basePermissions, 'manage_admins', 'system_settings', 'billing_access'];
        }

        return basePermissions;
    }

    public get accessLevel(): 'super' | 'standard' {
        return this._accessLevel;
    }

    public manageFleet(): void {
        console.log('Accessing fleet management tools...');
    }

    public assignRegion(region: string): void {
        if (!this._managedRegions.includes(region)) {
            this._managedRegions.push(region);
            this.touch();
        }
    }

    public getManagedRegions(): readonly string[] {
        return Object.freeze([...this._managedRegions]);
    }

    public generateReport(reportType: string): object {
        console.log(`Generating ${reportType} report...`);
        return {
            type: reportType,
            generatedBy: this.name,
            generatedAt: new Date(),
        };
    }
}
