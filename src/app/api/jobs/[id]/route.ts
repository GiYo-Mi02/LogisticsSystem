/**
 * Job Status Endpoint
 * ===================
 * Allows frontend to poll job status if SSE is unavailable
 */

import { NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/queue';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        if (!id) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
        }
        
        const status = await getJobStatus(id);
        
        if (!status) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }
        
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error fetching job status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch job status' },
            { status: 500 }
        );
    }
}
