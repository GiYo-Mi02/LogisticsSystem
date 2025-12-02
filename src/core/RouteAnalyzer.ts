/**
 * ============================================================================
 * ROUTE ANALYZER - Realistic Transport Mode Selection
 * ============================================================================
 * 
 * Analyzes routes between locations and determines which transport modes
 * are valid based on real-world constraints:
 * 
 * - TRUCK: Can only travel on land. Cannot cross oceans.
 *          Valid for same continent or land-connected continents.
 * 
 * - SHIP: Can travel across water but requires coastal access.
 *         Both origin and destination must have port access.
 * 
 * - DRONE: Can travel anywhere (within range limits).
 *          Best for short distances or urgent deliveries.
 * 
 * OOP PILLARS DEMONSTRATED:
 * - ENCAPSULATION: Route analysis logic is hidden inside the class
 * - ABSTRACTION: Simple interface hides complex geography calculations
 */

import { 
    Location, 
    ExtendedLocation, 
    VehicleType, 
    Continent, 
    LAND_CONNECTIONS,
    PRESET_LOCATIONS 
} from './types';

/**
 * Transport mode availability for a route
 */
export interface TransportAvailability {
    /** Whether trucks can complete this route */
    truckAvailable: boolean;
    /** Why truck is/isn't available */
    truckReason: string;
    
    /** Whether ships can complete this route */
    shipAvailable: boolean;
    /** Why ship is/isn't available */
    shipReason: string;
    
    /** Whether drones can complete this route */
    droneAvailable: boolean;
    /** Why drone is/isn't available */
    droneReason: string;
    
    /** List of available vehicle types */
    availableVehicles: VehicleType[];
    
    /** Recommended vehicle based on constraints and efficiency */
    recommendedVehicle: VehicleType;
    
    /** Whether the route crosses water */
    crossesWater: boolean;
    
    /** Distance in kilometers */
    distanceKm: number;
}

/**
 * Route constraints for realistic transport selection
 */
export interface RouteConstraints {
    /** Maximum drone range in km (battery limited) */
    maxDroneRange: number;
    /** Maximum truck range without sea crossing in km */
    maxTruckRange: number;
    /** Weight limit for drones in kg */
    maxDroneWeight: number;
    /** Weight limit for trucks in kg */
    maxTruckWeight: number;
}

const DEFAULT_CONSTRAINTS: RouteConstraints = {
    maxDroneRange: 500,     // Drones limited to ~500km
    maxTruckRange: 15000,   // Trucks can go very far on land
    maxDroneWeight: 50,     // Drones limited to 50kg
    maxTruckWeight: 25000,  // Trucks can carry up to 25 tons
};

/**
 * RouteAnalyzer Class
 * ====================
 * Analyzes routes and determines valid transport modes based on geography.
 * 
 * @example
 * ```typescript
 * const analyzer = new RouteAnalyzer();
 * const availability = analyzer.analyzeRoute(londonLocation, tokyoLocation);
 * 
 * console.log(availability.truckAvailable); // false - crosses ocean
 * console.log(availability.shipAvailable);  // true - both have ports
 * console.log(availability.droneAvailable); // true - but not efficient
 * ```
 */
export class RouteAnalyzer {
    private constraints: RouteConstraints;

    constructor(constraints: Partial<RouteConstraints> = {}) {
        this.constraints = { ...DEFAULT_CONSTRAINTS, ...constraints };
    }

