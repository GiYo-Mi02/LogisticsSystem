import { NextResponse } from 'next/server';
import { getApiSpec } from '@/lib/swagger';

/**
 * GET /api/docs/spec
 * Returns the OpenAPI specification as JSON
 */
export async function GET() {
  return NextResponse.json(getApiSpec());
}
