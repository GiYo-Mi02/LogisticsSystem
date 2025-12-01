/**
 * Request Validation Utility
 * ==========================
 * Helper functions for validating API requests with Zod
 */

import { z, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

// ============================================================================
// Validation Result Types
// ============================================================================

export type ValidationSuccess<T> = {
    success: true;
    data: T;
};

export type ValidationError = {
    success: false;
    error: {
        message: string;
        details: Array<{
            field: string;
            message: string;
        }>;
    };
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate data against a Zod schema
 * Returns typed data on success, or structured error on failure
 */
export function validateData<T>(
    schema: ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data);
    
    if (result.success) {
        return { success: true, data: result.data };
    }
    
    return {
        success: false,
        error: {
            message: 'Validation failed',
            details: result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        },
    };
}

/**
 * Validate request body and return NextResponse on error
 * Use this in API route handlers
 */
export async function validateRequestBody<T>(
    request: Request,
    schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
    try {
        const body = await request.json();
        console.log('Validating request body:', JSON.stringify(body, null, 2));
        
        const result = validateData(schema, body);

        if (!result.success) {
            console.error('Validation failed:', JSON.stringify(result.error, null, 2));
            return {
                error: NextResponse.json(
                    {
                        error: result.error.message,
                        details: result.error.details,
                    },
                    { status: 400 }
                ),
            };
        }

        return { data: result.data };
    } catch (error) {
        console.error('JSON parsing error:', error);
        return {
            error: NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            ),
        };
    }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
    searchParams: URLSearchParams,
    schema: ZodSchema<T>
): ValidationResult<T> {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return validateData(schema, params);
}

/**
 * Validate path parameters
 */
export function validatePathParams<T>(
    params: Record<string, string>,
    schema: ZodSchema<T>
): ValidationResult<T> {
    return validateData(schema, params);
}

// ============================================================================
// Error Response Helper
// ============================================================================

/**
 * Create a validation error response
 */
export function validationErrorResponse(
    error: ValidationError['error']
): NextResponse {
    return NextResponse.json(
        {
            error: error.message,
            details: error.details,
        },
        { status: 400 }
    );
}

/**
 * Create a simple error response
 */
export function errorResponse(
    message: string,
    status: number = 500
): NextResponse {
    return NextResponse.json({ error: message }, { status });
}
