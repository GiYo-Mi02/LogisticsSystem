/**
 * ============================================================================
 * PRICING STRATEGY - Strategy Design Pattern & OOP Demonstration
 * ============================================================================
 * 
 * DESIGN PATTERN: Strategy Pattern
 * - Defines a family of algorithms (pricing strategies)
 * - Encapsulates each algorithm
 * - Makes them interchangeable at runtime
 * 
 * OOP PILLARS DEMONSTRATED:
 * 1. ABSTRACTION: PricingStrategy interface defines contract without implementation
 * 2. POLYMORPHISM: Different strategies implement the same interface differently
 * 3. ENCAPSULATION: Each strategy encapsulates its own pricing logic
 * 4. INHERITANCE: Abstract class provides shared functionality
 */

/**
 * PricingStrategy Interface (ABSTRACTION)
 * ========================================
 * This interface defines the CONTRACT that all pricing strategies must follow.
 * It abstracts away the implementation details - callers don't need to know
 * HOW the price is calculated, just that they can calculate it.
 */
export interface PricingStrategy {
    /** Calculate the price for a shipment */
    calculate(weight: number, distance: number): number;
    
    /** Get the name of this strategy */
    getStrategyName(): string;
    
    /** Get the base rates for transparency */
    getRates(): { weightRate: number; distanceRate: number; surcharges: Record<string, number> };
    
    /** Check if this strategy supports a given weight/distance */
    isEligible(weight: number, distance: number): boolean;
}

/**
 * Abstract Base Pricing Strategy (ABSTRACTION + INHERITANCE)
 * ==========================================================
 * Provides common functionality for all pricing strategies.
 * ENCAPSULATION: Protected fields allow subclass access but prevent external access.
 */
export abstract class BasePricingStrategy implements PricingStrategy {
    // ENCAPSULATION: Protected fields for subclass access only
    protected _name: string;
    protected _weightRate: number;
    protected _distanceRate: number;
    protected _surcharges: Map<string, number> = new Map();
    protected _minWeight: number = 0;
    protected _maxWeight: number = Infinity;
    protected _minDistance: number = 0;
    protected _maxDistance: number = Infinity;

    constructor(
        name: string,
        weightRate: number,
        distanceRate: number
    ) {
        this._name = name;
        this._weightRate = weightRate;
        this._distanceRate = distanceRate;
    }

    /**
     * Template Method Pattern: Base implementation with hook for customization
     * POLYMORPHISM: Subclasses can override calculateSurcharges()
     */
    public calculate(weight: number, distance: number): number {
        // Validate eligibility first
        if (!this.isEligible(weight, distance)) {
            throw new Error(`${this._name} strategy not eligible for weight: ${weight}kg, distance: ${distance}km`);
        }

        // Base calculation
        const basePrice = (weight * this._weightRate) + (distance * this._distanceRate);
        
        // Apply surcharges (polymorphic method)
        const surchargeAmount = this.calculateSurcharges(weight, distance);
        
        // Apply discount (polymorphic method)
        const discountAmount = this.calculateDiscount(basePrice, weight, distance);

        return Math.max(0, basePrice + surchargeAmount - discountAmount);
    }

    /**
     * ABSTRACTION: Protected method for subclasses to implement surcharge logic
     */
    protected abstract calculateSurcharges(weight: number, distance: number): number;

    /**
     * Hook method for discounts - can be overridden by subclasses
     * POLYMORPHISM: Different strategies can offer different discounts
     */
    protected calculateDiscount(basePrice: number, weight: number, distance: number): number {
        return 0; // Default: no discount
    }

    public getStrategyName(): string {
        return this._name;
    }

    public getRates(): { weightRate: number; distanceRate: number; surcharges: Record<string, number> } {
        return {
            weightRate: this._weightRate,
            distanceRate: this._distanceRate,
            surcharges: Object.fromEntries(this._surcharges),
        };
    }

    public isEligible(weight: number, distance: number): boolean {
        return (
            weight >= this._minWeight &&
            weight <= this._maxWeight &&
            distance >= this._minDistance &&
            distance <= this._maxDistance
        );
    }

    /**
     * Add a surcharge type
     * ENCAPSULATION: Controlled modification of surcharges
     */
    public addSurcharge(name: string, amount: number): void {
        this._surcharges.set(name, amount);
    }

    /**
     * Remove a surcharge type
     */
    public removeSurcharge(name: string): boolean {
        return this._surcharges.delete(name);
    }
}

/**
 * ============================================================================
 * CONCRETE STRATEGIES - POLYMORPHISM in Action
 * ============================================================================
 * Each strategy implements the same interface but with different behavior
 */

