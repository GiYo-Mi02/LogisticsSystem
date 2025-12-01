/**
 * Common Zod Schemas
 * ==================
 * Shared validation schemas used across the application
 */

import { z } from 'zod';

// ============================================================================
// Primitive Validators
// ============================================================================

/**
 * UUID validator
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Positive number validator (coerces strings to numbers)
 */
export const positiveNumber = z.coerce.number().positive('Must be a positive number');

/**
 * Non-negative number validator (coerces strings to numbers)
 */
export const nonNegativeNumber = z.coerce.number().min(0, 'Cannot be negative');

/**
 * Email validator
 */
export const emailSchema = z.string().email('Invalid email format');

// ============================================================================
// Location Schemas
// ============================================================================

/**
 * Latitude validator (-90 to 90)
 */
export const latitudeSchema = z.coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90');

/**
 * Longitude validator (-180 to 180)
 */
export const longitudeSchema = z.coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180');

/**
 * Location schema (with optional address fields)
 */
export const locationSchema = z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    lat: latitudeSchema,
    lng: longitudeSchema,
});

/**
 * Location schema with required address fields (for shipments)
 */
export const shipmentLocationSchema = z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    lat: latitudeSchema,
    lng: longitudeSchema,
});

// ============================================================================
// Enum Schemas
// ============================================================================

export const userRoleSchema = z.enum(['CUSTOMER', 'DRIVER', 'ADMIN'], {
    message: 'Invalid role. Must be CUSTOMER, DRIVER, or ADMIN',
});

export const vehicleTypeSchema = z.enum(['DRONE', 'TRUCK', 'SHIP'], {
    message: 'Invalid vehicle type. Must be DRONE, TRUCK, or SHIP',
});

export const shipmentStatusSchema = z.enum(
    ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    {
        message: 'Invalid status. Must be PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, or CANCELLED',
    }
);

export const urgencySchema = z.enum(['high', 'standard', 'low'], {
    message: 'Invalid urgency. Must be high, standard, or low',
});

// ============================================================================
// Type Exports
// ============================================================================

export type Location = z.infer<typeof locationSchema>;
export type ShipmentLocation = z.infer<typeof shipmentLocationSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type VehicleType = z.infer<typeof vehicleTypeSchema>;
export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;
export type Urgency = z.infer<typeof urgencySchema>;
