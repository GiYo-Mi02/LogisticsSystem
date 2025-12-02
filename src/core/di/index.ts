/**
 * Dependency Injection Module
 * ============================
 * Central export point for all DI-related functionality.
 * 
 * @module core/di
 */

export { 
  Container, 
  ServiceLifecycle, 
  ServiceTokens,
  container,
  type ServiceFactory,
  type ServiceDescriptor,
  type ServiceToken,
} from './Container';

export {
  registerServices,
  resetRegistry,
  Services,
} from './registry';
