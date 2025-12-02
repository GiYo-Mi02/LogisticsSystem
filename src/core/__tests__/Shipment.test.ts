/**
 * Unit Tests for Shipment Class
 * ==============================
 * Tests demonstrating OOP concepts: Encapsulation, Abstraction, Inheritance, and Polymorphism
 * Tests interface implementations: ITrackable and IPayable
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Shipment, ShipmentType } from '@/core/Shipment';
import { Customer } from '@/core/User';
import { Drone, Truck } from '@/core/Vehicle';
import { ShipmentStatus } from '@/core/types';
import { AirPricingStrategy, GroundPricingStrategy } from '@/core/PricingStrategy';

describe('Shipment Class', () => {
  let customer: Customer;
  let shipment: Shipment;
  const origin = { lat: 40.7128, lng: -74.006 };
  const destination = { lat: 34.0522, lng: -118.2437 };

  beforeEach(() => {
    customer = new Customer('cust-001', 'John Doe', 'john@example.com');
    shipment = new Shipment(
      'ship-001',
      'TRK-12345',
      25, // weight
      origin,
      destination,
      customer,
      ShipmentType.STANDARD
    );
  });

  // ==================== ENCAPSULATION Tests ====================
  describe('Encapsulation', () => {
    it('should have read-only access to tracking ID', () => {
      expect(shipment.trackingId).toBe('TRK-12345');
      // Cannot set directly - TypeScript would prevent this at compile time
    });

    it('should have read-only access to weight', () => {
      expect(shipment.weight).toBe(25);
    });

    it('should return a copy of origin location (immutability)', () => {
      const origin = shipment.origin;
      origin.lat = 0; // Modifying the copy
      
      // Original should be unchanged
      expect(shipment.origin.lat).toBe(40.7128);
    });

    it('should return a copy of destination location (immutability)', () => {
      const dest = shipment.destination;
      dest.lat = 0; // Modifying the copy
      
      // Original should be unchanged
      expect(shipment.destination.lat).toBe(34.0522);
    });

    it('should return frozen notes array', () => {
      shipment.addNote('Test note');
      const notes = shipment.notes;
      
      expect(Object.isFrozen(notes)).toBe(true);
    });

    it('should protect internal status with validation', () => {
      // Can't skip states
      expect(() => {
        shipment.updateStatus(ShipmentStatus.DELIVERED);
      }).toThrow('Invalid status transition');
    });
  });

  // ==================== INHERITANCE Tests (BaseEntity) ====================
  describe('Inheritance from BaseEntity', () => {
    it('should have id from BaseEntity', () => {
      expect(shipment.id).toBe('ship-001');
    });

    it('should have createdAt timestamp from BaseEntity', () => {
      expect(shipment.createdAt).toBeInstanceOf(Date);
    });

    it('should have updatedAt timestamp from BaseEntity', () => {
      expect(shipment.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when modified', () => {
      const originalUpdatedAt = shipment.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          shipment.addNote('New note');
          expect(shipment.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
          resolve();
        }, 10);
      });
    });

    it('should implement validate() from BaseEntity', () => {
      expect(shipment.validate()).toBe(true);
    });

    it('should implement toJSON() from BaseEntity', () => {
      const json = shipment.toJSON();
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('trackingId');
      expect(json).toHaveProperty('weight');
      expect(json).toHaveProperty('createdAt');
    });
  });

  // ==================== ITrackable Implementation Tests ====================
  describe('ITrackable Interface', () => {
    it('should return tracking ID via getTrackingId()', () => {
      expect(shipment.getTrackingId()).toBe('TRK-12345');
    });

    it('should return status via getStatus()', () => {
      expect(shipment.getStatus()).toBe(ShipmentStatus.PENDING);
    });

    it('should return current location via getCurrentLocation()', () => {
      const location = shipment.getCurrentLocation();
      expect(location).toHaveProperty('lat');
      expect(location).toHaveProperty('lng');
    });

    it('should return tracking history via getTrackingHistory()', () => {
      const history = shipment.getTrackingHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('status');
      expect(history[0]).toHaveProperty('location');
      expect(history[0]).toHaveProperty('description');
    });

    it('should add tracking events when status changes', () => {
      const initialHistory = shipment.getTrackingHistory().length;
      
      shipment.updateStatus(ShipmentStatus.ASSIGNED);
      
      expect(shipment.getTrackingHistory().length).toBe(initialHistory + 1);
    });

    it('should return origin location when status is PENDING', () => {
      expect(shipment.getStatus()).toBe(ShipmentStatus.PENDING);
      const location = shipment.getCurrentLocation();
      expect(location.lat).toBe(origin.lat);
    });

    it('should return destination location when status is DELIVERED', () => {
      // Progress through states
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      shipment.updateStatus(ShipmentStatus.DELIVERED);
      
      const location = shipment.getCurrentLocation();
      expect(location.lat).toBe(destination.lat);
      expect(location.lng).toBe(destination.lng);
    });
  });

  // ==================== IPayable Implementation Tests ====================
  describe('IPayable Interface', () => {
    it('should process payment successfully', async () => {
      const result = await shipment.processPayment(100);
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(100);
      expect(result.transactionId).toMatch(/^TXN-/);
      expect(result.message).toBe('Payment processed successfully');
    });

    it('should add payment to history', async () => {
      await shipment.processPayment(50);
      
      const history = shipment.getPaymentHistory();
      expect(history.length).toBe(1);
      expect(history[0].amount).toBe(50);
      expect(history[0].status).toBe('COMPLETED');
    });

    it('should reject negative payment amounts', async () => {
      await expect(shipment.processPayment(-10)).rejects.toThrow('Payment amount must be positive');
    });

    it('should reject zero payment amounts', async () => {
      await expect(shipment.processPayment(0)).rejects.toThrow('Payment amount must be positive');
    });

    it('should process refund successfully', async () => {
      const paymentResult = await shipment.processPayment(100);
      const refundResult = await shipment.refund(paymentResult.transactionId, 50);
      
      expect(refundResult.success).toBe(true);
      expect(refundResult.amount).toBe(-50);
      expect(refundResult.transactionId).toMatch(/^REF-/);
    });

    it('should reject refund for non-existent transaction', async () => {
      await expect(shipment.refund('INVALID-TXN', 50))
        .rejects.toThrow('Payment INVALID-TXN not found');
    });

    it('should reject refund exceeding original amount', async () => {
      const paymentResult = await shipment.processPayment(100);
      
      await expect(shipment.refund(paymentResult.transactionId, 150))
        .rejects.toThrow('Refund amount cannot exceed original payment');
    });

    it('should track multiple payments in history', async () => {
      await shipment.processPayment(100);
      await shipment.processPayment(50);
      const paymentResult = await shipment.processPayment(75);
      await shipment.refund(paymentResult.transactionId, 25);
      
      const history = shipment.getPaymentHistory();
      expect(history.length).toBe(4);
    });
  });

  // ==================== Strategy Pattern (POLYMORPHISM) Tests ====================
  describe('Strategy Pattern - Cost Calculation', () => {
    it('should calculate cost using AirPricingStrategy', () => {
      const strategy = new AirPricingStrategy();
      shipment.calculateCost(strategy);
      
      expect(shipment.cost).toBeGreaterThan(0);
    });

    it('should calculate cost using GroundPricingStrategy', () => {
      const strategy = new GroundPricingStrategy();
      shipment.calculateCost(strategy);
      
      expect(shipment.cost).toBeGreaterThan(0);
    });

    it('should apply type multipliers to cost', () => {
      const strategy = new GroundPricingStrategy();
      
      // Standard shipment
      const standardShipment = new Shipment(
        's1', 'TRK-001', 25, origin, destination, customer, ShipmentType.STANDARD
      );
      standardShipment.calculateCost(strategy);
      
      // Express shipment
      const expressShipment = new Shipment(
        's2', 'TRK-002', 25, origin, destination, customer, ShipmentType.EXPRESS
      );
      expressShipment.calculateCost(strategy);
      
      // Express should cost more (1.5x multiplier)
      expect(expressShipment.cost).toBeGreaterThan(standardShipment.cost);
    });

    it('should add insurance cost when insured', () => {
      const strategy = new GroundPricingStrategy();
      
      // Without insurance
      const uninsured = new Shipment(
        's1', 'TRK-001', 25, origin, destination, customer, ShipmentType.STANDARD
      );
      uninsured.calculateCost(strategy);
      
      // With insurance
      const insured = new Shipment(
        's2', 'TRK-002', 25, origin, destination, customer, ShipmentType.STANDARD
      );
      insured.addInsurance(1000);
      insured.calculateCost(strategy);
      
      // Insured should cost more (base + 2% of insured value)
      expect(insured.cost).toBe(uninsured.cost + 20); // 2% of 1000 = 20
    });
  });

  // ==================== Business Logic Tests ====================
  describe('Business Logic', () => {
    it('should assign vehicle successfully', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      
      expect(shipment.assignedVehicle).toBe(drone);
      expect(shipment.status).toBe(ShipmentStatus.ASSIGNED);
    });

    it('should reject vehicle with insufficient capacity', () => {
      const drone = new Drone('d-001', 'DRN-001', 120); // Drone capacity: 50kg
      const heavyShipment = new Shipment(
        'ship-002', 'TRK-HEAVY', 100, origin, destination, customer
      );
      
      expect(() => {
        heavyShipment.assignVehicle(drone);
      }).toThrow('capacity insufficient');
    });

    it('should enforce valid status transitions', () => {
      // PENDING -> ASSIGNED (valid)
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      expect(shipment.status).toBe(ShipmentStatus.ASSIGNED);
      
      // ASSIGNED -> IN_TRANSIT (valid)
      shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      expect(shipment.status).toBe(ShipmentStatus.IN_TRANSIT);
      
      // IN_TRANSIT -> DELIVERED (valid)
      shipment.updateStatus(ShipmentStatus.DELIVERED);
      expect(shipment.status).toBe(ShipmentStatus.DELIVERED);
    });

    it('should reject invalid status transitions', () => {
      // PENDING -> IN_TRANSIT (invalid - must be assigned first)
      expect(() => {
        shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      }).toThrow('Invalid status transition');
    });

    it('should set actual delivery time when delivered', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      shipment.updateStatus(ShipmentStatus.DELIVERED);
      
      expect(shipment.actualDeliveryTime).toBeInstanceOf(Date);
    });

    it('should allow cancellation from valid states', () => {
      shipment.updateStatus(ShipmentStatus.CANCELLED);
      expect(shipment.status).toBe(ShipmentStatus.CANCELLED);
    });

    it('should not allow actions after final states', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      shipment.updateStatus(ShipmentStatus.DELIVERED);
      
      // Cannot transition from DELIVERED
      expect(() => {
        shipment.updateStatus(ShipmentStatus.CANCELLED);
      }).toThrow('Invalid status transition');
    });
  });

  // ==================== Insurance Tests ====================
  describe('Insurance', () => {
    it('should add insurance to pending shipment', () => {
      shipment.addInsurance(5000);
      
      expect(shipment.isInsured).toBe(true);
      expect(shipment.insuranceValue).toBe(5000);
    });

    it('should reject insurance after shipment is picked up', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      
      expect(() => {
        shipment.addInsurance(5000);
      }).toThrow('Insurance can only be added before pickup');
    });

    it('should reject negative insurance value', () => {
      expect(() => {
        shipment.addInsurance(-100);
      }).toThrow('Insurance value cannot be negative');
    });
  });

  // ==================== Notes Tests ====================
  describe('Notes', () => {
    it('should add notes to shipment', () => {
      shipment.addNote('Handle with care');
      shipment.addNote('Leave at door');
      
      expect(shipment.notes.length).toBe(2);
    });

    it('should timestamp notes', () => {
      shipment.addNote('Test note');
      
      expect(shipment.notes[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}/);
    });

    it('should reject empty notes', () => {
      expect(() => {
        shipment.addNote('');
      }).toThrow('Note cannot be empty');
      
      expect(() => {
        shipment.addNote('   ');
      }).toThrow('Note cannot be empty');
    });
  });

  // ==================== Signature Tests ====================
  describe('Delivery Signature', () => {
    it('should record signature only upon delivery', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      shipment.updateStatus(ShipmentStatus.IN_TRANSIT);
      shipment.updateStatus(ShipmentStatus.DELIVERED);
      
      shipment.recordSignature('John Doe');
      expect(shipment.signature).toBe('John Doe');
    });

    it('should reject signature before delivery', () => {
      expect(() => {
        shipment.recordSignature('John Doe');
      }).toThrow('Signature can only be recorded upon delivery');
    });
  });

  // ==================== Distance Calculation Tests ====================
  describe('Distance Calculation', () => {
    it('should calculate distance in kilometers', () => {
      expect(shipment.distanceKm).toBeGreaterThan(0);
    });

    it('should return zero distance for same origin and destination', () => {
      const localShipment = new Shipment(
        'ship-local', 'TRK-LOCAL', 10, origin, origin, customer
      );
      expect(localShipment.distanceKm).toBe(0);
    });
  });

  // ==================== Type Change Tests ====================
  describe('Shipment Type Changes', () => {
    it('should allow type change while pending', () => {
      shipment.setType(ShipmentType.EXPRESS);
      expect(shipment.type).toBe(ShipmentType.EXPRESS);
    });

    it('should reject type change after processing started', () => {
      const drone = new Drone('d-001', 'DRN-001', 120);
      shipment.assignVehicle(drone);
      
      expect(() => {
        shipment.setType(ShipmentType.EXPRESS);
      }).toThrow('Cannot change shipment type after processing has started');
    });
  });

  // ==================== Estimated Delivery Tests ====================
  describe('Estimated Delivery', () => {
    it('should set estimated delivery time', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      shipment.setEstimatedDelivery(futureDate);
      
      expect(shipment.estimatedDeliveryTime).toBeInstanceOf(Date);
    });

    it('should reject past estimated delivery time', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      
      expect(() => {
        shipment.setEstimatedDelivery(pastDate);
      }).toThrow('Estimated delivery time cannot be in the past');
    });

    it('should return a copy of estimated delivery time', () => {
      const futureDate = new Date(Date.now() + 86400000);
      shipment.setEstimatedDelivery(futureDate);
      
      const retrieved = shipment.estimatedDeliveryTime;
      if (retrieved) {
        retrieved.setFullYear(2000);
        
        // Original should be unchanged
        expect(shipment.estimatedDeliveryTime?.getFullYear()).not.toBe(2000);
      }
    });
  });
});
