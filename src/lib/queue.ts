/**
 * Job Queue System using Upstash QStash
 * ======================================
 * 
 * Uses Upstash QStash for serverless-compatible async job processing.
 * QStash delivers HTTP requests to your endpoints, perfect for Vercel.
 * 
 * Flow:
 * 1. API receives shipment request
 * 2. Creates PENDING shipment in DB
 * 3. Enqueues job to QStash (calls /api/jobs/process-shipment)
 * 4. Returns 202 Accepted immediately
 * 5. QStash calls the processing endpoint
 * 6. Worker processes shipment and emits SSE event
 */

import { Client as QStashClient } from '@upstash/qstash';
import { getUpstashRedis } from './redis';

// ============================================================================
// Job Types
// ============================================================================

export type JobType = 'process-shipment' | 'calculate-pricing' | 'assign-vehicle';

export interface ShipmentJob {
    type: 'process-shipment';
    data: {
        shipmentId: string;
        customerId: string;
        weight: number;
        origin: {
            address?: string;
            city?: string;
            country?: string;
            lat: number;
            lng: number;
        };
        destination: {
            address?: string;
            city?: string;
            country?: string;
            lat: number;
            lng: number;
        };
        urgency: 'high' | 'standard' | 'low';
    };
}

export interface JobResult {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
}

// ============================================================================
// QStash Client (Serverless Queue)
// ============================================================================

let qstashClient: QStashClient | null = null;

function getQStash(): QStashClient {
    if (!qstashClient) {
        const token = process.env.QSTASH_TOKEN;
        
        if (!token) {
            throw new Error(
                'Missing QStash token. Please set QSTASH_TOKEN environment variable.'
            );
        }
        
        qstashClient = new QStashClient({ token });
    }
    
    return qstashClient;
}

// ============================================================================
// Job Queue Functions
// ============================================================================

/**
 * Enqueue a shipment processing job
 * Returns immediately after queueing
 */
export async function enqueueShipmentJob(job: ShipmentJob['data']): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store job status in Redis
    const redis = getUpstashRedis();
    await redis.hset(`job:${jobId}`, {
        status: 'queued',
        type: 'process-shipment',
        data: JSON.stringify(job),
        createdAt: Date.now().toString(),
    });
    
    // Get the base URL for the callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
    
    try {
        const qstash = getQStash();
        
        // Publish job to QStash - it will call our processing endpoint
        await qstash.publishJSON({
            url: `${baseUrl}/api/jobs/process-shipment`,
            body: {
                jobId,
                ...job,
            },
            retries: 3,
            // Add delay if needed for rate limiting
            // delay: 0,
        });
        
        console.log(`✓ Job ${jobId} enqueued to QStash`);
    } catch (error) {
        // If QStash fails, update job status
        await redis.hset(`job:${jobId}`, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'QStash publish failed',
        });
        throw error;
    }
    
    return jobId;
}

/**
 * Get job status from Redis
 */
export async function getJobStatus(jobId: string): Promise<JobResult | null> {
    const redis = getUpstashRedis();
    const job = await redis.hgetall(`job:${jobId}`);
    
    if (!job || Object.keys(job).length === 0) {
        return null;
    }
    
    return {
        jobId,
        status: (job.status as JobResult['status']) || 'queued',
        result: job.result ? JSON.parse(job.result as string) : undefined,
        error: job.error as string | undefined,
    };
}

/**
 * Update job status in Redis
 */
export async function updateJobStatus(
    jobId: string,
    status: JobResult['status'],
    result?: any,
    error?: string
): Promise<void> {
    const redis = getUpstashRedis();
    
    const updates: Record<string, string> = {
        status,
        updatedAt: Date.now().toString(),
    };
    
    if (result) {
        updates.result = JSON.stringify(result);
    }
    
    if (error) {
        updates.error = error;
    }
    
    await redis.hset(`job:${jobId}`, updates);
    
    // Set expiry for completed/failed jobs (24 hours)
    if (status === 'completed' || status === 'failed') {
        await redis.expire(`job:${jobId}`, 86400);
    }
}

// ============================================================================
// Fallback: Synchronous Processing
// ============================================================================

/**
 * Check if async queue is available and can be used
 * Falls back to sync processing if:
 * - QStash is not configured
 * - No public URL is available (localhost won't work with QStash)
 */
export function isQueueAvailable(): boolean {
    const hasQStashToken = !!process.env.QSTASH_TOKEN;
    const hasPublicUrl = !!(
        process.env.VERCEL_URL || 
        (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost'))
    );
    
    // QStash only works with publicly accessible URLs
    // In local dev, fall back to synchronous processing
    return hasQStashToken && hasPublicUrl;
}

// ============================================================================
// Job Cleanup
// ============================================================================

/**
 * Clean up old completed jobs (called periodically)
 */
export async function cleanupOldJobs(): Promise<number> {
    // Redis TTL handles this automatically when we set expire
    // This function is here for any additional cleanup logic
    return 0;
}
