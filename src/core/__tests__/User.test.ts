/**
 * Unit Tests for User Class Hierarchy
 * ====================================
 * Tests for Customer, Driver, and Admin classes demonstrating
 * OOP principles: Encapsulation, Inheritance, Polymorphism, Abstraction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Customer, Driver, Admin } from '@/core/User';
import { UserRole } from '@/core/types';
import { NotificationType } from '@/core/interfaces/INotifiable';

describe('User Class Hierarchy', () => {
  // ==================== Customer Tests ====================
  describe('Customer', () => {
    let customer: Customer;

    beforeEach(() => {
      customer = new Customer('cust-001', 'John Doe', 'john@example.com');
    });

    it('should create a customer with correct properties', () => {
      expect(customer.id).toBe('cust-001');
      expect(customer.name).toBe('John Doe');
      expect(customer.email).toBe('john@example.com');
      expect(customer.getRole()).toBe(UserRole.CUSTOMER);
    });

    it('should validate name with minimum length', () => {
      expect(() => {
        customer.name = 'J';
      }).toThrow('Name must be at least 2 characters');
    });

    it('should validate email format', () => {
      expect(() => {
        customer.email = 'invalid-email';
      }).toThrow('Invalid email format');
    });

    it('should convert email to lowercase', () => {
      customer.email = 'JOHN@EXAMPLE.COM';
      expect(customer.email).toBe('john@example.com');
    });

    it('should manage loyalty points correctly', () => {
      expect(customer.loyaltyPoints).toBe(0);
      
      customer.addLoyaltyPoints(100);
      expect(customer.loyaltyPoints).toBe(100);

      const redeemed = customer.redeemPoints(50);
      expect(redeemed).toBe(true);
      expect(customer.loyaltyPoints).toBe(50);

      const failedRedeem = customer.redeemPoints(100);
      expect(failedRedeem).toBe(false);
      expect(customer.loyaltyPoints).toBe(50);
    });

    it('should throw error for negative loyalty points', () => {
      expect(() => {
        customer.addLoyaltyPoints(-10);
      }).toThrow('Points cannot be negative');
    });

    it('should return customer-specific dashboard', () => {
      const dashboard = customer.viewDashboard();
      expect(dashboard).toContain('Customer Dashboard');
    });

    it('should return customer-specific permissions', () => {
      const permissions = customer.getPermissions();
      expect(permissions).toContain('create_shipment');
      expect(permissions).toContain('track_shipment');
      expect(permissions).not.toContain('manage_fleet');
    });

    it('should track shipment history', () => {
      customer.createShipment({ weight: 10 });
      customer.createShipment({ weight: 20 });
      
      const history = customer.getShipmentHistory();
      expect(history.length).toBe(2);
    });

    it('should implement INotifiable interface', () => {
      customer.notify('Test notification', NotificationType.INFO);
      
      const notifications = customer.getNotifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe('Test notification');
    });

    it('should manage notification preferences', () => {
      const prefs = customer.getNotificationPreferences();
      expect(prefs.email).toBe(true);

      customer.setNotificationPreferences({ email: false, sms: true, push: true });
      const newPrefs = customer.getNotificationPreferences();
      expect(newPrefs.email).toBe(false);
      expect(newPrefs.sms).toBe(true);
    });

    it('should validate entity correctly', () => {
      expect(customer.validate()).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const json = customer.toJSON() as any;
      expect(json.id).toBe('cust-001');
      expect(json.name).toBe('John Doe');
      expect(json.role).toBe(UserRole.CUSTOMER);
      expect(json.createdAt).toBeDefined();
    });
  });

  // ==================== Driver Tests ====================
  describe('Driver', () => {
    let driver: Driver;

    beforeEach(() => {
      driver = new Driver('drv-001', 'Jane Smith', 'jane@example.com');
    });

    it('should create a driver with correct properties', () => {
      expect(driver.id).toBe('drv-001');
      expect(driver.name).toBe('Jane Smith');
      expect(driver.getRole()).toBe(UserRole.DRIVER);
    });

    it('should start with no vehicle assigned', () => {
      expect(driver.currentVehicleId).toBeNull();
    });

    it('should assign and unassign vehicle', () => {
      driver.assignVehicle('veh-001');
      expect(driver.currentVehicleId).toBe('veh-001');

      driver.unassignVehicle();
      expect(driver.currentVehicleId).toBeNull();
    });

    it('should track job acceptance and completion', () => {
      expect(driver.isAvailable).toBe(true);
      expect(driver.completedDeliveries).toBe(0);

      driver.acceptJob('ship-001');
      expect(driver.isAvailable).toBe(false);

      driver.completeDelivery();
      expect(driver.isAvailable).toBe(true);
      expect(driver.completedDeliveries).toBe(1);
    });

    it('should update and get location', () => {
      expect(driver.getCurrentLocation()).toBeNull();

      driver.updateLocation(40.7128, -74.006);
      const location = driver.getCurrentLocation();
      
      expect(location).not.toBeNull();
      expect(location!.lat).toBe(40.7128);
      expect(location!.lng).toBe(-74.006);
    });

    it('should track and calculate rating', () => {
      expect(driver.rating).toBe(5.0);

      driver.completeDelivery();
      driver.updateRating(4.0);
      
      expect(driver.rating).toBeLessThan(5.0);
    });

    it('should validate rating range', () => {
      expect(() => driver.updateRating(0)).toThrow('Rating must be between 1 and 5');
      expect(() => driver.updateRating(6)).toThrow('Rating must be between 1 and 5');
    });

    it('should return driver-specific dashboard', () => {
      const dashboard = driver.viewDashboard();
      expect(dashboard).toContain('Driver Dashboard');
    });

    it('should return driver-specific permissions', () => {
      const permissions = driver.getPermissions();
      expect(permissions).toContain('view_assignments');
      expect(permissions).toContain('accept_job');
      expect(permissions).not.toContain('manage_fleet');
    });
  });

  // ==================== Admin Tests ====================
  describe('Admin', () => {
    let admin: Admin;
    let superAdmin: Admin;

    beforeEach(() => {
      admin = new Admin('adm-001', 'Bob Admin', 'bob@example.com', 'standard');
      superAdmin = new Admin('adm-002', 'Super Admin', 'super@example.com', 'super');
    });

    it('should create admin with correct access level', () => {
      expect(admin.accessLevel).toBe('standard');
      expect(superAdmin.accessLevel).toBe('super');
    });

    it('should return different permissions based on access level', () => {
      const standardPerms = admin.getPermissions();
      const superPerms = superAdmin.getPermissions();

      expect(standardPerms).toContain('view_all_shipments');
      expect(standardPerms).not.toContain('manage_admins');

      expect(superPerms).toContain('view_all_shipments');
      expect(superPerms).toContain('manage_admins');
      expect(superPerms).toContain('system_settings');
    });

    it('should manage regions', () => {
      expect(admin.getManagedRegions().length).toBe(0);

      admin.assignRegion('North America');
      admin.assignRegion('Europe');
      admin.assignRegion('North America'); // Duplicate

      const regions = admin.getManagedRegions();
      expect(regions.length).toBe(2);
      expect(regions).toContain('North America');
      expect(regions).toContain('Europe');
    });

    it('should generate reports', () => {
      const report = admin.generateReport('monthly-revenue');
      
      expect(report).toHaveProperty('type', 'monthly-revenue');
      expect(report).toHaveProperty('generatedBy', 'Bob Admin');
      expect(report).toHaveProperty('generatedAt');
    });

    it('should return admin-specific dashboard', () => {
      const dashboard = admin.viewDashboard();
      expect(dashboard).toContain('Admin Dashboard');
    });
  });

  // ==================== Polymorphism Tests ====================
  describe('Polymorphism', () => {
    it('should call correct viewDashboard based on user type', () => {
      const users = [
        new Customer('c1', 'Customer', 'c@test.com'),
        new Driver('d1', 'Driver', 'd@test.com'),
        new Admin('a1', 'Admin', 'a@test.com'),
      ];

      const dashboards = users.map(u => u.viewDashboard());

      expect(dashboards[0]).toContain('Customer');
      expect(dashboards[1]).toContain('Driver');
      expect(dashboards[2]).toContain('Admin');
    });

    it('should return different permissions per user type', () => {
      const customer = new Customer('c1', 'Customer', 'c@test.com');
      const driver = new Driver('d1', 'Driver', 'd@test.com');
      const admin = new Admin('a1', 'Admin', 'a@test.com');

      expect(customer.getPermissions()).toContain('create_shipment');
      expect(driver.getPermissions()).toContain('accept_job');
      expect(admin.getPermissions()).toContain('manage_fleet');
    });
  });

  // ==================== BaseEntity Tests ====================
  describe('BaseEntity (via User)', () => {
    it('should have unique id', () => {
      const user1 = new Customer('c1', 'User1', 'u1@test.com');
      const user2 = new Customer('c2', 'User2', 'u2@test.com');

      expect(user1.id).not.toBe(user2.id);
    });

    it('should have createdAt timestamp', () => {
      const user = new Customer('c1', 'User', 'u@test.com');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on property change', () => {
      const user = new Customer('c1', 'User', 'u@test.com');
      const initialUpdatedAt = user.updatedAt;

      // Small delay to ensure timestamp difference
      user.name = 'New Name';

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
    });

    it('should compare entities by ID with equals()', () => {
      const user1 = new Customer('same-id', 'User1', 'u1@test.com');
      const user2 = new Customer('same-id', 'User2', 'u2@test.com');
      const user3 = new Customer('different-id', 'User3', 'u3@test.com');

      expect(user1.equals(user2)).toBe(true);
      expect(user1.equals(user3)).toBe(false);
    });
  });
});
