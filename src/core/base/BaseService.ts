import { ILoggable } from '../types';

/**
 * BaseService Abstract Class
 * ==========================
 * ABSTRACTION + INHERITANCE + ENCAPSULATION:
 * 
 * This abstract class serves as the foundation for all service classes.
 * It demonstrates:
 * - ABSTRACTION: Abstract methods that must be implemented by subclasses
 * - INHERITANCE: Common functionality shared by all services
 * - ENCAPSULATION: Private logger instance, protected methods for subclasses
 */
export abstract class BaseService implements ILoggable {
    // ENCAPSULATION: Private instance name
    private readonly serviceName: string;
    private readonly logHistory: string[] = [];

    constructor(serviceName: string) {
        this.serviceName = serviceName;
        this.log(`${serviceName} initialized`);
    }

    /**
     * ILoggable implementation
     * Logs a message with timestamp and service name
     */
    public log(message: string): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${this.serviceName}] ${message}`;
        console.log(formattedMessage);
        this.logHistory.push(formattedMessage);
    }

    /**
     * ENCAPSULATION: Controlled access to log history
     */
    public getLogHistory(): readonly string[] {
        return Object.freeze([...this.logHistory]);
    }

    /**
     * ABSTRACTION: Template method pattern
     * Subclasses must implement the actual health check logic
     */
    abstract healthCheck(): Promise<boolean>;

    /**
     * Protected method for subclasses to use for error handling
     */
    protected handleError(error: Error, operation: string): never {
        this.log(`ERROR in ${operation}: ${error.message}`);
        throw new Error(`${this.serviceName} error in ${operation}: ${error.message}`);
    }

    /**
     * Protected method to validate required fields
     */
    protected validateRequired(obj: object, fields: string[]): void {
        for (const field of fields) {
            if (!(field in obj) || (obj as any)[field] === undefined) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }
}
