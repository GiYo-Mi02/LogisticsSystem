/**
 * RouteAnalyzer Unit Tests
 * Tests for geographic route analysis and transport mode constraints
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    RouteAnalyzer, 
    TransportAvailability 
} from '../RouteAnalyzer';
import { 
    PRESET_LOCATIONS, 
    VehicleType, 
    Location, 
    ExtendedLocation 
} from '../types';

describe('RouteAnalyzer', () => {
    let analyzer: RouteAnalyzer;

    // Test locations
    const newYork = PRESET_LOCATIONS['new-york'] as ExtendedLocation;
    const losAngeles = PRESET_LOCATIONS['los-angeles'] as ExtendedLocation;
    const london = PRESET_LOCATIONS['london'] as ExtendedLocation;
    const tokyo = PRESET_LOCATIONS['tokyo'] as ExtendedLocation;
    const sydney = PRESET_LOCATIONS['sydney'] as ExtendedLocation;
    const dubai = PRESET_LOCATIONS['dubai'] as ExtendedLocation;
    const singapore = PRESET_LOCATIONS['singapore'] as ExtendedLocation;
    const paris = PRESET_LOCATIONS['paris'] as ExtendedLocation;
    const berlin = PRESET_LOCATIONS['berlin'] as ExtendedLocation;

    beforeEach(() => {
        analyzer = new RouteAnalyzer();
    });

    describe('analyzeRoute()', () => {
        it('should analyze domestic route correctly (New York to Los Angeles)', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            
            expect(result.distanceKm).toBeGreaterThan(0);
            expect(result.crossesWater).toBe(false);
            expect(result.truckAvailable).toBe(true);
        });

        it('should detect water crossing for US to Europe routes (New York to London)', () => {
            const result = analyzer.analyzeRoute(newYork, london);
            
            expect(result.crossesWater).toBe(true);
            expect(result.truckAvailable).toBe(false);
            expect(result.shipAvailable).toBe(true);
        });

        it('should detect water crossing for Australia to USA route', () => {
            const result = analyzer.analyzeRoute(sydney, newYork);
            
            expect(result.crossesWater).toBe(true);
            expect(result.truckAvailable).toBe(false);
            expect(result.shipAvailable).toBe(true);
        });

        it('should detect land-connected continents (Europe to Asia)', () => {
            const result = analyzer.analyzeRoute(london, dubai);
            
            // Europe and Asia are land-connected (Eurasia)
            expect(result.crossesWater).toBe(false);
            expect(result.truckAvailable).toBe(true);
        });

        it('should calculate distance correctly', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            
            // Approximate distance ~3,900 km
            expect(result.distanceKm).toBeGreaterThan(3000);
            expect(result.distanceKm).toBeLessThan(5000);
        });

        it('should return recommended vehicle', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            
            expect(result.recommendedVehicle).toBeDefined();
            expect([VehicleType.DRONE, VehicleType.TRUCK, VehicleType.SHIP]).toContain(result.recommendedVehicle);
        });
    });

    describe('Cross-water detection', () => {
        it('should return false (no water crossing) for same continent', () => {
            const nyToLA = analyzer.analyzeRoute(newYork, losAngeles);
            expect(nyToLA.crossesWater).toBe(false);
            
            const londonToParis = analyzer.analyzeRoute(london, paris);
            expect(londonToParis.crossesWater).toBe(false);
            
            const tokyoToSingapore = analyzer.analyzeRoute(tokyo, singapore);
            expect(tokyoToSingapore.crossesWater).toBe(false);
        });

        it('should return false for land-connected continents (Europe-Asia-Africa)', () => {
            const europeToAsia = analyzer.analyzeRoute(london, dubai);
            expect(europeToAsia.crossesWater).toBe(false);
            
            const europeToAsia2 = analyzer.analyzeRoute(paris, singapore);
            expect(europeToAsia2.crossesWater).toBe(false);
        });

        it('should return true for non-connected continents', () => {
            const usToEurope = analyzer.analyzeRoute(newYork, london);
            expect(usToEurope.crossesWater).toBe(true);
            
            const australiaToAsia = analyzer.analyzeRoute(sydney, tokyo);
            expect(australiaToAsia.crossesWater).toBe(true);
        });

        it('should return true for Australia to any other continent', () => {
            const sydneyToNY = analyzer.analyzeRoute(sydney, newYork);
            expect(sydneyToNY.crossesWater).toBe(true);
            
            const sydneyToLondon = analyzer.analyzeRoute(sydney, london);
            expect(sydneyToLondon.crossesWater).toBe(true);
            
            const sydneyToTokyo = analyzer.analyzeRoute(sydney, tokyo);
            expect(sydneyToTokyo.crossesWater).toBe(true);
        });
    });

    describe('Truck availability', () => {
        it('should be available for domestic routes', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            expect(result.truckAvailable).toBe(true);
            expect(result.availableVehicles).toContain(VehicleType.TRUCK);
        });

        it('should be unavailable for water crossing routes (Americas to Europe)', () => {
            const usToEurope = analyzer.analyzeRoute(newYork, london);
            expect(usToEurope.truckAvailable).toBe(false);
            expect(usToEurope.truckReason).toContain('ocean');
            
            const sydneyToNY = analyzer.analyzeRoute(sydney, newYork);
            expect(sydneyToNY.truckAvailable).toBe(false);
        });

        it('should be available on land-connected continents (Europe to Asia)', () => {
            const result = analyzer.analyzeRoute(london, dubai);
            expect(result.truckAvailable).toBe(true);
            
            const result2 = analyzer.analyzeRoute(paris, singapore);
            expect(result2.truckAvailable).toBe(true);
        });

        it('should include reason when unavailable', () => {
            const result = analyzer.analyzeRoute(newYork, london);
            expect(result.truckReason).toBeDefined();
            expect(result.truckReason.length).toBeGreaterThan(0);
        });
    });

    describe('Ship availability', () => {
        it('should be available for coastal cities with water crossing', () => {
            const result = analyzer.analyzeRoute(london, tokyo);
            expect(result.shipAvailable).toBe(true);
        });

        it('should be available for water crossing routes', () => {
            const result = analyzer.analyzeRoute(sydney, losAngeles);
            expect(result.shipAvailable).toBe(true);
        });

        it('should include reason for availability', () => {
            const result = analyzer.analyzeRoute(london, tokyo);
            expect(result.shipReason).toBeDefined();
        });
    });

    describe('Drone availability', () => {
        it('should be available for cities with airports', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            expect(result.droneAvailable).toBe(true);
        });

        it('should check weight limits', () => {
            // Default max drone weight is 50kg
            const heavyResult = analyzer.analyzeRoute(london, tokyo, 100);
            expect(heavyResult.droneAvailable).toBe(false);
            expect(heavyResult.droneReason).toContain('capacity');
        });

        it('should include reason when unavailable', () => {
            const heavyResult = analyzer.analyzeRoute(london, tokyo, 100);
            expect(heavyResult.droneReason).toBeDefined();
        });
    });

    describe('Recommended vehicle', () => {
        it('should recommend truck for standard domestic deliveries', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles, 50);
            // Truck is most efficient for ground routes
            expect(result.availableVehicles).toContain(VehicleType.TRUCK);
        });

        it('should recommend ship for water crossing with heavy cargo', () => {
            // North America to Europe - water crossing required
            const result = analyzer.analyzeRoute(newYork, london, 100); // Heavy cargo
            // Ship for heavy cargo across water
            expect(result.recommendedVehicle).toBe(VehicleType.SHIP);
        });

        it('should handle routes with limited options', () => {
            // Heavy cargo across water - only ship should work
            const result = analyzer.analyzeRoute(sydney, newYork, 100);
            expect(result.availableVehicles).toContain(VehicleType.SHIP);
            expect(result.availableVehicles).not.toContain(VehicleType.DRONE); // Too heavy
            expect(result.availableVehicles).not.toContain(VehicleType.TRUCK); // Crosses water
        });
    });

    describe('Available vehicles array', () => {
        it('should include all valid modes for domestic routes with light cargo', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles, 10);
            expect(result.availableVehicles).toContain(VehicleType.TRUCK);
            expect(result.availableVehicles).toContain(VehicleType.DRONE);
        });

        it('should exclude truck for water crossing routes (Americas to Europe)', () => {
            const result = analyzer.analyzeRoute(newYork, london);
            expect(result.availableVehicles).not.toContain(VehicleType.TRUCK);
        });

        it('should only include ship for heavy cargo water routes', () => {
            const result = analyzer.analyzeRoute(newYork, london, 100);
            expect(result.availableVehicles).toContain(VehicleType.SHIP);
            expect(result.availableVehicles).not.toContain(VehicleType.DRONE);
        });
    });

    describe('Static getAvailableTransportModes()', () => {
        it('should work without instantiating the class', () => {
            const result = RouteAnalyzer.getAvailableTransportModes(newYork, losAngeles);
            
            expect(result.distanceKm).toBeGreaterThan(0);
            expect(result.truckAvailable).toBe(true);
            expect(result.availableVehicles).toBeDefined();
        });

        it('should return same results as instance method', () => {
            const staticResult = RouteAnalyzer.getAvailableTransportModes(london, tokyo);
            const instanceResult = analyzer.analyzeRoute(london, tokyo);
            
            expect(staticResult.truckAvailable).toBe(instanceResult.truckAvailable);
            expect(staticResult.shipAvailable).toBe(instanceResult.shipAvailable);
            expect(staticResult.crossesWater).toBe(instanceResult.crossesWater);
        });
    });

    describe('Edge Cases', () => {
        it('should handle same origin and destination', () => {
            const result = analyzer.analyzeRoute(newYork, newYork);
            
            expect(result.distanceKm).toBe(0);
            expect(result.crossesWater).toBe(false);
            expect(result.truckAvailable).toBe(true);
        });

        it('should handle locations at same coordinates as preset', () => {
            const basicLocation: Location = {
                lat: 40.7128,
                lng: -74.006,
                address: '123 Main St',
                city: 'New York',
                country: 'USA'
            };

            // Should match the preset location and work correctly
            const result = analyzer.analyzeRoute(basicLocation, losAngeles);
            expect(result.distanceKm).toBeGreaterThan(3000);
        });
    });

    describe('Real-World Scenarios', () => {
        it('Scenario: New York to London delivery - truck unavailable (ocean crossing)', () => {
            const result = analyzer.analyzeRoute(newYork, london);
            
            // Truck should NOT be available (water crossing required)
            expect(result.truckAvailable).toBe(false);
            expect(result.truckReason).toContain('ocean');
            
            // Ship should be available
            expect(result.shipAvailable).toBe(true);
        });

        it('Scenario: Sydney to Los Angeles delivery - truck unavailable', () => {
            const result = analyzer.analyzeRoute(sydney, losAngeles);
            
            expect(result.truckAvailable).toBe(false);
            expect(result.shipAvailable).toBe(true);
            expect(result.crossesWater).toBe(true);
        });

        it('Scenario: New York to Los Angeles - truck available', () => {
            const result = analyzer.analyzeRoute(newYork, losAngeles);
            
            expect(result.truckAvailable).toBe(true);
            expect(result.crossesWater).toBe(false);
        });

        it('Scenario: London to Dubai - truck available (Eurasia land bridge)', () => {
            const result = analyzer.analyzeRoute(london, dubai);
            
            expect(result.truckAvailable).toBe(true);
            expect(result.crossesWater).toBe(false);
        });

        it('Scenario: Paris to Berlin - all modes should be considered', () => {
            const result = analyzer.analyzeRoute(paris, berlin, 10);
            
            expect(result.crossesWater).toBe(false);
            expect(result.truckAvailable).toBe(true);
            expect(result.droneAvailable).toBe(true);
        });
    });

    describe('getRouteDescription()', () => {
        it('should describe international water-crossing route', () => {
            const availability = analyzer.analyzeRoute(newYork, london);
            const description = analyzer.getRouteDescription(availability);
            
            expect(description).toContain('Sea/Air');
            expect(description).toContain('km');
        });

        it('should describe ground route', () => {
            const availability = analyzer.analyzeRoute(newYork, losAngeles);
            const description = analyzer.getRouteDescription(availability);
            
            expect(description).toContain('Ground');
            expect(description).toContain('km');
        });
    });
});
