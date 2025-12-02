/**
 * Unit Tests for Dependency Injection Container
 * ==============================================
 * Tests demonstrating the DI/IoC pattern implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Container, ServiceLifecycle, ServiceTokens } from '@/core/di/Container';

// Mock services for testing
class MockUserService {
  name = 'MockUserService';
  getUserById(id: string) {
    return { id, name: 'Test User' };
  }
}

class MockVehicleService {
  name = 'MockVehicleService';
  getAllVehicles() {
    return [];
  }
}

class MockDatabaseConnection {
  connected = false;
  
  connect() {
    this.connected = true;
  }
  
  disconnect() {
    this.connected = false;
  }
}

describe('Container (Dependency Injection)', () => {
  let container: Container;

  beforeEach(() => {
    // Reset and get fresh container for each test
    Container.reset();
    container = Container.getInstance();
  });

  afterEach(() => {
    Container.reset();
  });

  // ==================== Singleton Pattern Tests ====================
  describe('Singleton Pattern', () => {
    it('should return the same container instance', () => {
      const instance1 = Container.getInstance();
      const instance2 = Container.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = Container.getInstance();
      Container.reset();
      const instance2 = Container.getInstance();
      
      expect(instance1).not.toBe(instance2);
    });
  });

  // ==================== Service Registration Tests ====================
  describe('register', () => {
    it('should register a service successfully', () => {
      container.register('TestService', () => new MockUserService());
      
      expect(container.has('TestService')).toBe(true);
    });

    it('should throw error when registering duplicate service', () => {
      container.register('TestService', () => new MockUserService());
      
      expect(() => {
        container.register('TestService', () => new MockUserService());
      }).toThrow("Service 'TestService' is already registered");
    });

    it('should support method chaining', () => {
      const result = container
        .register('Service1', () => new MockUserService())
        .register('Service2', () => new MockVehicleService());

      expect(result).toBe(container);
      expect(container.has('Service1')).toBe(true);
      expect(container.has('Service2')).toBe(true);
    });

    it('should default to singleton lifecycle', () => {
      container.register('TestService', () => new MockUserService());
      
      const descriptors = container.getServiceDescriptors();
      const testService = descriptors.find(d => d.name === 'TestService');
      
      expect(testService?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
    });
  });

  // ==================== Service Resolution Tests ====================
  describe('resolve', () => {
    it('should resolve a registered service', () => {
      container.register('UserService', () => new MockUserService());
      
      const service = container.resolve<MockUserService>('UserService');
      
      expect(service).toBeInstanceOf(MockUserService);
      expect(service.name).toBe('MockUserService');
    });

    it('should throw error for unregistered service', () => {
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow("Service 'NonExistentService' is not registered");
    });

    it('should return same instance for singletons', () => {
      container.register('DbConnection', () => new MockDatabaseConnection(), ServiceLifecycle.SINGLETON);
      
      const instance1 = container.resolve<MockDatabaseConnection>('DbConnection');
      instance1.connect();
      
      const instance2 = container.resolve<MockDatabaseConnection>('DbConnection');
      
      expect(instance1).toBe(instance2);
      expect(instance2.connected).toBe(true); // State preserved
    });

    it('should return new instance for transient services', () => {
      container.register('DbConnection', () => new MockDatabaseConnection(), ServiceLifecycle.TRANSIENT);
      
      const instance1 = container.resolve<MockDatabaseConnection>('DbConnection');
      instance1.connect();
      
      const instance2 = container.resolve<MockDatabaseConnection>('DbConnection');
      
      expect(instance1).not.toBe(instance2);
      expect(instance2.connected).toBe(false); // Fresh instance
    });
  });

  // ==================== Circular Dependency Detection ====================
  describe('Circular Dependency Detection', () => {
    it('should detect circular dependencies', () => {
      // Create a service that resolves itself
      container.register('CircularService', () => {
        return container.resolve('CircularService');
      });

      expect(() => {
        container.resolve('CircularService');
      }).toThrow("Circular dependency detected while resolving 'CircularService'");
    });
  });

  // ==================== Service Replacement Tests ====================
  describe('replace', () => {
    it('should replace an existing service', () => {
      container.register('UserService', () => ({ name: 'Original' }));
      container.replace('UserService', () => ({ name: 'Replaced' }));
      
      const service = container.resolve<{ name: string }>('UserService');
      
      expect(service.name).toBe('Replaced');
    });

    it('should allow replacing non-existent service', () => {
      container.replace('NewService', () => ({ name: 'New' }));
      
      expect(container.has('NewService')).toBe(true);
    });

    it('should clear cached singleton on replace', () => {
      container.register('DbConnection', () => new MockDatabaseConnection());
      
      const original = container.resolve<MockDatabaseConnection>('DbConnection');
      original.connect();
      
      container.replace('DbConnection', () => new MockDatabaseConnection());
      
      const replaced = container.resolve<MockDatabaseConnection>('DbConnection');
      
      expect(replaced.connected).toBe(false); // Fresh instance
    });
  });

  // ==================== tryResolve Tests ====================
  describe('tryResolve', () => {
    it('should return service if registered', () => {
      container.register('UserService', () => new MockUserService());
      
      const service = container.tryResolve<MockUserService>('UserService');
      
      expect(service).toBeInstanceOf(MockUserService);
    });

    it('should return undefined if not registered', () => {
      const service = container.tryResolve('NonExistent');
      
      expect(service).toBeUndefined();
    });
  });

  // ==================== Container Utilities ====================
  describe('Utility Methods', () => {
    it('should check if service exists with has()', () => {
      container.register('TestService', () => ({}));
      
      expect(container.has('TestService')).toBe(true);
      expect(container.has('NonExistent')).toBe(false);
    });

    it('should unregister a service', () => {
      container.register('TestService', () => ({}));
      
      const result = container.unregister('TestService');
      
      expect(result).toBe(true);
      expect(container.has('TestService')).toBe(false);
    });

    it('should return false when unregistering non-existent service', () => {
      const result = container.unregister('NonExistent');
      
      expect(result).toBe(false);
    });

    it('should list all registered service names', () => {
      container.register('Service1', () => ({}));
      container.register('Service2', () => ({}));
      container.register('Service3', () => ({}));
      
      const names = container.getServiceNames();
      
      expect(names).toContain('Service1');
      expect(names).toContain('Service2');
      expect(names).toContain('Service3');
      expect(names.length).toBe(3);
    });

    it('should get service descriptors', () => {
      container.register('Singleton', () => ({}), ServiceLifecycle.SINGLETON);
      container.register('Transient', () => ({}), ServiceLifecycle.TRANSIENT);
      
      // Resolve singleton to instantiate it
      container.resolve('Singleton');
      
      const descriptors = container.getServiceDescriptors();
      
      const singleton = descriptors.find(d => d.name === 'Singleton');
      const transient = descriptors.find(d => d.name === 'Transient');
      
      expect(singleton?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
      expect(singleton?.instantiated).toBe(true);
      expect(transient?.lifecycle).toBe(ServiceLifecycle.TRANSIENT);
      expect(transient?.instantiated).toBe(false);
    });

    it('should clear all singleton instances', () => {
      container.register('DbConnection', () => new MockDatabaseConnection());
      
      const instance1 = container.resolve<MockDatabaseConnection>('DbConnection');
      instance1.connect();
      
      container.clearInstances();
      
      const instance2 = container.resolve<MockDatabaseConnection>('DbConnection');
      
      expect(instance1).not.toBe(instance2);
      expect(instance2.connected).toBe(false);
    });
  });

  // ==================== Child Container Tests ====================
  describe('Child Containers', () => {
    it('should create child container with inherited registrations', () => {
      container.register('ParentService', () => ({ source: 'parent' }));
      
      const child = container.createChild();
      
      const service = child.resolve<{ source: string }>('ParentService');
      
      expect(service.source).toBe('parent');
    });

    it('should allow child to override parent registrations', () => {
      container.register('SharedService', () => ({ source: 'parent' }));
      
      const child = container.createChild();
      child.replace('SharedService', () => ({ source: 'child' }));
      
      const parentService = container.resolve<{ source: string }>('SharedService');
      const childService = child.resolve<{ source: string }>('SharedService');
      
      expect(parentService.source).toBe('parent');
      expect(childService.source).toBe('child');
    });

    it('should not share singleton instances with child', () => {
      container.register('DbConnection', () => new MockDatabaseConnection());
      
      const parentInstance = container.resolve<MockDatabaseConnection>('DbConnection');
      parentInstance.connect();
      
      const child = container.createChild();
      const childInstance = child.resolve<MockDatabaseConnection>('DbConnection');
      
      expect(parentInstance).not.toBe(childInstance);
      expect(childInstance.connected).toBe(false);
    });
  });

  // ==================== Service Tokens Tests ====================
  describe('ServiceTokens', () => {
    it('should have predefined tokens for common services', () => {
      expect(ServiceTokens.USER_SERVICE).toBe('UserService');
      expect(ServiceTokens.VEHICLE_SERVICE).toBe('VehicleService');
      expect(ServiceTokens.SHIPMENT_SERVICE).toBe('ShipmentService');
      expect(ServiceTokens.PRISMA_CLIENT).toBe('PrismaClient');
    });

    it('should work with type-safe token resolution', () => {
      container.register(ServiceTokens.USER_SERVICE, () => new MockUserService());
      
      const service = container.resolve<MockUserService>(ServiceTokens.USER_SERVICE);
      
      expect(service).toBeInstanceOf(MockUserService);
    });
  });
});