/**
 * Air Pricing Strategy
 * ====================
 * INHERITANCE: Extends BasePricingStrategy
 * POLYMORPHISM: Implements abstract calculateSurcharges() differently
 * 
 * Expensive but fast. Best for urgent, lightweight deliveries.
 */
export class AirPricingStrategy extends BasePricingStrategy {
    // ENCAPSULATION: Private field specific to air pricing
    private _fuelSurchargePercentage: number = 0.15; // 15%
    private _priorityBonus: boolean = false;

    constructor() {
        super('Air Express', 2.5, 1.5); // $2.5/kg + $1.5/km
        
        // Air shipping - no strict limits for flexibility
        // Weight/distance limits are informational, not enforced
        
        // Default surcharges
        this._surcharges.set('handling', 5.00);
        this._surcharges.set('insurance', 2.00);
    }

    /**
     * POLYMORPHISM: Air-specific surcharge calculation
     */
    protected calculateSurcharges(weight: number, distance: number): number {
        let surcharge = 0;
        
        // Sum all fixed surcharges
        this._surcharges.forEach(amount => {
            surcharge += amount;
        });

        // Fuel surcharge based on distance
        surcharge += distance * this._distanceRate * this._fuelSurchargePercentage;

        // Priority bonus surcharge
        if (this._priorityBonus) {
            surcharge += 15.00;
        }

        return surcharge;
    }

    /**
     * POLYMORPHISM: Air offers volume discounts
     */
    protected calculateDiscount(basePrice: number, weight: number, distance: number): number {
        // 5% discount for distances over 1000km
        if (distance > 1000) {
            return basePrice * 0.05;
        }
        return 0;
    }

    // Air-specific methods
    public enablePriorityDelivery(): void {
        this._priorityBonus = true;
    }

    public setFuelSurcharge(percentage: number): void {
        if (percentage < 0 || percentage > 1) {
            throw new Error('Fuel surcharge must be between 0 and 1');
        }
        this._fuelSurchargePercentage = percentage;
    }
}

/**
 * Ground Pricing Strategy
 * =======================
 * INHERITANCE: Extends BasePricingStrategy
 * POLYMORPHISM: Different implementation of abstract methods
 * 
 * Standard rates, reliable service. Most versatile option.
 */
export class GroundPricingStrategy extends BasePricingStrategy {
    // ENCAPSULATION: Ground-specific private fields
    private _zoneMultipliers: Map<string, number> = new Map();
    private _weekendSurcharge: boolean = false;

    constructor() {
        super('Ground Standard', 0.5, 0.8); // $0.5/kg + $0.8/km
        
        // Ground shipping - flexible limits
        // No strict enforcement to avoid runtime errors
        
        // Initialize zone multipliers
        this._zoneMultipliers.set('urban', 1.0);
        this._zoneMultipliers.set('suburban', 1.1);
        this._zoneMultipliers.set('rural', 1.3);
        this._zoneMultipliers.set('remote', 1.5);
        
        // Default surcharges
        this._surcharges.set('handling', 2.50);
    }

    /**
     * POLYMORPHISM: Ground-specific surcharge calculation
     */
    protected calculateSurcharges(weight: number, distance: number): number {
        let surcharge = 0;
        
        // Sum all fixed surcharges
        this._surcharges.forEach(amount => {
            surcharge += amount;
        });

        // Heavy item surcharge (over 100kg)
        if (weight > 100) {
            surcharge += Math.floor(weight / 100) * 10; // $10 per 100kg over
        }

        // Weekend surcharge
        if (this._weekendSurcharge) {
            surcharge += 8.00;
        }

        return surcharge;
    }

    /**
     * POLYMORPHISM: Ground offers weight-based discounts
     */
    protected calculateDiscount(basePrice: number, weight: number, distance: number): number {
        // Bulk discount for heavy shipments
        if (weight > 500) {
            return basePrice * 0.10; // 10% off
        } else if (weight > 200) {
            return basePrice * 0.05; // 5% off
        }
        return 0;
    }

    // Ground-specific methods
    public setZoneMultiplier(zone: string, multiplier: number): void {
        this._zoneMultipliers.set(zone, multiplier);
    }

    public enableWeekendDelivery(): void {
        this._weekendSurcharge = true;
    }

    public getZonePrice(zone: string, basePrice: number): number {
        const multiplier = this._zoneMultipliers.get(zone) ?? 1.0;
        return basePrice * multiplier;
    }
}