    /**
     * Analyze a route and determine available transport modes
     */
    public analyzeRoute(
        origin: Location | ExtendedLocation,
        destination: Location | ExtendedLocation,
        weight: number = 10
    ): TransportAvailability {
        // Get extended location info
        const originExt = this.getExtendedLocation(origin);
        const destExt = this.getExtendedLocation(destination);
        
        // Calculate distance
        const distanceKm = this.calculateDistance(origin, destination);
        
        // Check if route crosses water (different continents without land bridge)
        const crossesWater = this.doesRouteCrossWater(originExt, destExt);
        
        // Analyze each transport mode
        const truckAnalysis = this.analyzeTruckRoute(originExt, destExt, distanceKm, weight, crossesWater);
        const shipAnalysis = this.analyzeShipRoute(originExt, destExt, distanceKm, weight);
        const droneAnalysis = this.analyzeDroneRoute(originExt, destExt, distanceKm, weight);
        
        // Collect available vehicles
        const availableVehicles: VehicleType[] = [];
        if (truckAnalysis.available) availableVehicles.push(VehicleType.TRUCK);
        if (shipAnalysis.available) availableVehicles.push(VehicleType.SHIP);
        if (droneAnalysis.available) availableVehicles.push(VehicleType.DRONE);
        
        // Determine recommended vehicle
        const recommendedVehicle = this.getRecommendedVehicle(
            availableVehicles, 
            distanceKm, 
            weight, 
            crossesWater
        );

        return {
            truckAvailable: truckAnalysis.available,
            truckReason: truckAnalysis.reason,
            shipAvailable: shipAnalysis.available,
            shipReason: shipAnalysis.reason,
            droneAvailable: droneAnalysis.available,
            droneReason: droneAnalysis.reason,
            availableVehicles,
            recommendedVehicle,
            crossesWater,
            distanceKm,
        };
    }

    /**
     * Check if truck can complete this route
     */
    private analyzeTruckRoute(
        origin: ExtendedLocation,
        destination: ExtendedLocation,
        distance: number,
        weight: number,
        crossesWater: boolean
    ): { available: boolean; reason: string } {
        // Check weight limit
        if (weight > this.constraints.maxTruckWeight) {
            return { 
                available: false, 
                reason: `Weight ${weight}kg exceeds truck capacity (${this.constraints.maxTruckWeight}kg)` 
            };
        }

        // Check if crosses water without land bridge
        if (crossesWater) {
            return { 
                available: false, 
                reason: `Route crosses ocean - trucks cannot travel from ${origin.continent} to ${destination.continent}` 
            };
        }

        // Check distance (very long distances might not be practical)
        if (distance > this.constraints.maxTruckRange) {
            return { 
                available: false, 
                reason: `Distance ${distance.toFixed(0)}km exceeds practical truck range` 
            };
        }

        return { 
            available: true, 
            reason: `Ground route available (${distance.toFixed(0)}km)` 
        };
    }

    /**
     * Check if ship can complete this route
     */
    private analyzeShipRoute(
        origin: ExtendedLocation,
        destination: ExtendedLocation,
        distance: number,
        weight: number
    ): { available: boolean; reason: string } {
        // Check if origin has port access
        if (!origin.isCoastal) {
            return { 
                available: false, 
                reason: `${origin.city} does not have port access` 
            };
        }

        // Check if destination has port access
        if (!destination.isCoastal) {
            return { 
                available: false, 
                reason: `${destination.city} does not have port access` 
            };
        }

        // Ships can carry almost anything, but very short distances don't make sense
        if (distance < 100) {
            return { 
                available: false, 
                reason: `Distance too short for maritime shipping (${distance.toFixed(0)}km)` 
            };
        }

        return { 
            available: true, 
            reason: `Maritime route available via ports (${distance.toFixed(0)}km)` 
        };
    }

    /**
     * Check if drone can complete this route
     */
    private analyzeDroneRoute(
        origin: ExtendedLocation,
        destination: ExtendedLocation,
        distance: number,
        weight: number
    ): { available: boolean; reason: string } {
        // Check weight limit
        if (weight > this.constraints.maxDroneWeight) {
            return { 
                available: false, 
                reason: `Weight ${weight}kg exceeds drone capacity (${this.constraints.maxDroneWeight}kg)` 
            };
        }

        // Check airport access (for long-range drone transport)
        if (!origin.hasAirport) {
            return { 
                available: false, 
                reason: `${origin.city} does not have air transport facilities` 
            };
        }

        if (!destination.hasAirport) {
            return { 
                available: false, 
                reason: `${destination.city} does not have air transport facilities` 
            };
        }

        // Check range (for pure drone delivery vs air freight with drone last-mile)
        if (distance > this.constraints.maxDroneRange) {
            return { 
                available: true, // Still available via air freight
                reason: `Long-distance air freight with drone delivery (${distance.toFixed(0)}km)` 
            };
        }

        return { 
            available: true, 
            reason: `Direct drone delivery available (${distance.toFixed(0)}km)` 
        };
    }

