/**
 * Shipment Validation Schemas
 * ===========================
 * Zod schemas for shipment-related API requests
 */

import { z } from 'zod';
import {
    uuidSchema,
    positiveNumber,
    locationSchema,
    urgencySchema,
} from './common';

// ============================================================================
// Create Shipment Schema
// ============================================================================

export const createShipmentSchema = z.object({
    customerId: uuidSchema,
    weight: positiveNumber.max(50000, 'Weight cannot exceed 50,000 kg'),
    origin: locationSchema.refine(
        (loc) => loc.city || (loc.lat !== undefined && loc.lng !== undefined),
        { message: 'Origin must have city name or valid coordinates' }
    ),
    destination: locationSchema.refine(
        (loc) => loc.city || (loc.lat !== undefined && loc.lng !== undefined),
        { message: 'Destination must have city name or valid coordinates' }
    ),
    urgency: urgencySchema.default('standard'),
}).refine(
    (data) => {
        // Ensure origin and destination are different
        if (data.origin.city && data.destination.city) {
            return data.origin.city !== data.destination.city;
        }
        return data.origin.lat !== data.destination.lat || 
               data.origin.lng !== data.destination.lng;
    },
    { message: 'Origin and destination must be different locations' }
);

// ============================================================================
// Get Shipments Query Schema
// ============================================================================

export const getShipmentsQuerySchema = z.object({
    customerId: uuidSchema,
});

// ============================================================================
// Get Shipment by ID Schema
// ============================================================================

export const getShipmentByIdSchema = z.object({
    id: z.string().regex(/^TRK-[A-Z0-9]+$/i, 'Invalid tracking ID format'),
});

// ============================================================================
// Update Shipment Status Schema
// ============================================================================

export const updateShipmentStatusSchema = z.object({
    status: z.enum(['IN_TRANSIT', 'DELIVERED', 'CANCELLED'], {
        message: 'Status can only be updated to IN_TRANSIT, DELIVERED, or CANCELLED',
    }),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type GetShipmentsQuery = z.infer<typeof getShipmentsQuerySchema>;
export type GetShipmentByIdParams = z.infer<typeof getShipmentByIdSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
