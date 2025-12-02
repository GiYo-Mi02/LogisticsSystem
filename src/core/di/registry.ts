/**
 * Service Registry & Bootstrap
 * =============================
 * Configures the dependency injection container with all application services.
 * This is the composition root where all dependencies are wired together.
 * 
 * Design Patterns Used:
 * - **Composition Root Pattern**: Single location for dependency configuration
 * - **Registry Pattern**: Centralized service registration
 * 
 * @module core/di/registry
 */

import { Container, ServiceLifecycle, ServiceTokens, container } from './Container';
import { UserService } from '@/services/UserService';
import { VehicleService } from '@/services/VehicleService';
import { ShipmentService } from '@/services/ShipmentService';
import { prisma } from '@/lib/prisma';

/**
 * Flag to track if services have been registered.
 * Prevents duplicate registration.
 */
let isInitialized = false;

/**
 * Registers all application services with the DI container.
 * This function should be called once at application startup.
 * 
 * Services are registered as singletons to ensure consistent state
 * across the application and efficient resource usage.
 * 
 * @param {Container} containerInstance - The container to register services with
 * @returns {Container} The configured container
 * 
 * @example
 * ```typescript
 * // At application startup
 * import { registerServices } from '@/core/di/registry';
 * 
 * registerServices();
 * ```
 */
export function registerServices(containerInstance: Container = container): Container {
  if (isInitialized) {
    return containerInstance;
  }

  // Register Prisma Client as singleton
  containerInstance.register(
    ServiceTokens.PRISMA_CLIENT,
    () => prisma,
    ServiceLifecycle.SINGLETON
  );

  // Register UserService as singleton
  containerInstance.register(
    ServiceTokens.USER_SERVICE,
    () => new UserService(),
    ServiceLifecycle.SINGLETON
  );

  // Register VehicleService as singleton
  containerInstance.register(
    ServiceTokens.VEHICLE_SERVICE,
    () => new VehicleService(),
    ServiceLifecycle.SINGLETON
  );

  // Register ShipmentService as singleton
  // Note: ShipmentService internally creates UserService, but with DI
  // we could inject it instead
  containerInstance.register(
    ServiceTokens.SHIPMENT_SERVICE,
    () => new ShipmentService(),
    ServiceLifecycle.SINGLETON
  );

  isInitialized = true;

  return containerInstance;
}

/**
 * Resets the service registry.
 * Primarily used for testing to ensure clean state between tests.
 * 
 * @example
 * ```typescript
 * // In test teardown
 * resetRegistry();
 * ```
 */
export function resetRegistry(): void {
  isInitialized = false;
  Container.reset();
}

/**
 * Gets a service from the container with type safety.
 * Convenience functions for resolving common services.
 */
export const Services = {
  /**
   * Gets the UserService instance.
   * @returns {UserService} The user service singleton
   */
  user(): UserService {
    return container.resolve<UserService>(ServiceTokens.USER_SERVICE);
  },

  /**
   * Gets the VehicleService instance.
   * @returns {VehicleService} The vehicle service singleton
   */
  vehicle(): VehicleService {
    return container.resolve<VehicleService>(ServiceTokens.VEHICLE_SERVICE);
  },

  /**
   * Gets the ShipmentService instance.
   * @returns {ShipmentService} The shipment service singleton
   */
  shipment(): ShipmentService {
    return container.resolve<ShipmentService>(ServiceTokens.SHIPMENT_SERVICE);
  },
};

// Auto-register services when this module is imported
registerServices();

export { container, ServiceTokens, ServiceLifecycle } from './Container';
