/**
 * Unit Tests for Vehicle Class Hierarchy
 * =======================================
 * Tests for Drone, Truck, and Ship classes demonstrating
 * OOP principles: Encapsulation, Inheritance, Polymorphism, Abstraction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Drone, Truck, Ship, Vehicle, VehicleStatus } from '@/core/Vehicle';
import { VehicleType } from '@/core/types';

describe('Vehicle Class Hierarchy', () => {
  // ==================== Drone Tests ====================
  describe('Drone', () => {
    let drone: Drone;

    beforeEach(() => {
      drone = new Drone('drone-001', 'DRN-0001', 120);
    });

    it('should create drone with correct properties', () => {
      expect(drone.id).toBe('drone-001');
      expect(drone.licenseId).toBe('DRN-0001');
      expect(drone.type).toBe(VehicleType.DRONE);
      expect(drone.maxAltitude).toBe(120);
      expect(drone.capacity).toBe(50); // Default drone capacity
    });

    it('should start with full fuel and IDLE status', () => {
      expect(drone.currentFuel).toBe(100);
      expect(drone.status).toBe(VehicleStatus.IDLE);
    });

    it('should calculate fuel percentage correctly', () => {
      expect(drone.fuelPercentage).toBe(100);
    });

    it('should handle takeoff and landing', () => {
      expect(drone.currentAltitude).toBe(0);

      drone.takeOff(100);
      expect(drone.currentAltitude).toBe(100);

      drone.land();
      expect(drone.currentAltitude).toBe(0);
    });

    it('should prevent exceeding max altitude', () => {
      expect(() => drone.takeOff(150)).toThrow('Cannot exceed max altitude');
    });

    it('should calculate geodesic movement (straight line)', () => {
      const from = { lat: 40.7128, lng: -74.006 };
      const to = { lat: 34.0522, lng: -118.2437 };

      const route = drone.move(from, to);

      expect(route.path.length).toBe(2); // Direct path
      expect(route.distance).toBeGreaterThan(0);
      expect(route.estimatedTime).toBeGreaterThan(0);
    });

    it('should return max speed of 60 km/h', () => {
      expect(drone.getMaxSpeed()).toBe(60);
    });

    it('should calculate fuel consumption', () => {
      const consumption = drone.calculateFuelConsumption(100);
      expect(consumption).toBeGreaterThan(0);
      expect(consumption).toBe(100 * 0.5); // 0.5 per km at ground level
    });

    it('should increase fuel consumption at altitude', () => {
      const groundConsumption = drone.calculateFuelConsumption(100);
      drone.takeOff(100);
      const altitudeConsumption = drone.calculateFuelConsumption(100);

      expect(altitudeConsumption).toBeGreaterThan(groundConsumption);
    });

    it('should scan terrain', () => {
      const result = drone.scanTerrain();
      expect(result).toHaveProperty('obstacles');
      expect(result).toHaveProperty('clearPath');
    });

    it('should track battery health', () => {
      expect(drone.batteryHealth).toBe(100);
      drone.checkBatteryHealth();
      expect(drone.batteryHealth).toBeLessThan(100);
    });
  });

  // ==================== Truck Tests ====================
  describe('Truck', () => {
    let truck: Truck;

    beforeEach(() => {
      truck = new Truck('truck-001', 'TRK-0001', 4);
    });

    it('should create truck with correct properties', () => {
      expect(truck.id).toBe('truck-001');
      expect(truck.licenseId).toBe('TRK-0001');
      expect(truck.type).toBe(VehicleType.TRUCK);
      expect(truck.numberOfAxles).toBe(4);
      expect(truck.capacity).toBe(5000); // Default truck capacity
    });

    it('should start without trailer attached', () => {
      expect(truck.trailerAttached).toBe(false);
    });

    it('should attach and detach trailer', () => {
      truck.attachTrailer();
      expect(truck.trailerAttached).toBe(true);

      truck.detachTrailer();
      expect(truck.trailerAttached).toBe(false);
    });

    it('should calculate Manhattan distance movement', () => {
      const from = { lat: 40.7128, lng: -74.006 };
      const to = { lat: 34.0522, lng: -118.2437 };

      const route = truck.move(from, to);

      expect(route.path.length).toBe(3); // L-shaped path with waypoint
      expect(route.distance).toBeGreaterThan(0);
    });

    it('should return 90 km/h without trailer, 70 with trailer', () => {
      expect(truck.getMaxSpeed()).toBe(90);

      truck.attachTrailer();
      expect(truck.getMaxSpeed()).toBe(70);
    });

    it('should calculate higher fuel consumption with trailer', () => {
      const baseConsumption = truck.calculateFuelConsumption(100);
      
      truck.attachTrailer();
      const trailerConsumption = truck.calculateFuelConsumption(100);

      expect(trailerConsumption).toBe(baseConsumption * 1.5);
    });

    it('should track mileage', () => {
      expect(truck.mileage).toBe(0);

      const from = { lat: 0, lng: 0 };
      const to = { lat: 1, lng: 1 };
      truck.move(from, to);

      expect(truck.mileage).toBeGreaterThan(0);
    });

    it('should check tire condition based on mileage', () => {
      const condition = truck.checkTireCondition();
      expect(condition.condition).toBe('good');
      expect(condition.needsReplacement).toBe(false);
    });
  });

  // ==================== Ship Tests ====================
  describe('Ship', () => {
    let ship: Ship;

    beforeEach(() => {
      ship = new Ship('ship-001', 'SHP-0001', 1000);
    });

    it('should create ship with correct properties', () => {
      expect(ship.id).toBe('ship-001');
      expect(ship.licenseId).toBe('SHP-0001');
      expect(ship.type).toBe(VehicleType.SHIP);
      expect(ship.containerCapacity).toBe(1000);
      expect(ship.capacity).toBe(50000); // Default ship capacity
    });

    it('should start with no containers loaded', () => {
      expect(ship.currentContainers).toBe(0);
    });

    it('should load and unload containers', () => {
      const loaded = ship.loadContainers(500);
      expect(loaded).toBe(true);
      expect(ship.currentContainers).toBe(500);

      const unloaded = ship.unloadContainers(200);
      expect(unloaded).toBe(true);
      expect(ship.currentContainers).toBe(300);
    });

    it('should prevent loading beyond capacity', () => {
      const loaded = ship.loadContainers(1500);
      expect(loaded).toBe(false);
      expect(ship.currentContainers).toBe(0);
    });

    it('should prevent unloading more than available', () => {
      ship.loadContainers(100);
      const unloaded = ship.unloadContainers(200);
      expect(unloaded).toBe(false);
      expect(ship.currentContainers).toBe(100);
    });

    it('should calculate maritime route (30% longer)', () => {
      const from = { lat: 40.7128, lng: -74.006 };
      const to = { lat: 51.5074, lng: -0.1278 };

      const route = ship.move(from, to);

      // Maritime routes are longer than direct
      expect(route.distance).toBeGreaterThan(0);
    });

    it('should return 35 km/h max speed', () => {
      expect(ship.getMaxSpeed()).toBe(35);
    });

    it('should calculate fuel consumption with load factor', () => {
      const emptyConsumption = ship.calculateFuelConsumption(100);
      
      ship.loadContainers(500); // Half capacity
      const loadedConsumption = ship.calculateFuelConsumption(100);

      expect(loadedConsumption).toBeGreaterThan(emptyConsumption);
    });

    it('should increase draft depth with cargo', () => {
      const initialDraft = ship.draftDepth;
      ship.loadContainers(500);
      
      expect(ship.draftDepth).toBeGreaterThan(initialDraft);
    });

    it('should check port compatibility', () => {
      expect(ship.checkPortCompatibility(15)).toBe(true); // Deep port
      expect(ship.checkPortCompatibility(10)).toBe(false); // Too shallow
    });
  });

  // ==================== Common Vehicle Methods ====================
  describe('Common Vehicle Methods', () => {
    let vehicle: Drone;

    beforeEach(() => {
      vehicle = new Drone('test-001', 'TEST-0001', 100);
    });

    it('should refuel correctly', () => {
      // Use some fuel first
      vehicle.move({ lat: 0, lng: 0 }, { lat: 1, lng: 1 });
      const fuelAfterMove = vehicle.currentFuel;

      vehicle.refuel(50);
      expect(vehicle.currentFuel).toBeGreaterThan(fuelAfterMove);
    });

    it('should not exceed max fuel when refueling', () => {
      vehicle.refuel(1000);
      expect(vehicle.currentFuel).toBe(vehicle.maxFuel);
    });

    it('should prevent negative fuel amount', () => {
      expect(() => vehicle.refuel(-10)).toThrow('Fuel amount cannot be negative');
    });

    it('should check carrying capacity', () => {
      expect(vehicle.canCarry(30)).toBe(true); // Under 50kg limit
      expect(vehicle.canCarry(100)).toBe(false); // Over limit
    });

    it('should update status with validation', () => {
      expect(vehicle.status).toBe(VehicleStatus.IDLE);

      vehicle.setStatus(VehicleStatus.IN_TRANSIT);
      expect(vehicle.status).toBe(VehicleStatus.IN_TRANSIT);

      vehicle.setStatus(VehicleStatus.MAINTENANCE);
      expect(vehicle.status).toBe(VehicleStatus.MAINTENANCE);
    });

    it('should prevent invalid status transitions', () => {
      vehicle.setStatus(VehicleStatus.OUT_OF_SERVICE);
      
      expect(() => {
        vehicle.setStatus(VehicleStatus.IN_TRANSIT);
      }).toThrow('Out of service vehicles must go to maintenance first');
    });

    it('should update location and add to tracking history', () => {
      const newLocation = { lat: 40.7128, lng: -74.006 };
      vehicle.setLocation(newLocation);

      const currentLocation = vehicle.getCurrentLocation();
      expect(currentLocation.lat).toBe(40.7128);
      expect(currentLocation.lng).toBe(-74.006);

      const history = vehicle.getTrackingHistory();
      expect(history.length).toBeGreaterThan(1); // Initial + location update
    });

    it('should perform maintenance', () => {
      vehicle.performMaintenance('Oil change');
      
      expect(vehicle.status).toBe(VehicleStatus.MAINTENANCE);
      
      const history = vehicle.getMaintenanceHistory();
      expect(history.length).toBe(1);
      expect(history[0]).toContain('Oil change');
    });

    it('should implement ITrackable interface', () => {
      expect(vehicle.getTrackingId()).toBe('TEST-0001');
      expect(vehicle.getStatus()).toBe(VehicleStatus.IDLE);
      expect(vehicle.getCurrentLocation()).toBeDefined();
      expect(vehicle.getTrackingHistory()).toBeDefined();
    });

    it('should validate correctly', () => {
      expect(vehicle.validate()).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const json = vehicle.toJSON() as any;
      
      expect(json.id).toBe('test-001');
      expect(json.licenseId).toBe('TEST-0001');
      expect(json.type).toBe(VehicleType.DRONE);
      expect(json.status).toBe(VehicleStatus.IDLE);
      expect(json.currentLocation).toBeDefined();
    });
  });

  // ==================== Polymorphism Tests ====================
  describe('Polymorphism', () => {
    it('should move differently based on vehicle type', () => {
      const vehicles: Vehicle[] = [
        new Drone('d1', 'DRN-001', 100),
        new Truck('t1', 'TRK-001', 4),
        new Ship('s1', 'SHP-001', 500),
      ];

      const from = { lat: 0, lng: 0 };
      const to = { lat: 1, lng: 1 };

      const routes = vehicles.map(v => v.move(from, to));

      // Drone takes direct path (2 points)
      expect(routes[0].path.length).toBe(2);
      // Truck takes L-shaped path (3 points)
      expect(routes[1].path.length).toBe(3);
      // Ship takes direct path but longer distance
      expect(routes[2].path.length).toBe(2);
    });

    it('should have different max speeds', () => {
      const drone = new Drone('d1', 'DRN-001', 100);
      const truck = new Truck('t1', 'TRK-001', 4);
      const ship = new Ship('s1', 'SHP-001', 500);

      expect(drone.getMaxSpeed()).toBe(60);
      expect(truck.getMaxSpeed()).toBe(90);
      expect(ship.getMaxSpeed()).toBe(35);
    });

    it('should calculate fuel consumption differently', () => {
      const drone = new Drone('d1', 'DRN-001', 100);
      const truck = new Truck('t1', 'TRK-001', 4);
      const ship = new Ship('s1', 'SHP-001', 500);

      const distance = 100;

      const droneFuel = drone.calculateFuelConsumption(distance);
      const truckFuel = truck.calculateFuelConsumption(distance);
      const shipFuel = ship.calculateFuelConsumption(distance);

      // Different fuel rates
      expect(droneFuel).toBe(50); // 0.5/km
      expect(truckFuel).toBe(30); // 0.3/km
      expect(shipFuel).toBe(500); // 5/km base
    });
  });
});