    /**
     * Determine if route crosses water (requires ship or air)
     */
    private doesRouteCrossWater(origin: ExtendedLocation, destination: ExtendedLocation): boolean {
        // Same continent - no water crossing needed
        if (origin.continent === destination.continent) {
            return false;
        }

        // Check if continents are connected by land
        const connectedContinents = LAND_CONNECTIONS[origin.continent] || [];
        if (connectedContinents.includes(destination.continent)) {
            return false; // Land bridge available
        }

        // Different continents without land connection = crosses water
        return true;
    }

    /**
     * Get recommended vehicle based on route analysis
     */
    private getRecommendedVehicle(
        available: VehicleType[],
        distance: number,
        weight: number,
        crossesWater: boolean
    ): VehicleType {
        // If no vehicles available, default to SHIP (error case)
        if (available.length === 0) {
            return VehicleType.SHIP;
        }

        // If only one option, use it
        if (available.length === 1) {
            return available[0];
        }

        // Priority logic for recommendation:
        
        // 1. Short distance + light weight = Drone
        if (distance < 300 && weight <= 30 && available.includes(VehicleType.DRONE)) {
            return VehicleType.DRONE;
        }

        // 2. Crosses water = prefer Ship for heavy, Drone for light
        if (crossesWater) {
            if (weight > 50 && available.includes(VehicleType.SHIP)) {
                return VehicleType.SHIP;
            }
            if (available.includes(VehicleType.DRONE)) {
                return VehicleType.DRONE;
            }
            return VehicleType.SHIP;
        }

        // 3. Land route = prefer Truck for efficiency
        if (available.includes(VehicleType.TRUCK)) {
            return VehicleType.TRUCK;
        }

        // 4. Default to first available
        return available[0];
    }

    /**
     * Calculate distance between two locations in km
     */
    private calculateDistance(from: Location, to: Location): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(to.lat - from.lat);
        const dLng = this.toRad(to.lng - from.lng);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Get extended location info from basic location
     */
    private getExtendedLocation(location: Location | ExtendedLocation): ExtendedLocation {
        // If already extended, return as-is
        if ('continent' in location) {
            return location as ExtendedLocation;
        }

        // Try to find matching preset location
        for (const preset of Object.values(PRESET_LOCATIONS)) {
            if (preset.lat === location.lat && preset.lng === location.lng) {
                return preset;
            }
        }

        // Default: Assume based on coordinates (rough estimation)
        const continent = this.estimateContinent(location.lat, location.lng);
        return {
            ...location,
            continent,
            isCoastal: true, // Default assumption
            hasAirport: true, // Default assumption for major cities
        };
    }

    /**
     * Estimate continent from coordinates (rough)
     */
    private estimateContinent(lat: number, lng: number): Continent {
        // Very rough estimation based on coordinates
        if (lat > 15 && lat < 72 && lng > -170 && lng < -30) return 'NORTH_AMERICA';
        if (lat < 15 && lat > -60 && lng > -90 && lng < -30) return 'SOUTH_AMERICA';
        if (lat > 35 && lat < 72 && lng > -30 && lng < 60) return 'EUROPE';
        if (lat > -10 && lat < 55 && lng > 25 && lng < 180) return 'ASIA';
        if (lat < 35 && lat > -35 && lng > -20 && lng < 55) return 'AFRICA';
        if (lat < -10 && lng > 100 && lng < 180) return 'OCEANIA';
        return 'ASIA'; // Default
    }

    /**
     * Get human-readable route description
     */
    public getRouteDescription(availability: TransportAvailability): string {
        if (availability.crossesWater) {
            return `International route (${availability.distanceKm.toFixed(0)}km) - Sea/Air transport required`;
        }
        return `Ground route available (${availability.distanceKm.toFixed(0)}km)`;
    }

    /**
     * Static method for quick availability check
     */
    public static getAvailableTransportModes(
        origin: Location | ExtendedLocation,
        destination: Location | ExtendedLocation,
        weight: number = 10
    ): TransportAvailability {
        const analyzer = new RouteAnalyzer();
        return analyzer.analyzeRoute(origin, destination, weight);
    }
}

export default RouteAnalyzer;
