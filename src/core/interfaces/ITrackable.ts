/**
 * ITrackable Interface - Tracking Contract
 * =====================
 * @interface ITrackable
 * @description Defines a contract for objects that can be tracked in real-time.
 * Demonstrates ABSTRACTION by hiding implementation details and exposing only essential operations.
 * 
 * Classes implementing this interface:
 * - {@link Vehicle} - Tracks vehicle location and status
 * - {@link Shipment} - Tracks package location and delivery status
 * 
 * @example
 * ```typescript
 * class Package implements ITrackable {
 *   getTrackingId(): string { return this.trackingNumber; }
 *   getStatus(): string { return this.currentStatus; }
 *   getCurrentLocation(): Location { return this.location; }
 *   getTrackingHistory(): TrackingEvent[] { return this.history; }
 * }
 * 
 * // Usage:
 * function displayTracking(item: ITrackable) {
 *   console.log(`ID: ${item.getTrackingId()}, Status: ${item.getStatus()}`);
 * }
 * ```
 */
export interface ITrackable {
    /**
     * Get the unique tracking identifier for this object.
     * @returns {string} A unique identifier used for tracking (e.g., "TRK-ABC123").
     * @example
     * ```typescript
     * const trackingId = shipment.getTrackingId(); // "TRK-1701234567-XYZ"
     * ```
     */
    getTrackingId(): string;

    /**
     * Get the current status of the trackable item.
     * @returns {string} The current status (e.g., "PENDING", "IN_TRANSIT", "DELIVERED").
     * @example
     * ```typescript
     * const status = vehicle.getStatus(); // "IN_TRANSIT"
     * ```
     */
    getStatus(): string;

    /**
     * Get the current geographic location coordinates.
     * @returns {{ lat: number; lng: number }} An object containing latitude and longitude.
     * @example
     * ```typescript
     * const location = shipment.getCurrentLocation();
     * console.log(`Lat: ${location.lat}, Lng: ${location.lng}`);
     * ```
     */
    getCurrentLocation(): { lat: number; lng: number };

    /**
     * Get the complete tracking history with all status changes and locations.
     * @returns {TrackingEvent[]} An array of tracking events sorted by timestamp.
     * @example
     * ```typescript
     * const history = package.getTrackingHistory();
     * history.forEach(event => {
     *   console.log(`${event.timestamp}: ${event.description}`);
     * });
     * ```
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
