/**
 * Vehicle Validation Schemas
 * ==========================
 * Zod schemas for vehicle-related API requests
 */

import { z } from 'zod';
import { vehicleTypeSchema } from './common';

// ============================================================================
// Create Vehicle Schema
// ============================================================================

export const createVehicleSchema = z.object({
    type: vehicleTypeSchema,
    licenseId: z
        .string()
        .min(1, 'License ID is required')
        .regex(
            /^[A-Z]{2,4}-\d{4,6}$/i,
            'License ID must be in format: XX-0000 or XXX-00000 (e.g., DRN-1234, TRK-12345)'
        ),
    capacity: z.number().positive().optional(),
    currentFuel: z.number().min(0).max(100).optional(),
});

// ============================================================================
// Update Vehicle Schema
// ============================================================================

export const updateVehicleSchema = z.object({
    status: z.enum(['IDLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE']).optional(),
    currentFuel: z.number().min(0).max(100).optional(),
    currentShipmentId: z.string().uuid().nullable().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