/**
 * Sea Pricing Strategy
 * ====================
 * INHERITANCE: Extends BasePricingStrategy
 * POLYMORPHISM: Unique implementation for maritime shipping
 * 
 * Cheapest for heavy loads, slow but economical.
 */
export class SeaPricingStrategy extends BasePricingStrategy {
    // ENCAPSULATION: Sea-specific private fields
    private _containerSize: 'standard' | 'large' = 'standard';
    private _hazmatCertified: boolean = false;
    private _portFees: Map<string, number> = new Map();

    constructor() {
        super('Sea Freight', 0.1, 0.2); // $0.1/kg + $0.2/km
        
        // Sea shipping - flexible limits to avoid runtime errors
        // No strict enforcement
        
        // Default port fees
        this._portFees.set('origin', 50.00);
        this._portFees.set('destination', 50.00);
        
        // Default surcharges
        this._surcharges.set('documentation', 25.00);
    }

    /**
     * POLYMORPHISM: Sea-specific surcharge calculation
     */
    protected calculateSurcharges(weight: number, distance: number): number {
        let surcharge = 0;
        
        // Sum all fixed surcharges
        this._surcharges.forEach(amount => {
            surcharge += amount;
        });

        // Port fees
        this._portFees.forEach(fee => {
            surcharge += fee;
        });

        // Container size surcharge
        if (this._containerSize === 'large') {
            surcharge += 200.00;
        }

        // Hazmat surcharge
        if (this._hazmatCertified) {
            surcharge += weight * 0.5; // $0.5/kg extra for hazmat
        }

        return surcharge;
    }

    /**
     * POLYMORPHISM: Sea offers massive discounts for volume
     */
    protected calculateDiscount(basePrice: number, weight: number, distance: number): number {
        // Massive bulk discounts for sea freight
        if (weight > 10000) {
            return basePrice * 0.20; // 20% off for 10+ tons
        } else if (weight > 5000) {
            return basePrice * 0.15; // 15% off for 5+ tons
        } else if (weight > 1000) {
            return basePrice * 0.10; // 10% off for 1+ ton
        }
        return 0;
    }

    // Sea-specific methods
    public setContainerSize(size: 'standard' | 'large'): void {
        this._containerSize = size;
    }

    public enableHazmatHandling(): void {
        this._hazmatCertified = true;
        this._surcharges.set('hazmat_certification', 100.00);
    }

    public setPortFee(portType: string, fee: number): void {
        this._portFees.set(portType, fee);
    }
}

/**
 * ============================================================================
 * PRICING STRATEGY FACTORY - Factory Pattern Bonus!
 * ============================================================================
 * Demonstrates another design pattern working alongside Strategy
 */
export class PricingStrategyFactory {
    private static strategies: Map<string, () => PricingStrategy> = new Map<string, () => PricingStrategy>();

    static {
        this.strategies.set('air', () => new AirPricingStrategy());
        this.strategies.set('ground', () => new GroundPricingStrategy());
        this.strategies.set('sea', () => new SeaPricingStrategy());
    }

    /**
     * Factory Method: Create a pricing strategy by type
     */
    public static create(type: 'air' | 'ground' | 'sea'): PricingStrategy {
        const factory = this.strategies.get(type);
        if (!factory) {
            throw new Error(`Unknown pricing strategy: ${type}`);
        }
        return factory();
    }

    /**
     * Get the best strategy based on weight and distance
     */
    public static recommend(weight: number, distance: number): PricingStrategy {
        const strategies: PricingStrategy[] = [
            new AirPricingStrategy(),
            new GroundPricingStrategy(),
            new SeaPricingStrategy(),
        ];

        // Filter eligible strategies
        const eligible = strategies.filter(s => s.isEligible(weight, distance));
        
        if (eligible.length === 0) {
            throw new Error(`No eligible pricing strategy for weight: ${weight}kg, distance: ${distance}km`);
        }

        // Find cheapest
        return eligible.reduce((cheapest, current) => {
            const cheapestPrice = cheapest.calculate(weight, distance);
            const currentPrice = current.calculate(weight, distance);
            return currentPrice < cheapestPrice ? current : cheapest;
        });
    }

    /**
     * Compare all strategies for a given shipment
     */
    public static compareAll(weight: number, distance: number): Array<{ strategy: string; price: number; eligible: boolean }> {
        return ['air', 'ground', 'sea'].map(type => {
            const strategy = this.create(type as 'air' | 'ground' | 'sea');
            const eligible = strategy.isEligible(weight, distance);
            return {
                strategy: strategy.getStrategyName(),
                price: eligible ? strategy.calculate(weight, distance) : -1,
                eligible,
            };
        });
    }
}
