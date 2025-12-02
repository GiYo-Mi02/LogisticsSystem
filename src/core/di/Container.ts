/**
 * Dependency Injection Container
 * ================================
 * Implements the Dependency Injection (DI) and Inversion of Control (IoC) patterns
 * for managing service instances throughout the application.
 * 
 * Design Patterns Used:
 * - **Singleton Pattern**: Container itself is a singleton
 * - **Service Locator Pattern**: Resolves dependencies by name/token
 * - **Factory Pattern**: Creates instances with proper dependency injection
 * - **Dependency Injection**: Injects dependencies into constructors
 * 
 * Benefits:
 * - Loose coupling between components
 * - Easy unit testing with mock dependencies
 * - Centralized service management
 * - Lifecycle control (singleton vs transient)
 * 
 * @example
 * ```typescript
 * // Register services
 * container.register('UserService', () => new UserService());
 * container.register('ShipmentService', () => new ShipmentService());
 * 
 * // Resolve services
 * const userService = container.resolve<UserService>('UserService');
 * ```
 * 
 * @module core/di/Container
 */

/**
 * Lifecycle options for registered services.
 */
export enum ServiceLifecycle {
  /**
   * Single instance shared across all resolutions.
   * Created on first resolution and cached.
   */
  SINGLETON = 'singleton',
  
  /**
   * New instance created for each resolution.
   */
  TRANSIENT = 'transient',
}

/**
 * Factory function type for creating service instances.
 * @template T - The type of service being created
 */
export type ServiceFactory<T> = () => T;

/**
 * Registration entry containing factory and metadata.
 */
interface ServiceRegistration<T = unknown> {
  /** Factory function to create the service */
  factory: ServiceFactory<T>;
  /** Lifecycle management option */
  lifecycle: ServiceLifecycle;
  /** Cached instance for singletons */
  instance?: T;
}

/**
 * Service descriptor for runtime type information.
 */
export interface ServiceDescriptor {
  /** Unique identifier for the service */
  name: string;
  /** Lifecycle management option */
  lifecycle: ServiceLifecycle;
  /** Whether the service has been instantiated */
  instantiated: boolean;
}

/**
 * Dependency Injection Container implementing IoC pattern.
 * 
 * Provides centralized management of service instances with support for:
 * - Singleton and transient lifecycles
 * - Lazy instantiation
 * - Service replacement for testing
 * - Circular dependency detection
 * 
 * @example
 * ```typescript
 * const container = Container.getInstance();
 * 
 * // Register with lifecycle
 * container.register('DbConnection', () => new DatabaseConnection(), ServiceLifecycle.SINGLETON);
 * container.register('Logger', () => new Logger(), ServiceLifecycle.TRANSIENT);
 * 
 * // Resolve services
 * const db = container.resolve<DatabaseConnection>('DbConnection');
 * ```
 */
export class Container {
  /**
   * Singleton instance of the container.
   * @private
   */
  private static instance: Container | null = null;

  /**
   * Map of registered services.
   * @private
   */
  private services: Map<string, ServiceRegistration> = new Map();

  /**
   * Set to track services currently being resolved (for circular dependency detection).
   * @private
   */
  private resolving: Set<string> = new Set();

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Gets the singleton instance of the container.
   * 
   * @returns {Container} The global container instance
   * 
   * @example
   * ```typescript
   * const container = Container.getInstance();
   * ```
   */
  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Resets the container instance (primarily for testing).
   * Clears all registrations and the singleton instance.
   * 
   * @example
   * ```typescript
   * // In test teardown
   * Container.reset();
   * ```
   */
  public static reset(): void {
    if (Container.instance) {
      Container.instance.services.clear();
      Container.instance.resolving.clear();
    }
    Container.instance = null;
  }

