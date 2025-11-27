/**
 * INotifiable Interface
 * =====================
 * ABSTRACTION: Defines a contract for objects that can receive notifications.
 * 
 * This is an example of the Observer Pattern combined with Abstraction.
 * Different user types will implement notifications differently:
 * - Customers receive shipment updates
 * - Drivers receive job assignments
 * - Admins receive system alerts
 */
export interface INotifiable {
    /**
     * Send a notification to this entity
     * @param message The notification message
     * @param type The type of notification
     */
    notify(message: string, type: NotificationType): void;

    /**
     * Get notification preferences
     */
    getNotificationPreferences(): NotificationPreferences;

    /**
     * Update notification preferences
     */
    setNotificationPreferences(prefs: NotificationPreferences): void;
}

export enum NotificationType {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ALERT = 'ALERT',
    SUCCESS = 'SUCCESS',
}

export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
}
