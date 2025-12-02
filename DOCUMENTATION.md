# LogIQ - Autonomous Logistics Management System

## 📋 Complete Project Documentation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Program Design and Structure](#2-program-design-and-structure)
3. [Functionality and Execution](#3-functionality-and-execution)
4. [Code Quality and Style](#4-code-quality-and-style)
5. [Creativity and Originality](#5-creativity-and-originality)
6. [UML Class Diagrams](#6-uml-class-diagrams)
7. [Screenshots](#7-screenshots)
8. [User Manual](#8-user-manual)
9. [Test Coverage Report](#9-test-coverage-report)

---

## 1. Project Overview

**LogIQ** is a next-generation autonomous logistics management system built with TypeScript and Next.js. The system demonstrates advanced Object-Oriented Programming (OOP) principles through a realistic logistics domain that manages shipments, vehicles, users, and pricing strategies.

### Technology Stack

| Technology    | Purpose                      |
| ------------- | ---------------------------- |
| TypeScript    | Type-safe OOP implementation |
| Next.js 14    | Full-stack React framework   |
| Prisma        | Database ORM                 |
| Vitest        | Unit testing framework       |
| Framer Motion | UI animations                |
| TailwindCSS   | Styling                      |

### Key Features

- ✅ **254 Unit Tests** - All passing
- ✅ **7 Test Suites** covering all core classes
- ✅ **4 OOP Pillars** fully demonstrated
- ✅ **5 Design Patterns** implemented
- ✅ **Geographic Route Analysis** with realistic constraints
- ✅ **Real-time Shipment Tracking**
- ✅ **Dynamic Pricing Strategies**

---

## 2. Program Design and Structure

### 2.1 Architecture Overview

The project follows a **clean, modular architecture** with clear separation of concerns:

```
src/
├── core/                    # Domain Logic (OOP Classes)
│   ├── base/               # Abstract base classes
│   │   ├── BaseEntity.ts   # Common entity functionality
│   │   └── BaseService.ts  # Common service patterns
│   ├── interfaces/         # Abstraction contracts
│   │   ├── ITrackable.ts   # Tracking interface
│   │   ├── IPayable.ts     # Payment interface
│   │   └── INotifiable.ts  # Notification interface
│   ├── Vehicle.ts          # Vehicle class hierarchy
│   ├── User.ts             # User class hierarchy
│   ├── Shipment.ts         # Shipment management
│   ├── PricingStrategy.ts  # Strategy pattern
│   ├── ShipmentFactory.ts  # Factory patterns
│   ├── RouteAnalyzer.ts    # Geographic analysis
│   └── __tests__/          # Unit tests (254 tests)
├── components/             # React UI Components
├── services/               # Business Logic Services
└── app/                    # Next.js App Router
```

### 2.2 The Four OOP Pillars

#### 🔒 ENCAPSULATION

**Definition:** Bundling data (fields) with methods that operate on that data, while restricting direct access.

**Implementation in our project:**

```typescript
// From Vehicle.ts - Private fields with controlled access
export abstract class Vehicle extends BaseEntity implements ITrackable {
  // Private fields - cannot be accessed directly from outside
  private _licenseId: string;
  private _type: VehicleType;
  private _capacity: number;
  private _currentFuel: number;
  private _status: VehicleStatus;

  // Public getter - controlled read access
  public get licenseId(): string {
    return this._licenseId;
  }

  // Public setter with validation - controlled write access
  public set status(value: VehicleStatus) {
    const validTransitions = this.getValidStatusTransitions();
    if (!validTransitions.includes(value)) {
      throw new Error(
        `Invalid status transition from ${this._status} to ${value}`
      );
    }
    this._status = value;
    this.touch(); // Update timestamp
  }

  // Protected method - accessible only by subclasses
  protected maintenanceLog: string[] = [];
}
```

**Where it's used:**
| Class | Private Fields | Purpose |
|-------|---------------|---------|
| `Vehicle` | `_currentFuel`, `_status`, `_capacity` | Protect vehicle state integrity |
| `User` | `_email`, `_password`, `_notifications` | Secure user data |
| `Shipment` | `_trackingHistory`, `_paymentHistory` | Immutable audit trail |

---

#### 🎭 ABSTRACTION

**Definition:** Hiding complex implementation details and exposing only essential features through interfaces and abstract classes.

**Implementation in our project:**

```typescript
// Interface - Defines WHAT without HOW (ITrackable.ts)
export interface ITrackable {
  getTrackingId(): string;
  getStatus(): string;
  getCurrentLocation(): { lat: number; lng: number };
  getTrackingHistory(): TrackingEvent[];
}

// Abstract class - Partial implementation (Vehicle.ts)
export abstract class Vehicle extends BaseEntity implements ITrackable {
  // Abstract method - MUST be implemented by subclasses
  public abstract move(from: Location, to: Location): Route;

  // Abstract method - Each vehicle calculates fuel differently
  protected abstract calculateFuelConsumption(distance: number): number;

  // Abstract method - Each vehicle has different max speed
  public abstract getMaxSpeed(): number;
}
```

**Interfaces implemented:**

| Interface         | Implemented By          | Purpose                     |
| ----------------- | ----------------------- | --------------------------- |
| `ITrackable`      | Vehicle, Shipment       | Real-time location tracking |
| `IPayable`        | Shipment                | Payment processing          |
| `INotifiable`     | User                    | Notification delivery       |
| `PricingStrategy` | Air/Ground/Sea Strategy | Cost calculation            |

---

#### 🧬 INHERITANCE

**Definition:** Creating new classes based on existing ones, inheriting properties and methods.

**Implementation in our project:**

```typescript
// Base class hierarchy
BaseEntity (abstract)
    ├── Vehicle (abstract)
    │   ├── Drone      → Aerial delivery, geodesic movement
    │   ├── Truck      → Ground delivery, Manhattan distance
    │   └── Ship       → Maritime delivery, sea routes
    ├── User (abstract)
    │   ├── Customer   → Places orders, tracks shipments
    │   ├── Driver     → Manages vehicle, completes deliveries
    │   └── Admin      → System management, reports
    └── Shipment       → Package management

// Example: Drone extends Vehicle
export class Drone extends Vehicle {
    private _altitude: number = 0;
    private _maxAltitude: number;
    private _batteryHealth: number = 100;

    constructor(id: string, licenseId: string, maxAltitude: number = 120) {
        // Call parent constructor - INHERITANCE
        super(id, licenseId, VehicleType.DRONE, 50, 100);
        this._maxAltitude = maxAltitude;
    }

    // Override abstract method with drone-specific implementation
    public move(from: Location, to: Location): Route {
        console.log('Drone calculating geodesic flight path...');
        // Drones fly in straight lines (geodesic)
        const distance = this.calculateGeodesicDistance(from, to);
        return this.createRoute(from, to, distance);
    }
}
```

**Inheritance hierarchy:**

```
                    ┌─────────────┐
                    │ BaseEntity  │ (abstract)
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Vehicle  │    │   User   │    │ Shipment │
    │(abstract)│    │(abstract)│    └──────────┘
    └────┬─────┘    └────┬─────┘
    ┌────┼────┐     ┌────┼────┐
    ▼    ▼    ▼     ▼    ▼    ▼
  Drone Truck Ship  Cust Drv Admin
```

---

#### 🔄 POLYMORPHISM

**Definition:** Objects of different types responding differently to the same method call.

**Implementation in our project:**

```typescript
// Same method, different behavior - POLYMORPHISM
const vehicles: Vehicle[] = [
  new Drone("d1", "DRN-001", 120),
  new Truck("t1", "TRK-001", 4),
  new Ship("s1", "SHP-001", 1000),
];

// Each vehicle moves differently!
vehicles.forEach((vehicle) => {
  const route = vehicle.move(origin, destination);
  console.log(`${vehicle.type}: ${route.distance}km`);
});

// Output:
// Drone calculating geodesic flight path...    → Straight line
// Truck calculating road network path...       → Manhattan distance (1.4x)
// Ship calculating maritime route...           → Sea route (1.3x longer)
```

**Polymorphic methods in our project:**

| Method                       | Drone               | Truck                  | Ship           |
| ---------------------------- | ------------------- | ---------------------- | -------------- |
| `move()`                     | Geodesic (straight) | Manhattan (roads)      | Maritime (sea) |
| `calculateFuelConsumption()` | Battery drain       | Diesel usage           | Fuel oil       |
| `getMaxSpeed()`              | 120 km/h            | 90 km/h (70 w/trailer) | 45 km/h        |

---

### 2.3 Design Patterns Implemented

#### 1️⃣ Strategy Pattern (PricingStrategy)

```typescript
// Interface defines the strategy contract
interface PricingStrategy {
  calculate(weight: number, distance: number): number;
}

// Concrete strategies with different algorithms
class AirPricingStrategy extends BasePricingStrategy {
  // Higher rates for faster delivery
  constructor() {
    super("Air Priority", 0.5, 0.15); // $0.50/kg, $0.15/km
  }
}

class GroundPricingStrategy extends BasePricingStrategy {
  constructor() {
    super("Ground Standard", 0.25, 0.08); // $0.25/kg, $0.08/km
  }
}

class SeaPricingStrategy extends BasePricingStrategy {
  constructor() {
    super("Sea Freight", 0.1, 0.03); // $0.10/kg, $0.03/km
  }
}

// Usage - Strategy is interchangeable at runtime
shipment.setPricingStrategy(new AirPricingStrategy());
const airCost = shipment.calculateCost();

shipment.setPricingStrategy(new SeaPricingStrategy());
const seaCost = shipment.calculateCost(); // Different result!
```

#### 2️⃣ Factory Pattern (ShipmentFactory)

```typescript
// Factory creates objects without exposing creation logic
class ShipmentFactory {
    public static createShipment(options: ShipmentOptions): ShipmentCreationResult {
        // 1. Analyze route for geographic constraints
        const availability = RouteAnalyzer.getAvailableTransportModes(
            options.origin,
            options.destination,
            options.weight
        );

        // 2. Determine optimal vehicle based on weight, urgency, geography
        const { vehicle, strategy, estimatedDays } = this.determineOptimalDelivery(
            options.origin,
            options.destination,
            options.weight,
            options.urgency
        );

        // 3. Create and configure shipment
        const shipment = new Shipment(...);
        shipment.setPricingStrategy(strategy);

        return { shipment, recommendedVehicle, pricingStrategy, estimatedCost, estimatedDeliveryDays };
    }
}
```

#### 3️⃣ Abstract Factory Pattern (Vehicle Factories)

```typescript
// Abstract factory interface
interface IVehicleFactory {
  createVehicle(): Vehicle;
  getVehicleType(): VehicleType;
}

// Concrete factories for each vehicle type
class DroneFactory extends AbstractVehicleFactory {
  createVehicle(): Drone {
    return new Drone(this.generateId(), this.generateLicenseId("DRN"), 120);
  }
}

class TruckFactory extends AbstractVehicleFactory {
  createVehicle(): Truck {
    return new Truck(this.generateId(), this.generateLicenseId("TRK"), 4);
  }
}

class ShipFactory extends AbstractVehicleFactory {
  createVehicle(): Ship {
    return new Ship(this.generateId(), this.generateLicenseId("SHP"), 5000);
  }
}
```

#### 4️⃣ Builder Pattern (ShipmentBuilder)

```typescript
// Fluent interface for complex object construction
const shipment = ShipmentBuilder.create()
  .withTrackingId("TRK-BUILD-001")
  .withWeight(25)
  .withOrigin(newYorkLocation)
  .withDestination(losAngelesLocation)
  .withCustomer(customer)
  .withUrgency("high")
  .withInsurance(500)
  .build();
```

#### 5️⃣ Template Method Pattern (BasePricingStrategy)

```typescript
abstract class BasePricingStrategy {
  // Template method - defines the algorithm skeleton
  public calculate(weight: number, distance: number): number {
    const basePrice = weight * this._weightRate + distance * this._distanceRate;
    const surchargeAmount = this.calculateSurcharges(weight, distance); // Hook
    const discountAmount = this.calculateDiscount(basePrice); // Hook
    return Math.max(0, basePrice + surchargeAmount - discountAmount);
  }

  // Abstract hook - subclasses MUST implement
  protected abstract calculateSurcharges(
    weight: number,
    distance: number
  ): number;

  // Optional hook - subclasses CAN override
  protected calculateDiscount(basePrice: number): number {
    return 0; // Default: no discount
  }
}
```

---

## 3. Functionality and Execution

### 3.1 Test Results Summary

```
 ✓ src/core/__tests__/PricingStrategy.test.ts    (32 tests) ✓
 ✓ src/core/__tests__/Container.test.ts          (27 tests) ✓
 ✓ src/core/__tests__/RouteAnalyzer.test.ts      (37 tests) ✓
 ✓ src/core/__tests__/Vehicle.test.ts            (43 tests) ✓
 ✓ src/core/__tests__/ShipmentFactory.test.ts    (29 tests) ✓
 ✓ src/core/__tests__/User.test.ts               (33 tests) ✓
 ✓ src/core/__tests__/Shipment.test.ts           (53 tests) ✓

 Test Files:  7 passed (7)
 Tests:       254 passed (254)
 Duration:    2.83s
```

### 3.2 Features Implemented

| Feature             | Status      | Description                                      |
| ------------------- | ----------- | ------------------------------------------------ |
| Vehicle Management  | ✅ Complete | Drone, Truck, Ship with unique movement patterns |
| User Management     | ✅ Complete | Customer, Driver, Admin with role-based access   |
| Shipment Tracking   | ✅ Complete | Real-time status updates and location tracking   |
| Dynamic Pricing     | ✅ Complete | Air, Ground, Sea strategies with surcharges      |
| Route Analysis      | ✅ Complete | Geographic constraints for transport selection   |
| Factory System      | ✅ Complete | Automated shipment and vehicle creation          |
| Payment Processing  | ✅ Complete | Payments, refunds, and transaction history       |
| Notification System | ✅ Complete | Email, SMS, Push notification preferences        |

### 3.3 Geographic Route Analysis

The `RouteAnalyzer` class implements realistic transport constraints:

```typescript
// Land connections between continents
const LAND_CONNECTIONS = {
  NORTH_AMERICA: ["SOUTH_AMERICA"],
  SOUTH_AMERICA: ["NORTH_AMERICA"],
  EUROPE: ["ASIA", "AFRICA"], // Eurasia land bridge
  ASIA: ["EUROPE", "AFRICA"],
  AFRICA: ["EUROPE", "ASIA"],
  OCEANIA: [], // Island - no land connections
};

// Route analysis example:
const route = RouteAnalyzer.getAvailableTransportModes(newYork, london);
// Result:
// - Truck: ❌ Not available (Atlantic Ocean crossing)
// - Ship: ✅ Available (both cities are coastal)
// - Drone: ❌ Not available (5,570km exceeds 500km range)
```

---

## 4. Code Quality and Style

### 4.1 Naming Conventions

| Type           | Convention          | Example                                   |
| -------------- | ------------------- | ----------------------------------------- |
| Classes        | PascalCase          | `ShipmentFactory`, `RouteAnalyzer`        |
| Interfaces     | I-prefix PascalCase | `ITrackable`, `IPayable`                  |
| Methods        | camelCase           | `calculateCost()`, `getTrackingHistory()` |
| Private fields | \_ prefix           | `_currentFuel`, `_status`                 |
| Constants      | UPPER_SNAKE         | `LAND_CONNECTIONS`, `VehicleType`         |
| Enums          | PascalCase          | `VehicleStatus`, `ShipmentType`           |

### 4.2 Documentation Standards

Every class includes comprehensive JSDoc comments:

````typescript
/**
 * Abstract Vehicle Class
 * ======================
 * @abstract
 * @class Vehicle
 * @extends BaseEntity
 * @implements ITrackable
 * @description Base class for all vehicle types in the logistics fleet.
 *
 * **OOP Pillars Demonstrated:**
 * - **ABSTRACTION**: Abstract class with abstract methods
 * - **INHERITANCE**: Drone, Truck, Ship extend this class
 * - **ENCAPSULATION**: Private fields with controlled access
 * - **POLYMORPHISM**: Each vehicle type implements movement differently
 *
 * @example
 * ```typescript
 * const vehicles: Vehicle[] = [
 *   new Drone('d1', 'DRN-001', 120),
 *   new Truck('t1', 'TRK-001', 4)
 * ];
 * vehicles.forEach(v => v.move(origin, destination));
 * ```
 */
````

### 4.3 Code Organization

Each file follows a consistent structure:

1. **File Header** - Purpose and OOP pillars demonstrated
2. **Imports** - Organized by type (types, interfaces, classes)
3. **Types/Enums** - Local type definitions
4. **Class Definition** - With comprehensive documentation
5. **Private Fields** - Encapsulated data
6. **Constructor** - Initialization logic
7. **Getters/Setters** - Controlled access
8. **Public Methods** - External API
9. **Protected Methods** - Subclass utilities
10. **Private Methods** - Internal implementation

---

## 5. Creativity and Originality

### 5.1 Innovative Features

#### 🌍 Geographic Route Analyzer

A unique feature that analyzes real-world geographic constraints:

- **Continent-based land connections** (Eurasia, Americas, etc.)
- **Water crossing detection** for oceanic routes
- **Distance-based transport eligibility** (drones limited to 500km)
- **Coastal city detection** for ship routes

```typescript
// Automatic transport mode selection based on geography
const availability = RouteAnalyzer.analyzeRoute(sydney, london);
// Sydney → London:
// ✅ Ship: Coastal cities, water crossing required
// ❌ Truck: Cannot cross Pacific/Indian Ocean
// ❌ Drone: 16,900km exceeds battery range
```

#### 🚗 Vehicle Movement Patterns

Each vehicle type has a unique movement algorithm:

| Vehicle   | Movement Type            | Distance Calculation          |
| --------- | ------------------------ | ----------------------------- | ---- | --- | ---- | -------------- |
| **Drone** | Geodesic (straight line) | `√(Δlat² + Δlng²) × 111`      |
| **Truck** | Manhattan (road network) | `(                            | Δlat | +   | Δlng | ) × 111 × 1.4` |
| **Ship**  | Maritime (sea route)     | `geodesic × 1.3` (30% longer) |

#### 💰 Dynamic Pricing with Surcharges

The pricing system includes realistic surcharges:

```typescript
// Air Pricing Strategy
- Base: $0.50/kg + $0.15/km
- Fuel surcharge: +10% (weight > 30kg)
- Remote area: +15% (distance > 1000km)
- Weather adjustment: +5% (during storms)

// Ground Pricing Strategy
- Base: $0.25/kg + $0.08/km
- Bulk discount: -5% (weight > 500kg)
- Highway toll estimation: +$0.02/km
```

#### 🎨 Space-Themed UI

A futuristic, space-themed interface with:

- Animated star background
- Glass-morphism card design
- Real-time route visualization
- Dynamic transport availability indicators

### 5.2 Beyond Basic Requirements

| Requirement    | Our Implementation                                                            |
| -------------- | ----------------------------------------------------------------------------- |
| Basic OOP      | ✅ All 4 pillars with multiple examples                                       |
| Simple classes | ✅ Complex hierarchy with abstract classes                                    |
| Basic testing  | ✅ 254 comprehensive unit tests                                               |
| Documentation  | ✅ Full JSDoc + this comprehensive guide                                      |
| Single pattern | ✅ 5 design patterns (Strategy, Factory, Abstract Factory, Builder, Template) |

---

## 6. UML Class Diagrams

### 6.1 Core Class Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                         <<abstract>>                                 │
│                         BaseEntity                                   │
├─────────────────────────────────────────────────────────────────────┤
│ - _id: string                                                        │
│ - _createdAt: Date                                                   │
│ - _updatedAt: Date                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ + get id(): string                                                   │
│ + get createdAt(): Date                                              │
│ # touch(): void                                                      │
│ + {abstract} validate(): boolean                                     │
│ + {abstract} toJSON(): object                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  <<abstract>> │          │  <<abstract>> │          │   Shipment    │
│    Vehicle    │          │     User      │          │               │
├───────────────┤          ├───────────────┤          ├───────────────┤
│ - _licenseId  │          │ - _name       │          │ - _trackingId │
│ - _type       │          │ - _email      │          │ - _weight     │
│ - _capacity   │          │ - _password   │          │ - _origin     │
│ - _currentFuel│          │ # role        │          │ - _destination│
│ - _status     │          ├───────────────┤          │ - _status     │
├───────────────┤          │ + notify()    │          ├───────────────┤
│ + move()      │          │ + viewDash()  │          │ + track()     │
│ + refuel()    │          └───────────────┘          │ + pay()       │
│ + getMaxSpeed │                      △              └───────────────┘
└───────────────┘                      │
        △                   ┌─────────┼─────────┐
        │                    ▼         ▼         ▼
┌───────┼───────┐    ┌──────────┐┌──────────┐┌──────────┐
▼       ▼       ▼    │ Customer ││  Driver  ││  Admin   │
┌─────┐┌─────┐┌─────┐└──────────┘└──────────┘└──────────┘
│Drone││Truck││Ship │
└─────┘└─────┘└─────┘
```

### 6.2 Interface Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                        <<interface>>                                 │
│                         ITrackable                                   │
├─────────────────────────────────────────────────────────────────────┤
│ + getTrackingId(): string                                            │
│ + getStatus(): string                                                │
│ + getCurrentLocation(): Location                                     │
│ + getTrackingHistory(): TrackingEvent[]                              │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ implements
                    ┌───────────────┴───────────────┐
                    │                               │
              ┌───────────┐                   ┌───────────┐
              │  Vehicle  │                   │ Shipment  │
              └───────────┘                   └───────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        <<interface>>                                 │
│                         IPayable                                     │
├─────────────────────────────────────────────────────────────────────┤
│ + processPayment(amount): Promise<PaymentResult>                     │
│ + refund(txnId, amount): Promise<PaymentResult>                      │
│ + getPaymentHistory(): PaymentRecord[]                               │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ implements
                              ┌───────────┐
                              │ Shipment  │
                              └───────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        <<interface>>                                 │
│                        INotifiable                                   │
├─────────────────────────────────────────────────────────────────────┤
│ + notify(message, type): void                                        │
│ + getNotificationPreferences(): NotificationPreferences              │
│ + setNotificationPreferences(prefs): void                            │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ implements
                              ┌───────────┐
                              │   User    │
                              └───────────┘
```

### 6.3 Strategy Pattern Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        <<interface>>                                 │
│                       PricingStrategy                                │
├─────────────────────────────────────────────────────────────────────┤
│ + calculate(weight, distance): number                                │
│ + getStrategyName(): string                                          │
│ + getRates(): RateInfo                                               │
│ + isEligible(weight, distance): boolean                              │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ implements
                       ┌────────────┼────────────┐
                       │            │            │
                       ▼            ▼            ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │ AirPricing   │ │ GroundPricing│ │ SeaPricing   │
              │ Strategy     │ │ Strategy     │ │ Strategy     │
              ├──────────────┤ ├──────────────┤ ├──────────────┤
              │ weightRate:  │ │ weightRate:  │ │ weightRate:  │
              │   $0.50/kg   │ │   $0.25/kg   │ │   $0.10/kg   │
              │ distRate:    │ │ distRate:    │ │ distRate:    │
              │   $0.15/km   │ │   $0.08/km   │ │   $0.03/km   │
              └──────────────┘ └──────────────┘ └──────────────┘

                              ┌──────────────┐
                              │   Shipment   │
                              ├──────────────┤
                              │ - strategy:  │────────────────┐
                              │   Pricing    │                │
                              │   Strategy   │                │
                              ├──────────────┤                │
                              │ + calculate  │◇───────────────┘
                              │   Cost()     │  uses strategy
                              └──────────────┘
```

### 6.4 Factory Pattern Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        <<interface>>                                 │
│                       IVehicleFactory                                │
├─────────────────────────────────────────────────────────────────────┤
│ + createVehicle(): Vehicle                                           │
│ + getVehicleType(): VehicleType                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    △
                                    │ implements
                       ┌────────────┼────────────┐
                       │            │            │
                       ▼            ▼            ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │ DroneFactory │ │ TruckFactory │ │ ShipFactory  │
              ├──────────────┤ ├──────────────┤ ├──────────────┤
              │ + create     │ │ + create     │ │ + create     │
              │   Vehicle()  │ │   Vehicle()  │ │   Vehicle()  │
              │   → Drone    │ │   → Truck    │ │   → Ship     │
              └──────────────┘ └──────────────┘ └──────────────┘
                      │                │                │
                      ▼                ▼                ▼
              ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
              │    Drone     │ │    Truck     │ │    Ship      │
              └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       ShipmentFactory                                │
├─────────────────────────────────────────────────────────────────────┤
│ - droneFactory: DroneFactory                                         │
│ - truckFactory: TruckFactory                                         │
│ - shipFactory: ShipFactory                                           │
├─────────────────────────────────────────────────────────────────────┤
│ + createShipment(options): ShipmentCreationResult                    │
│ + createSimple(origin, dest, weight): ShipmentCreationResult         │
│ + createBulkShipments(customer, shipments[]): ShipmentResult[]       │
│ - determineOptimalDelivery(): DeliveryConfig                         │
│ - createVehicle(type): Vehicle                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Screenshots

### 7.1 Application Interface

Since this is a code-based project, screenshots would be captured from running the application.

**Main Dashboard Features:**

- 🏠 **Home Page**: Futuristic space-themed landing
- 📦 **Create Shipment**: Form with route analysis
- 🗺️ **Fleet Map**: Real-time vehicle tracking
- 📊 **Admin Dashboard**: Analytics and management

### 7.2 Test Execution

```
PS C:\Users\Gio\Desktop\project> npx vitest run

 ✓ src/core/__tests__/PricingStrategy.test.ts    (32 tests)  28ms
 ✓ src/core/__tests__/Container.test.ts          (27 tests)  36ms
 ✓ src/core/__tests__/RouteAnalyzer.test.ts      (37 tests)  48ms
 ✓ src/core/__tests__/Vehicle.test.ts            (43 tests)  72ms
 ✓ src/core/__tests__/ShipmentFactory.test.ts    (29 tests)  52ms
 ✓ src/core/__tests__/User.test.ts               (33 tests)  51ms
 ✓ src/core/__tests__/Shipment.test.ts           (53 tests) 107ms

 Test Files  7 passed (7)
      Tests  254 passed (254)
   Duration  2.83s
```

---

## 8. User Manual

### 8.1 Getting Started

#### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

#### Installation

```bash
# Clone the repository
git clone https://github.com/GiYo-Mi02/LogisticsSystem.git
cd LogisticsSystem

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

### 8.2 Creating a Shipment

#### Using the Factory (Recommended)

```typescript
import { ShipmentFactory } from "@/core/ShipmentFactory";
import { Customer } from "@/core/User";
import { PRESET_LOCATIONS } from "@/core/types";

// 1. Create a customer
const customer = new Customer("c-001", "John Doe", "john@email.com");

// 2. Create a shipment using the factory
const result = ShipmentFactory.createShipment({
  trackingId: "TRK-001",
  weight: 25,
  origin: PRESET_LOCATIONS.NEW_YORK,
  destination: PRESET_LOCATIONS.LOS_ANGELES,
  customer: customer,
  urgency: "standard",
  shipmentType: ShipmentType.STANDARD,
});

// 3. Access the created shipment
console.log(result.shipment.trackingId); // "TRK-001"
console.log(result.recommendedVehicle.type); // "TRUCK"
console.log(result.estimatedCost); // $178.08
console.log(result.estimatedDeliveryDays); // 5 days
```

#### Using the Builder Pattern

```typescript
import { ShipmentBuilder } from "@/core/ShipmentFactory";

const shipment = ShipmentBuilder.create()
  .withTrackingId("TRK-BUILD-001")
  .withWeight(10)
  .withOrigin(PRESET_LOCATIONS.LONDON)
  .withDestination(PRESET_LOCATIONS.PARIS)
  .withCustomer(customer)
  .withUrgency("high")
  .withInsurance(200)
  .build();
```

### 8.3 Tracking a Shipment

```typescript
// Get tracking information
const trackingId = shipment.getTrackingId();
const status = shipment.getStatus();
const location = shipment.getCurrentLocation();
const history = shipment.getTrackingHistory();

// Status transitions
shipment.assignVehicle(drone); // PENDING → ASSIGNED
shipment.startDelivery(); // ASSIGNED → IN_TRANSIT
shipment.complete("Customer Signature"); // IN_TRANSIT → DELIVERED
```

### 8.4 Route Analysis

```typescript
import { RouteAnalyzer } from "@/core/RouteAnalyzer";
import { PRESET_LOCATIONS } from "@/core/types";

// Analyze a route
const analysis = RouteAnalyzer.getAvailableTransportModes(
  PRESET_LOCATIONS.NEW_YORK,
  PRESET_LOCATIONS.LONDON,
  25 // weight in kg
);

console.log(analysis.truckAvailable); // false (Atlantic Ocean)
console.log(analysis.truckReason); // "Route crosses ocean..."
console.log(analysis.shipAvailable); // true
console.log(analysis.droneAvailable); // false (5,570km > 500km limit)
console.log(analysis.recommendedVehicle); // VehicleType.SHIP
console.log(analysis.crossesWater); // true
console.log(analysis.distanceKm); // 5570
```

---

## 9. Test Coverage Report

### 9.1 Test Suite Summary

| Test File               | Tests   | Coverage                               |
| ----------------------- | ------- | -------------------------------------- |
| Vehicle.test.ts         | 43      | Drone, Truck, Ship, Polymorphism       |
| User.test.ts            | 33      | Customer, Driver, Admin, Notifications |
| Shipment.test.ts        | 53      | Tracking, Payments, Status, Insurance  |
| PricingStrategy.test.ts | 32      | Air, Ground, Sea, Surcharges           |
| ShipmentFactory.test.ts | 29      | Factory, Builder, Bulk Creation        |
| RouteAnalyzer.test.ts   | 37      | Geographic, Distance, Availability     |
| Container.test.ts       | 27      | DI Container, Service Registration     |
| **TOTAL**               | **254** | **All Passing ✅**                     |

### 9.2 Test Categories

#### Vehicle Tests (43)

- ✅ Drone: takeoff, landing, geodesic movement, altitude, battery
- ✅ Truck: trailer attachment, Manhattan distance, mileage tracking
- ✅ Ship: container loading, maritime routes, draft depth
- ✅ Common: refueling, status transitions, tracking
- ✅ Polymorphism: different movement for each type

#### User Tests (33)

- ✅ Customer: order history, preferences, notifications
- ✅ Driver: vehicle assignment, job tracking, location updates
- ✅ Admin: report generation, user management, permissions
- ✅ Common: authentication, profile updates, notification preferences

#### Shipment Tests (53)

- ✅ ITrackable: tracking ID, status, location, history
- ✅ IPayable: payments, refunds, transaction history
- ✅ Strategy: Air/Ground/Sea pricing, type multipliers, insurance
- ✅ Business Logic: vehicle assignment, status transitions, delivery

#### RouteAnalyzer Tests (37)

- ✅ Domestic routes: same continent, no water crossing
- ✅ International routes: water crossing detection
- ✅ Land connections: Eurasia, Americas, Africa
- ✅ Transport availability: truck, ship, drone constraints
- ✅ Real-world scenarios: NY→London, Sydney→LA, etc.

---

## 📎 Appendix

### A. File Structure

```
LogisticsSystem/
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                      # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── shipments/      # Shipment CRUD
│   │   │   └── vehicles/       # Vehicle management
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── customer/       # Customer dashboard
│   │   │   └── driver/         # Driver dashboard
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── CreateShipmentForm.tsx
│   │   ├── FleetMap.tsx
│   │   ├── ShipmentCard.tsx
│   │   └── Stars.tsx
│   ├── core/                   # Domain logic (OOP)
│   │   ├── base/               # Abstract base classes
│   │   ├── interfaces/         # TypeScript interfaces
│   │   ├── __tests__/          # Unit tests
│   │   ├── PricingStrategy.ts
│   │   ├── RouteAnalyzer.ts
│   │   ├── Shipment.ts
│   │   ├── ShipmentFactory.ts
│   │   ├── types.ts
│   │   ├── User.ts
│   │   └── Vehicle.ts
│   ├── lib/                    # Utilities
│   │   └── prisma.ts
│   └── services/               # Business services
│       ├── ShipmentService.ts
│       ├── UserService.ts
│       └── VehicleService.ts
├── DOCUMENTATION.md            # This file
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### B. Commands Reference

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:ui      # Visual test runner

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync schema to database
npx prisma studio    # Open database GUI
```

### C. Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📝 Conclusion

LogIQ demonstrates comprehensive Object-Oriented Programming principles through a realistic logistics management system. The project showcases:

1. **Program Design**: Clean architecture with clear class hierarchies and relationships
2. **Functionality**: 254 passing tests covering all features
3. **Code Quality**: Consistent naming, comprehensive documentation, TypeScript type safety
4. **Creativity**: Geographic route analysis, multiple design patterns, space-themed UI
5. **Documentation**: UML diagrams, user manual, complete API reference

The system is production-ready and extensible for future enhancements.

---

_Document generated for LogIQ v1.0.0_  
_Last updated: December 2, 2025_