  /**
   * Registers a service with the container.
   * 
   * @template T - The type of service being registered
   * @param {string} name - Unique identifier for the service
   * @param {ServiceFactory<T>} factory - Factory function to create the service
   * @param {ServiceLifecycle} lifecycle - Lifecycle management option (default: SINGLETON)
   * @returns {Container} The container instance for method chaining
   * @throws {Error} If a service with the same name is already registered
   * 
   * @example
   * ```typescript
   * container.register('UserService', () => new UserService(), ServiceLifecycle.SINGLETON);
   * ```
   */
  public register<T>(
    name: string,
    factory: ServiceFactory<T>,
    lifecycle: ServiceLifecycle = ServiceLifecycle.SINGLETON
  ): Container {
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered. Use replace() to override.`);
    }

    this.services.set(name, {
      factory,
      lifecycle,
    });

    return this;
  }

  /**
   * Replaces an existing service registration.
   * Useful for testing with mock implementations.
   * 
   * @template T - The type of service being registered
   * @param {string} name - Unique identifier for the service
   * @param {ServiceFactory<T>} factory - New factory function
   * @param {ServiceLifecycle} lifecycle - Lifecycle management option
   * @returns {Container} The container instance for method chaining
   * 
   * @example
   * ```typescript
   * // In tests
   * container.replace('UserService', () => new MockUserService());
   * ```
   */
  public replace<T>(
    name: string,
    factory: ServiceFactory<T>,
    lifecycle: ServiceLifecycle = ServiceLifecycle.SINGLETON
  ): Container {
    this.services.set(name, {
      factory,
      lifecycle,
    });

    return this;
  }

  /**
   * Resolves a service by name.
   * 
   * @template T - The expected type of the service
   * @param {string} name - Unique identifier for the service
   * @returns {T} The resolved service instance
   * @throws {Error} If the service is not registered
   * @throws {Error} If a circular dependency is detected
   * 
   * @example
   * ```typescript
   * const userService = container.resolve<UserService>('UserService');
   * ```
   */
  public resolve<T>(name: string): T {
    const registration = this.services.get(name);

    if (!registration) {
      throw new Error(`Service '${name}' is not registered. Available services: ${this.getServiceNames().join(', ')}`);
    }

    // Circular dependency detection
    if (this.resolving.has(name)) {
      throw new Error(`Circular dependency detected while resolving '${name}'`);
    }

    // For singletons, return cached instance if available
    if (registration.lifecycle === ServiceLifecycle.SINGLETON && registration.instance) {
      return registration.instance as T;
    }

    // Track that we're resolving this service
    this.resolving.add(name);

    try {
      // Create new instance
      const instance = registration.factory() as T;

      // Cache singleton instances
      if (registration.lifecycle === ServiceLifecycle.SINGLETON) {
        registration.instance = instance;
      }

      return instance;
    } finally {
      // Remove from resolving set
      this.resolving.delete(name);
    }
  }

  /**
   * Attempts to resolve a service, returning undefined if not registered.
   * 
   * @template T - The expected type of the service
   * @param {string} name - Unique identifier for the service
   * @returns {T | undefined} The resolved service instance or undefined
   * 
   * @example
   * ```typescript
   * const cache = container.tryResolve<CacheService>('CacheService');
   * if (cache) {
   *   cache.set('key', 'value');
   * }
   * ```
   */
  public tryResolve<T>(name: string): T | undefined {
    try {
      return this.resolve<T>(name);
    } catch {
      return undefined;
    }
  }

  /**
   * Checks if a service is registered.
   * 
   * @param {string} name - Unique identifier for the service
   * @returns {boolean} True if the service is registered
   * 
   * @example
   * ```typescript
   * if (container.has('CacheService')) {
   *   // Use cache
   * }
   * ```
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregisters a service from the container.
   * 
   * @param {string} name - Unique identifier for the service
   * @returns {boolean} True if the service was unregistered
   * 
   * @example
   * ```typescript
   * container.unregister('OldService');
   * ```
   */
  public unregister(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Gets all registered service names.
   * 
   * @returns {string[]} Array of registered service names
   * 
   * @example
   * ```typescript
   * console.log('Registered services:', container.getServiceNames());
   * ```
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Gets descriptors for all registered services.
   * 
   * @returns {ServiceDescriptor[]} Array of service descriptors
   * 
   * @example
   * ```typescript
   * container.getServiceDescriptors().forEach(desc => {
   *   console.log(`${desc.name}: ${desc.lifecycle} (instantiated: ${desc.instantiated})`);
   * });
   * ```
   */
  public getServiceDescriptors(): ServiceDescriptor[] {
    return Array.from(this.services.entries()).map(([name, reg]) => ({
      name,
      lifecycle: reg.lifecycle,
      instantiated: reg.instance !== undefined,
    }));
  }

  /**
   * Clears all singleton instances without removing registrations.
   * Forces re-instantiation on next resolve.
   * 
   * @example
   * ```typescript
   * // Reset all singleton states
   * container.clearInstances();
   * ```
   */
  public clearInstances(): void {
    Array.from(this.services.values()).forEach((registration) => {
      registration.instance = undefined;
    });
  }

  /**
   * Creates a child container that inherits from this container.
   * Child containers can override parent registrations without affecting the parent.
   * 
   * @returns {Container} A new child container
   * 
   * @example
   * ```typescript
   * const childContainer = container.createChild();
   * childContainer.replace('Logger', () => new TestLogger());
   * ```
   */
  public createChild(): Container {
    const child = new Container();
    
    // Copy all registrations from parent
    Array.from(this.services.entries()).forEach(([name, registration]) => {
      child.services.set(name, { ...registration, instance: undefined });
    });
    
    return child;
  }
}

/**
 * Service tokens for type-safe service resolution.
 * Use these constants instead of string literals.
 * 
 * @example
 * ```typescript
 * const userService = container.resolve<UserService>(ServiceTokens.USER_SERVICE);
 * ```
 */
export const ServiceTokens = {
  /** Token for UserService */
  USER_SERVICE: 'UserService',
  /** Token for VehicleService */
  VEHICLE_SERVICE: 'VehicleService',
  /** Token for ShipmentService */
  SHIPMENT_SERVICE: 'ShipmentService',
  /** Token for PrismaClient */
  PRISMA_CLIENT: 'PrismaClient',
} as const;

/**
 * Type for valid service tokens.
 */
export type ServiceToken = typeof ServiceTokens[keyof typeof ServiceTokens];

/**
 * Global container instance for convenience.
 * Prefer using Container.getInstance() in production code.
 */
export const container = Container.getInstance();
