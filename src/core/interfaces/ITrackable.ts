/**
 * ITrackable Interface
 * =====================
 * ABSTRACTION: Defines a contract for objects that can be tracked.
 * This interface hides the implementation details and exposes only
 * the essential tracking operations.
 * 
 * Any class implementing this interface MUST provide these methods,
 * but HOW they implement them is their own concern.
 */
export interface ITrackable {
    /**
     * Get the unique tracking identifier
     */
    getTrackingId(): string;

    /**
     * Get the current status of the trackable item
     */
    getStatus(): string;

    /**
     * Get the current location coordinates
     */
    getCurrentLocation(): { lat: number; lng: number };

    /**
     * Get the complete tracking history
     */
    getTrackingHistory(): TrackingEvent[];
}

/**
 * TrackingEvent Type
 * Represents a single tracking event in the history
 */
export interface TrackingEvent {
    timestamp: Date;
    status: string;
    location: { lat: number; lng: number };
    description: string;
}
