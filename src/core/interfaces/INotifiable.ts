/**
 * INotifiable Interface - Notification Contract
 * =====================
 * @interface INotifiable
 * @description Defines a contract for objects that can receive notifications.
 * Demonstrates the Observer Pattern combined with Abstraction OOP principle.
 * 
 * Different user types implement notifications differently:
 * - **Customers**: Receive shipment updates and delivery notifications
 * - **Drivers**: Receive job assignments and route updates
 * - **Admins**: Receive system alerts and analytics reports
 * 
 * @example
 * ```typescript
 * class Customer implements INotifiable {
 *   notify(message: string, type: NotificationType): void {
 *     if (this.preferences.push) {
 *       sendPushNotification(this.deviceToken, message);
 *     }
 *     if (this.preferences.email) {
 *       sendEmail(this.email, message);
 *     }
 *   }
 * }
 * ```
 * 
 * @see User
 * @see NotificationType
 * @see NotificationPreferences
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
