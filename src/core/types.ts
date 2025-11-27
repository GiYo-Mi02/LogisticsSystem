export type Location = {
    lat: number;
    lng: number;
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
