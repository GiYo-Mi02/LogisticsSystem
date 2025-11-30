/**
 * Location with human-readable address
 * Includes both display name and coordinates for mapping
 * Address fields are optional for internal/vehicle tracking use
 */
export type Location = {
    address?: string;     // Human-readable: "New York, NY, USA"
    city?: string;        // City name: "New York"
    country?: string;     // Country: "USA"
    lat: number;          // Latitude for mapping
    lng: number;          // Longitude for mapping
};

/**
 * Full location with required address fields (for shipments)
 */
export type ShipmentLocation = Required<Location>;

/**
 * Simplified location for forms (coordinates are auto-generated)
 */
export type LocationInput = {
    address: string;
    city: string;
    country: string;
};

export type Route = {
    path: Location[];
    distance: number;
    estimatedTime: number;
};

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    DRIVER = 'DRIVER',
    ADMIN = 'ADMIN',
}

export enum VehicleType {
    DRONE = 'DRONE',
    TRUCK = 'TRUCK',
    SHIP = 'SHIP',
}

export enum ShipmentStatus {
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export interface ILoggable {
    log(message: string): void;
}

/**
 * Predefined locations for easy selection
 */
export const PRESET_LOCATIONS: Record<string, Location> = {
    'new-york': { address: '123 Broadway', city: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
    'los-angeles': { address: '456 Hollywood Blvd', city: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
    'london': { address: '10 Downing Street', city: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
    'tokyo': { address: '1-1 Shibuya', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    'paris': { address: '1 Champs-Élysées', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    'sydney': { address: '1 George Street', city: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    'dubai': { address: 'Sheikh Zayed Road', city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    'singapore': { address: 'Marina Bay', city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    'berlin': { address: 'Unter den Linden', city: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    'toronto': { address: '100 Queen Street', city: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
    'mumbai': { address: 'Marine Drive', city: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
    'sao-paulo': { address: 'Avenida Paulista', city: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
};
