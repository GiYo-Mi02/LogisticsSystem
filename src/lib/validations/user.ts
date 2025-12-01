/**
 * User Validation Schemas
 * =======================
 * Zod schemas for user/auth-related API requests
 */

import { z } from 'zod';
import { emailSchema, userRoleSchema, uuidSchema } from './common';

// ============================================================================
// Login/Register Schema
// ============================================================================

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').optional(), // Optional for demo
    role: userRoleSchema.default('CUSTOMER'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
});

// ============================================================================
// Driver Assignment Schemas
// ============================================================================

export const getDriverAssignmentSchema = z.object({
    driverId: uuidSchema,
});

export const acceptJobSchema = z.object({
    driverId: uuidSchema,
    shipmentId: uuidSchema,
});

export const completeDeliverySchema = z.object({
    shipmentId: uuidSchema,
    driverId: uuidSchema.optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type GetDriverAssignmentQuery = z.infer<typeof getDriverAssignmentSchema>;
export type AcceptJobInput = z.infer<typeof acceptJobSchema>;
export type CompleteDeliveryInput = z.infer<typeof completeDeliverySchema>;
