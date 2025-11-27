'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeEvent } from '@/lib/realtime';

type EventHandler = (event: RealtimeEvent) => void;

interface UseRealtimeOptions {
    channel?: string;
    onShipmentUpdate?: EventHandler;
    onVehicleUpdate?: EventHandler;
    onNewShipment?: EventHandler;
    onAssignmentUpdate?: EventHandler;
    onStatsUpdate?: EventHandler;
    onAnyEvent?: EventHandler;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
    const {
        channel = 'all',
    } = options;

    // Store handlers in refs to avoid recreating the connection
    const handlersRef = useRef(options);
    handlersRef.current = options;

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const [isConnected, setIsConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const connect = () => {
            // Don't reconnect if unmounted
            if (!mountedRef.current) return;

            // Close existing connection
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            // Clear any pending reconnect
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            const eventSource = new EventSource(`/api/realtime?channel=${channel}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                if (!mountedRef.current) return;
                setIsConnected(true);
                reconnectAttempts.current = 0;
                console.log('[Realtime] Connected');
            };

            eventSource.onmessage = (event) => {
                if (!mountedRef.current) return;
                
                try {
                    const data: RealtimeEvent = JSON.parse(event.data);
                    setLastEvent(data);

                    // Skip ping/connected messages for handlers
                    if (data.type === 'ping' || data.type === 'connected') return;

                    const handlers = handlersRef.current;

                    // Call specific handlers
                    switch (data.type) {
                        case 'shipment_update':
                            handlers.onShipmentUpdate?.(data);
                            break;
                        case 'vehicle_update':
                            handlers.onVehicleUpdate?.(data);
                            break;
                        case 'new_shipment':
                            handlers.onNewShipment?.(data);
                            break;
                        case 'assignment_update':
                            handlers.onAssignmentUpdate?.(data);
                            break;
                        case 'stats_update':
                            handlers.onStatsUpdate?.(data);
                            break;
                    }

                    // Always call onAnyEvent if provided
                    handlers.onAnyEvent?.(data);
                } catch (error) {
                    console.error('[Realtime] Failed to parse event:', error);
                }
            };

            eventSource.onerror = () => {
                if (!mountedRef.current) return;
                
                setIsConnected(false);
                eventSource.close();
                eventSourceRef.current = null;

                // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
                reconnectAttempts.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
                
                console.log(`[Realtime] Reconnecting in ${delay}ms...`);
                reconnectTimeoutRef.current = setTimeout(connect, delay);
            };
        };

        connect();

        return () => {
            mountedRef.current = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [channel]); // Only reconnect if channel changes

    return {
        isConnected,
        lastEvent,
    };
}

// Simplified hook for just triggering a refetch on any event
export function useRealtimeRefresh(refetchFn: () => void, eventTypes?: RealtimeEvent['type'][]) {
    const refetchRef = useRef(refetchFn);
    refetchRef.current = refetchFn;

    return useRealtime({
        onAnyEvent: (event) => {
            if (!eventTypes || eventTypes.includes(event.type)) {
                refetchRef.current();
            }
        },
    });
}
