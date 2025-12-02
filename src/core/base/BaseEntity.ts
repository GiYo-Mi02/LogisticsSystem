/**
 * Base Entity Abstract Class
 * ==========================
 * @abstract
 * @description Provides a common base for all domain entities with shared functionality.
 * Demonstrates ABSTRACTION + ENCAPSULATION OOP pillars.
 * 
 * This abstract class encapsulates common properties (id, createdAt, updatedAt) with
 * private backing fields and controlled access through getters/setters.
 * Abstract methods force subclasses to implement specific behavior.
 * 
 * @example
 * ```typescript
 * class Shipment extends BaseEntity {
 *   validate(): boolean { return this.weight > 0; }
 *   toJSON(): object { return { id: this.id, weight: this.weight }; }
 * }
 * ```
 * 
 * @see User
 * @see Vehicle
 * @see Shipment
 */
export abstract class BaseEntity {
    // ENCAPSULATION: Private fields with controlled access
    private _id: string;
    private _createdAt: Date;
    private _updatedAt: Date;

    constructor(id: string) {
        this._id = id;
        this._createdAt = new Date();
        this._updatedAt = new Date();
    }

    // ENCAPSULATION: Getters provide read-only access
    public get id(): string {
        return this._id;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get updatedAt(): Date {
        return this._updatedAt;
    }

    // ENCAPSULATION: Protected setter allows subclasses to update
    protected set updatedAt(value: Date) {
        this._updatedAt = value;
    }

    /**
     * Mark the entity as modified by updating the timestamp.
     * @protected
     * @description Demonstrates ENCAPSULATION through controlled modification of internal state.
     * Called automatically when entity properties are changed.
     * @returns {void}
     * @example
     * ```typescript
     * // Inside a subclass method:
     * public setName(name: string): void {
     *   this._name = name;
     *   this.touch(); // Updates updatedAt timestamp
     * }
     * ```
     */
    protected touch(): void {
        this._updatedAt = new Date();
    }

    /**
     * Validate the entity's state and business rules.
     * @abstract
     * @description Forces subclasses to implement their own validation logic.
     * Demonstrates ABSTRACTION - each entity defines what "valid" means.
     * @returns {boolean} True if the entity is in a valid state, false otherwise.
     * @example
     * ```typescript
     * // In Shipment class:
     * validate(): boolean {
     *   return this.weight > 0 && this.origin != null && this.destination != null;
     * }
     * ```
     */
    abstract validate(): boolean;

    /**
     * Serialize the entity to a plain JavaScript object.
     * @abstract
     * @description Forces subclasses to implement their own serialization logic.
     * Useful for API responses and JSON storage.
     * @returns {object} A plain object representation of the entity.
     * @example
     * ```typescript
     * // In User class:
     * toJSON(): object {
     *   return { id: this.id, name: this.name, email: this.email };
     * }
     * ```
     */
    abstract toJSON(): object;

    /**
     * Compare two entities by their unique identifier.
     * @param {BaseEntity} other - The other entity to compare against.
     * @returns {boolean} True if both entities have the same ID, false otherwise.
     * @example
     * ```typescript
     * const user1 = new Customer('u-001', 'John', 'john@email.com');
     * const user2 = userService.getUserById('u-001');
     * if (user1.equals(user2)) {
     *   console.log('Same user!');
     * }
     * ```
     */
    public equals(other: BaseEntity): boolean {
        return this._id === other._id;
    }
}
