/**
 * Unit Tests for ShipmentFactory (Factory Pattern)
 * =================================================
 * Tests demonstrating the Factory design pattern for creating
 * shipments and vehicles with proper encapsulation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ShipmentFactory, ShipmentBuilder } from '@/core/ShipmentFactory';
import { Customer } from '@/core/User';
import { Drone, Truck, Ship } from '@/core/Vehicle';
import { VehicleType } from '@/core/types';
import { ShipmentType } from '@/core/Shipment';

describe('ShipmentFactory (Factory Pattern)', () => {
  let customer: Customer;

  beforeEach(() => {
    customer = new Customer('cust-001', 'John Doe', 'john@example.com');
  });

  // ==================== Factory Method Tests ====================
  describe('createShipment', () => {
    it('should create a complete shipment with all components', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 25,
        origin: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 34.0522, lng: -118.2437 },
        customer: customer,
        urgency: 'standard',
      });

      expect(result).toHaveProperty('shipment');
      expect(result).toHaveProperty('recommendedVehicle');
      expect(result).toHaveProperty('pricingStrategy');
      expect(result).toHaveProperty('estimatedCost');
      expect(result).toHaveProperty('estimatedDeliveryDays');
    });

    it('should set tracking ID correctly', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-TEST-123',
        weight: 25,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        customer: customer,
      });

      expect(result.shipment.trackingId).toBe('TRK-TEST-123');
    });

    it('should calculate cost based on weight and distance', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 50,
        origin: { lat: 40.7128, lng: -74.006 },
        destination: { lat: 34.0522, lng: -118.2437 },
        customer: customer,
      });

      expect(result.estimatedCost).toBeGreaterThan(0);
      expect(result.shipment.cost).toBe(result.estimatedCost);
    });

    it('should add insurance when specified', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 25,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        customer: customer,
        insuranceValue: 5000,
      });

      expect(result.shipment.isInsured).toBe(true);
      expect(result.shipment.insuranceValue).toBe(5000);
    });

    it('should set shipment type correctly', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 25,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        customer: customer,
        shipmentType: ShipmentType.EXPRESS,
      });

      expect(result.shipment.type).toBe(ShipmentType.EXPRESS);
    });
  });

  // ==================== Vehicle Recommendation Tests ====================
  describe('Vehicle Recommendation', () => {
    it('should recommend drone for critical, lightweight shipments', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 5, // Very light
        origin: { lat: 0, lng: 0 },
        destination: { lat: 0.1, lng: 0.1 },
        customer: customer,
        urgency: 'critical',
      });

      expect(result.recommendedVehicle).toBeInstanceOf(Drone);
    });

    it('should recommend drone for high urgency, light shipments', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 30,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 0.5, lng: 0.5 },
        customer: customer,
        urgency: 'high',
      });

      expect(result.recommendedVehicle).toBeInstanceOf(Drone);
    });

    it('should recommend ship for heavy cargo', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 6000, // Very heavy
        origin: { lat: 0, lng: 0 },
        destination: { lat: 10, lng: 10 },
        customer: customer,
        urgency: 'standard',
      });

      expect(result.recommendedVehicle).toBeInstanceOf(Ship);
    });

    it('should recommend ship for low urgency shipments', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 500,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 5, lng: 5 },
        customer: customer,
        urgency: 'low',
      });

      expect(result.recommendedVehicle).toBeInstanceOf(Ship);
    });

    it('should recommend truck for medium shipments', () => {
      const result = ShipmentFactory.createShipment({
        trackingId: 'TRK-001',
        weight: 500,
        origin: { lat: 0, lng: 0 },
        destination: { lat: 1, lng: 1 },
        customer: customer,
        urgency: 'standard',
      });

      expect(result.recommendedVehicle).toBeInstanceOf(Truck);
    });
  });

  // ==================== createSimple Tests ====================
  describe('createSimple', () => {
    it('should create shipment with minimal parameters', () => {
      const result = ShipmentFactory.createSimple(
        'TRK-SIMPLE',
        100,
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        customer,
        'standard'
      );

      expect(result.shipment).toBeDefined();
      expect(result.recommendedVehicle).toBeDefined();
    });

    it('should default to standard urgency', () => {
      const result = ShipmentFactory.createSimple(
        'TRK-SIMPLE',
        100,
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        customer
      );

      expect(result.recommendedVehicle).toBeInstanceOf(Truck);
    });
  });

  // ==================== createVehicle Tests ====================
  describe('createVehicle', () => {
    it('should create a drone', () => {
      const vehicle = ShipmentFactory.createVehicle(VehicleType.DRONE);
      expect(vehicle).toBeInstanceOf(Drone);
      expect(vehicle.type).toBe(VehicleType.DRONE);
    });

    it('should create a truck', () => {
      const vehicle = ShipmentFactory.createVehicle(VehicleType.TRUCK);
      expect(vehicle).toBeInstanceOf(Truck);
      expect(vehicle.type).toBe(VehicleType.TRUCK);
    });

    it('should create a ship', () => {
      const vehicle = ShipmentFactory.createVehicle(VehicleType.SHIP);
      expect(vehicle).toBeInstanceOf(Ship);
      expect(vehicle.type).toBe(VehicleType.SHIP);
    });

    it('should generate unique IDs for vehicles', () => {
      const vehicle1 = ShipmentFactory.createVehicle(VehicleType.DRONE);
      const vehicle2 = ShipmentFactory.createVehicle(VehicleType.DRONE);

      expect(vehicle1.id).not.toBe(vehicle2.id);
      expect(vehicle1.licenseId).not.toBe(vehicle2.licenseId);
    });
  });

  // ==================== Bulk Shipments Tests ====================
  describe('createBulkShipments', () => {
    it('should create multiple shipments for one customer', () => {
      const shipmentData = [
        { trackingId: 'TRK-B001', weight: 10, origin: { lat: 0, lng: 0 }, destination: { lat: 1, lng: 1 } },
        { trackingId: 'TRK-B002', weight: 20, origin: { lat: 0, lng: 0 }, destination: { lat: 2, lng: 2 } },
        { trackingId: 'TRK-B003', weight: 30, origin: { lat: 0, lng: 0 }, destination: { lat: 3, lng: 3 } },
      ];

      const results = ShipmentFactory.createBulkShipments(shipmentData, customer);

      expect(results.length).toBe(3);
      results.forEach((result, index) => {
        expect(result.shipment.trackingId).toBe(shipmentData[index].trackingId);
        expect(result.shipment.customer).toBe(customer);
      });
    });
  });

  // ==================== Tracking ID Generation ====================
  describe('generateTrackingId', () => {
    it('should generate unique tracking IDs', () => {
      const id1 = ShipmentFactory.generateTrackingId();
      const id2 = ShipmentFactory.generateTrackingId();

      expect(id1).not.toBe(id2);
    });

    it('should start with TRK- prefix', () => {
      const id = ShipmentFactory.generateTrackingId();
      expect(id.startsWith('TRK-')).toBe(true);
    });

    it('should be uppercase', () => {
      const id = ShipmentFactory.generateTrackingId();
      expect(id).toBe(id.toUpperCase());
    });
  });

  // ==================== Delivery Estimation ====================
  describe('getEstimatedDeliveryDate', () => {
    it('should return future date', () => {
      const deliveryDate = ShipmentFactory.getEstimatedDeliveryDate(
        { lat: 0, lng: 0 },
        { lat: 1, lng: 1 },
        'standard'
      );

      expect(deliveryDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should be faster for critical urgency', () => {
      const origin = { lat: 0, lng: 0 };
      const destination = { lat: 1, lng: 1 };

      const criticalDate = ShipmentFactory.getEstimatedDeliveryDate(origin, destination, 'critical');
      const standardDate = ShipmentFactory.getEstimatedDeliveryDate(origin, destination, 'standard');

      expect(criticalDate.getTime()).toBeLessThan(standardDate.getTime());
    });

    it('should be slower for low urgency', () => {
      const origin = { lat: 0, lng: 0 };
      const destination = { lat: 1, lng: 1 };

      const lowDate = ShipmentFactory.getEstimatedDeliveryDate(origin, destination, 'low');
      const standardDate = ShipmentFactory.getEstimatedDeliveryDate(origin, destination, 'standard');

      expect(lowDate.getTime()).toBeGreaterThan(standardDate.getTime());
    });
  });
});

// ==================== ShipmentBuilder (Builder Pattern) ====================
describe('ShipmentBuilder (Builder Pattern)', () => {
  let customer: Customer;

  beforeEach(() => {
    customer = new Customer('cust-001', 'John Doe', 'john@example.com');
  });

  it('should create shipment using fluent interface', () => {
    const result = ShipmentBuilder.create()
      .setTrackingId('TRK-BUILD-001')
      .setWeight(25)
      .setOrigin({ lat: 40.7128, lng: -74.006 })
      .setDestination({ lat: 34.0522, lng: -118.2437 })
      .setCustomer(customer)
      .build();

    expect(result.shipment.trackingId).toBe('TRK-BUILD-001');
    expect(result.shipment.weight).toBe(25);
  });

  it('should support method chaining', () => {
    const builder = ShipmentBuilder.create();

    const result = builder
      .setTrackingId('TRK-001')
      .setWeight(10)
      .setOrigin({ lat: 0, lng: 0 })
      .setDestination({ lat: 1, lng: 1 })
      .setCustomer(customer)
      .setUrgency('high')
      .setShipmentType(ShipmentType.EXPRESS)
      .setInsurance(1000)
      .build();

    expect(result.shipment.type).toBe(ShipmentType.EXPRESS);
    expect(result.shipment.isInsured).toBe(true);
  });

  it('should throw error for missing required fields', () => {
    expect(() => {
      ShipmentBuilder.create()
        .setWeight(10)
        .build();
    }).toThrow('Missing required field');
  });

  it('should throw error for missing trackingId', () => {
    expect(() => {
      ShipmentBuilder.create()
        .setWeight(10)
        .setOrigin({ lat: 0, lng: 0 })
        .setDestination({ lat: 1, lng: 1 })
        .setCustomer(customer)
        .build();
    }).toThrow('Missing required field: trackingId');
  });

  it('should throw error for missing customer', () => {
    expect(() => {
      ShipmentBuilder.create()
        .setTrackingId('TRK-001')
        .setWeight(10)
        .setOrigin({ lat: 0, lng: 0 })
        .setDestination({ lat: 1, lng: 1 })
        .build();
    }).toThrow('Missing required field: customer');
  });

  it('should use static create() method', () => {
    const builder = ShipmentBuilder.create();
    expect(builder).toBeInstanceOf(ShipmentBuilder);
  });
});
