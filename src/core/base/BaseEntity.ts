/**
 * Base Entity Abstract Class
 * ==========================
 * ABSTRACTION + ENCAPSULATION: 
 * 
 * This abstract class provides a common base for all domain entities.
 * It encapsulates common properties (id, createdAt, updatedAt) with
 * private backing fields and controlled access through getters/setters.
 * 
 * The abstract methods force subclasses to implement specific behavior
 * while inheriting common functionality.
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
     * Mark the entity as modified
     * ENCAPSULATION: Controlled modification of internal state
     */
    protected touch(): void {
        this._updatedAt = new Date();
    }

    /**
     * ABSTRACTION: Force subclasses to implement validation
     */
    abstract validate(): boolean;

    /**
     * ABSTRACTION: Force subclasses to implement serialization
     */
    abstract toJSON(): object;

    /**
     * Compare two entities by ID
     */
    public equals(other: BaseEntity): boolean {
        return this._id === other._id;
    }
}
