// Real-time event types
export type RealtimeEvent = {
    type: 'shipment_update' | 'vehicle_update' | 'new_shipment' | 'assignment_update' | 'stats_update' | 'ping' | 'connected';
    data: any;
    timestamp: number;
};

// In-memory event emitter for SSE connections
class RealtimeEventEmitter {
    private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();

    subscribe(channel: string, callback: (event: RealtimeEvent) => void): () => void {
        if (!this.listeners.has(channel)) {
            this.listeners.set(channel, new Set());
        }
        this.listeners.get(channel)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(channel)?.delete(callback);
        };
    }

    emit(channel: string, event: RealtimeEvent) {
        // Emit to specific channel
        this.listeners.get(channel)?.forEach(callback => callback(event));
        // Also emit to 'all' channel for global listeners
        this.listeners.get('all')?.forEach(callback => callback(event));
    }

    broadcast(event: RealtimeEvent) {
        // Broadcast to all channels
        this.listeners.forEach((callbacks) => {
            callbacks.forEach(callback => callback(event));
        });
    }
}

// Singleton instance
export const realtimeEmitter = new RealtimeEventEmitter();

// Helper to emit events from API routes
export function emitShipmentUpdate(shipment: any) {
    realtimeEmitter.broadcast({
        type: 'shipment_update',
        data: shipment,
        timestamp: Date.now()
    });
}

export function emitVehicleUpdate(vehicle: any) {
    realtimeEmitter.broadcast({
        type: 'vehicle_update',
        data: vehicle,
        timestamp: Date.now()
    });
}

export function emitNewShipment(shipment: any) {
    realtimeEmitter.broadcast({
        type: 'new_shipment',
        data: shipment,
        timestamp: Date.now()
    });
}

export function emitAssignmentUpdate(assignment: any) {
    realtimeEmitter.broadcast({
        type: 'assignment_update',
        data: assignment,
        timestamp: Date.now()
    });
}

export function emitStatsUpdate(stats: any) {
    realtimeEmitter.broadcast({
        type: 'stats_update',
        data: stats,
        timestamp: Date.now()
    });
}
