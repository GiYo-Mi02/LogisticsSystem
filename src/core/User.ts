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
 * @abstract
 * @class User
 * @extends BaseEntity
 * @implements INotifiable
 * @description The base class for all user types in the LogIQ system.
 * 
 * **OOP Pillars Demonstrated:**
 * - **ABSTRACTION**: Abstract class with abstract method viewDashboard()
 * - **INHERITANCE**: Customer, Driver, Admin extend this class
 * - **ENCAPSULATION**: Protects sensitive data like password and email
 * 
 * @example
 * ```typescript
 * // Cannot instantiate directly - use subclasses:
 * const customer = new Customer('u-001', 'John Doe', 'john@email.com');
 * const driver = new Driver('u-002', 'Jane Smith', 'jane@email.com');
 * const admin = new Admin('u-003', 'Bob Admin', 'bob@email.com', 'super');
 * 
 * // Polymorphism - same method, different behavior:
 * console.log(customer.viewDashboard()); // "Displaying Customer Dashboard..."
 * console.log(driver.viewDashboard());   // "Displaying Driver Dashboard..."
 * ```
 * 
 * @see Customer
 * @see Driver
 * @see Admin
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

    /**
     * Gets the user's display name.
     * @returns {string} The user's name.
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Sets the user's display name with validation.
     * @param {string} value - The new name (minimum 2 characters).
     * @throws {Error} If name is less than 2 characters.
     * @example
     * ```typescript
     * user.name = 'John Doe'; // Valid
     * user.name = 'J';        // Throws Error
     * ```
     */
    public set name(value: string) {
        if (value.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }
        this._name = value.trim();
        this.touch(); // Update timestamp
    }

    /**
     * Gets the user's email address.
     * @returns {string} The user's email in lowercase.
     */
    public get email(): string {
        return this._email;
    }

    /**
     * Sets the user's email with format validation.
     * @param {string} value - The new email address.
     * @throws {Error} If email format is invalid.
     * @example
     * ```typescript
     * user.email = 'john@example.com'; // Valid
     * user.email = 'invalid-email';    // Throws Error
     * ```
     */
    public set email(value: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Invalid email format');
        }
        this._email = value.toLowerCase();
        this.touch();
    }

    /**
     * Sets the user's password with security validation.
     * @param {string} value - The new password (minimum 8 characters).
     * @throws {Error} If password is less than 8 characters.
     * @description Password is write-only for security - no getter exists.
     * In production, this would hash the password before storing.
     */
    public set password(value: string) {
        if (value.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        // In real app, this would be hashed
        this._password = value;
        this.touch();
    }

    /**
     * Gets the user's role.
     * @returns {UserRole} The user's role (CUSTOMER, DRIVER, or ADMIN).
     */
    public getRole(): UserRole {
        return this.role;
    }

    // ==================== ABSTRACTION: Abstract Methods ====================

    /**
     * View the user's role-specific dashboard.
     * @abstract
     * @returns {string} A description of the dashboard content.
     * @description Each user type sees a different dashboard.
     * **POLYMORPHISM**: Same method signature, different behavior.
     * - Customer: Active shipments, create new shipment, track orders
     * - Driver: Current assignment, route map, earnings
     * - Admin: Fleet overview, system analytics, user management
     * @example
     * ```typescript
     * const user: User = getUserById('u-001');
     * console.log(user.viewDashboard()); // Output depends on user type
     * ```
     */
    abstract viewDashboard(): string;

    /**
     * Get the permissions available to this user type.
     * @abstract
     * @returns {string[]} An array of permission strings.
     * @description Permissions vary by role for security.
     * @example
     * ```typescript
     * const permissions = user.getPermissions();
     * if (permissions.includes('manage_fleet')) {
     *   showFleetManagement();
     * }
     * ```
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
 * Customer Class - Concrete User Implementation
 * ============================================================================
 * @class Customer
 * @extends User
 * @description Represents a customer who can create and track shipments.
 * 
 * **OOP Pillars:**
 * - **INHERITANCE**: Extends User class
 * - **POLYMORPHISM**: Implements abstract methods with customer-specific behavior
 * - **ENCAPSULATION**: Private loyalty points and shipment history
 * 
 * @example
 * ```typescript
 * const customer = new Customer('c-001', 'John Doe', 'john@email.com');
 * 
 * // Create a shipment
 * const trackingId = customer.createShipment({ weight: 25, origin: {...} });
 * 
 * // Earn and redeem loyalty points
 * customer.addLoyaltyPoints(100);
 * customer.redeemPoints(50); // Returns true, deducts 50 points
 * ```
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
 * Driver Class - Concrete User Implementation
 * ============================================================================
 * @class Driver
 * @extends User
 * @description Represents a driver who delivers shipments using assigned vehicles.
 * 
 * **Features:**
 * - Vehicle assignment and management
 * - Real-time location tracking
 * - Job acceptance and completion
 * - Performance rating system
 * 
 * @example
 * ```typescript
 * const driver = new Driver('d-001', 'Jane Smith', 'jane@email.com');
 * 
 * // Assign vehicle and accept job
 * driver.assignVehicle('v-001');
 * driver.acceptJob('ship-001');
 * 
 * // Update location during delivery
 * driver.updateLocation(40.7128, -74.0060);
 * 
 * // Complete delivery
 * driver.completeDelivery();
 * console.log(driver.completedDeliveries); // 1
 * ```
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
 * Admin Class - Concrete User Implementation
 * ============================================================================
 * @class Admin
 * @extends User
 * @description Represents an administrator with system management capabilities.
 * 
 * **Access Levels:**
 * - **standard**: Fleet management, view analytics, manage drivers
 * - **super**: All standard permissions + manage admins, system settings, billing
 * 
 * @example
 * ```typescript
 * const admin = new Admin('a-001', 'Bob Admin', 'bob@email.com', 'super');
 * 
 * // Manage fleet and generate reports
 * admin.manageFleet();
 * const report = admin.generateReport('monthly-revenue');
 * 
 * // Assign regions to manage
 * admin.assignRegion('North America');
 * console.log(admin.getManagedRegions()); // ['North America']
 * ```
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
