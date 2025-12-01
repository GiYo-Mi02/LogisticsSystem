/**
 * Redis Client Configuration
 * ==========================
 * Supports both Upstash (serverless) and standard Redis connections.
 * 
 * For Upstash: Uses @upstash/redis REST API (works in serverless environments)
 * For local/standard Redis: Uses ioredis (requires persistent connection)
 */

import { Redis as UpstashRedis } from '@upstash/redis';
import IORedis from 'ioredis';

// ============================================================================
// Upstash Redis Client (REST-based, serverless-friendly)
// ============================================================================

let upstashClient: UpstashRedis | null = null;

/**
 * Get Upstash Redis client (lazy initialization)
 * Uses REST API - works in Vercel Edge/Serverless
 */
export function getUpstashRedis(): UpstashRedis {
    if (!upstashClient) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        if (!url || !token) {
            throw new Error(
                'Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
            );
        }

        upstashClient = new UpstashRedis({
            url,
            token,
        });
    }

    return upstashClient;
}

// ============================================================================
// IORedis Client (Connection-based, for BullMQ workers)
// ============================================================================

let ioRedisClient: IORedis | null = null;

/**
 * Get IORedis client for BullMQ (requires persistent connection)
 * Use this for background workers running on long-lived servers
 */
export function getIORedis(): IORedis {
    if (!ioRedisClient) {
        const url = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;

        if (!url) {
            throw new Error(
                'Missing Redis URL. Please set UPSTASH_REDIS_URL or REDIS_URL environment variable.'
            );
        }

        ioRedisClient = new IORedis(url, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            retryStrategy: (times) => {
                if (times > 3) {
                    console.error('Redis connection failed after 3 retries');
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
        });

        ioRedisClient.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });

        ioRedisClient.on('connect', () => {
            console.log('✓ Redis connected');
        });
    }

    return ioRedisClient;
}

// ============================================================================
// Pub/Sub for Real-time Events (replaces in-memory emitter)
// ============================================================================

let pubClient: IORedis | null = null;
let subClient: IORedis | null = null;

/**
 * Get Redis publisher client for emitting events
 */
export function getRedisPub(): IORedis {
    if (!pubClient) {
        pubClient = getIORedis().duplicate();
    }
    return pubClient;
}

/**
 * Get Redis subscriber client for receiving events
 */
export function getRedisSub(): IORedis {
    if (!subClient) {
        subClient = getIORedis().duplicate();
    }
    return subClient;
}

// ============================================================================
// Helper: Check if Redis is available
// ============================================================================

export async function isRedisAvailable(): Promise<boolean> {
    try {
        const redis = getUpstashRedis();
        await redis.ping();
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

export async function closeRedisConnections(): Promise<void> {
    const connections = [ioRedisClient, pubClient, subClient].filter(Boolean);
    
    await Promise.all(
        connections.map((client) => client?.quit().catch(() => {}))
    );

    ioRedisClient = null;
    pubClient = null;
    subClient = null;
    upstashClient = null;
}
