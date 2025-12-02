/**
 * Unit Tests for Pricing Strategy (Strategy Pattern)
 * ===================================================
 * Tests demonstrating the Strategy design pattern with
 * interchangeable pricing algorithms for Air, Ground, and Sea shipping
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AirPricingStrategy,
  GroundPricingStrategy,
  SeaPricingStrategy,
  PricingStrategyFactory,
  PricingStrategy,
} from '@/core/PricingStrategy';

describe('Pricing Strategy Pattern', () => {
  // ==================== Air Pricing Strategy ====================
  describe('AirPricingStrategy', () => {
    let airStrategy: AirPricingStrategy;

    beforeEach(() => {
      airStrategy = new AirPricingStrategy();
    });

    it('should have correct name', () => {
      expect(airStrategy.getStrategyName()).toBe('Air Express');
    });

    it('should have correct base rates', () => {
      const rates = airStrategy.getRates();
      expect(rates.weightRate).toBe(2.5); // $2.5/kg
      expect(rates.distanceRate).toBe(1.5); // $1.5/km
    });

    it('should calculate price correctly', () => {
      const price = airStrategy.calculate(10, 100); // 10kg, 100km
      
      // Base: (10 * 2.5) + (100 * 1.5) = 25 + 150 = 175
      // + surcharges (handling: 5, insurance: 2, fuel: 15% of distance cost)
      expect(price).toBeGreaterThan(175);
    });

    it('should apply distance discount for long hauls', () => {
      const shortDistance = airStrategy.calculate(10, 500);
      const longDistance = airStrategy.calculate(10, 1500);

      // Long distance gets 5% discount
      const ratio = longDistance / shortDistance;
      expect(ratio).toBeLessThan(3); // Not 3x the price for 3x the distance
    });

    it('should be eligible for typical shipments', () => {
      expect(airStrategy.isEligible(10, 100)).toBe(true);
      expect(airStrategy.isEligible(100, 1000)).toBe(true);
    });

    it('should enable priority delivery', () => {
      const normalPrice = airStrategy.calculate(10, 100);
      
      airStrategy.enablePriorityDelivery();
      const priorityPrice = airStrategy.calculate(10, 100);

      expect(priorityPrice).toBeGreaterThan(normalPrice);
    });

    it('should allow setting fuel surcharge', () => {
      airStrategy.setFuelSurcharge(0.25); // 25%
      const price = airStrategy.calculate(10, 100);
      expect(price).toBeGreaterThan(0);
    });

    it('should validate fuel surcharge range', () => {
      expect(() => airStrategy.setFuelSurcharge(1.5)).toThrow('Fuel surcharge must be between 0 and 1');
      expect(() => airStrategy.setFuelSurcharge(-0.1)).toThrow('Fuel surcharge must be between 0 and 1');
    });
  });

  // ==================== Ground Pricing Strategy ====================
  describe('GroundPricingStrategy', () => {
    let groundStrategy: GroundPricingStrategy;

    beforeEach(() => {
      groundStrategy = new GroundPricingStrategy();
    });

    it('should have correct name', () => {
      expect(groundStrategy.getStrategyName()).toBe('Ground Standard');
    });

    it('should have correct base rates', () => {
      const rates = groundStrategy.getRates();
      expect(rates.weightRate).toBe(0.5); // $0.5/kg
      expect(rates.distanceRate).toBe(0.8); // $0.8/km
    });

    it('should calculate price correctly', () => {
      const price = groundStrategy.calculate(50, 200); // 50kg, 200km
      
      // Base: (50 * 0.5) + (200 * 0.8) = 25 + 160 = 185
      // + surcharges
      expect(price).toBeGreaterThan(185);
    });

    it('should apply bulk discount for heavy shipments', () => {
      const lightPrice = groundStrategy.calculate(100, 500);
      const heavyPrice = groundStrategy.calculate(600, 500);

      // Heavy shipments get 10% discount
      const ratio = heavyPrice / lightPrice;
      expect(ratio).toBeLessThan(6); // Not 6x the price for 6x the weight
    });

    it('should add surcharge for heavy items over 100kg', () => {
      const under100 = groundStrategy.calculate(50, 100);
      const over100 = groundStrategy.calculate(150, 100);

      // Over 100kg adds $10 per 100kg
      expect(over100 - under100).toBeGreaterThan(50); // More than just weight difference
    });

    it('should enable weekend delivery surcharge', () => {
      const weekdayPrice = groundStrategy.calculate(50, 200);
      
      groundStrategy.enableWeekendDelivery();
      const weekendPrice = groundStrategy.calculate(50, 200);

      expect(weekendPrice).toBeGreaterThan(weekdayPrice);
    });

    it('should apply zone multipliers', () => {
      const basePrice = groundStrategy.calculate(50, 200);
      const remoteZonePrice = groundStrategy.getZonePrice('remote', basePrice);

      expect(remoteZonePrice).toBe(basePrice * 1.5);
    });
  });

  // ==================== Sea Pricing Strategy ====================
  describe('SeaPricingStrategy', () => {
    let seaStrategy: SeaPricingStrategy;

    beforeEach(() => {
      seaStrategy = new SeaPricingStrategy();
    });

    it('should have correct name', () => {
      expect(seaStrategy.getStrategyName()).toBe('Sea Freight');
    });

    it('should have lowest base rates', () => {
      const rates = seaStrategy.getRates();
      expect(rates.weightRate).toBe(0.1); // $0.1/kg
      expect(rates.distanceRate).toBe(0.2); // $0.2/km
    });

    it('should calculate price correctly', () => {
      const price = seaStrategy.calculate(1000, 5000); // 1000kg, 5000km
      
      // Base: (1000 * 0.1) + (5000 * 0.2) = 100 + 1000 = 1100
      // + surcharges (documentation: 25, port fees: 100)
      expect(price).toBeGreaterThan(1100);
    });

    it('should apply massive bulk discounts', () => {
      const smallPrice = seaStrategy.calculate(500, 5000);
      const bulkPrice = seaStrategy.calculate(10000, 5000);

      // 10+ tons gets 20% discount
      const ratio = bulkPrice / smallPrice;
      expect(ratio).toBeLessThan(20); // Not 20x the price for 20x the weight
    });

    it('should add large container surcharge', () => {
      const standardPrice = seaStrategy.calculate(1000, 5000);
      
      seaStrategy.setContainerSize('large');
      const largePrice = seaStrategy.calculate(1000, 5000);

      expect(largePrice).toBeGreaterThan(standardPrice);
      expect(largePrice - standardPrice).toBe(200); // $200 large container fee
    });

    it('should enable hazmat handling', () => {
      const normalPrice = seaStrategy.calculate(1000, 5000);
      
      seaStrategy.enableHazmatHandling();
      const hazmatPrice = seaStrategy.calculate(1000, 5000);

      // Hazmat adds $0.5/kg + $100 certification
      expect(hazmatPrice - normalPrice).toBeGreaterThan(500);
    });

    it('should set custom port fees', () => {
      seaStrategy.setPortFee('customs', 200);
      const price = seaStrategy.calculate(1000, 5000);
      expect(price).toBeGreaterThan(0);
    });
  });

  // ==================== Strategy Factory ====================
  describe('PricingStrategyFactory', () => {
    it('should create air strategy', () => {
      const strategy = PricingStrategyFactory.create('air');
      expect(strategy.getStrategyName()).toBe('Air Express');
    });

    it('should create ground strategy', () => {
      const strategy = PricingStrategyFactory.create('ground');
      expect(strategy.getStrategyName()).toBe('Ground Standard');
    });

    it('should create sea strategy', () => {
      const strategy = PricingStrategyFactory.create('sea');
      expect(strategy.getStrategyName()).toBe('Sea Freight');
    });

    it('should recommend cheapest strategy', () => {
      // For light, short shipments - all are valid
      const recommended = PricingStrategyFactory.recommend(10, 100);
      expect(recommended).toBeDefined();
    });

    it('should compare all strategies', () => {
      const comparison = PricingStrategyFactory.compareAll(50, 500);
      
      expect(comparison.length).toBe(3);
      expect(comparison[0]).toHaveProperty('strategy');
      expect(comparison[0]).toHaveProperty('price');
      expect(comparison[0]).toHaveProperty('eligible');
    });

    it('should show sea as cheapest for heavy cargo', () => {
      const comparison = PricingStrategyFactory.compareAll(5000, 10000);
      
      const eligible = comparison.filter(c => c.eligible);
      const cheapest = eligible.reduce((a, b) => a.price < b.price ? a : b);

      expect(cheapest.strategy).toBe('Sea Freight');
    });
  });

  // ==================== Strategy Pattern Tests ====================
  describe('Strategy Pattern Behavior', () => {
    it('should allow runtime strategy switching', () => {
      const strategies: PricingStrategy[] = [
        new AirPricingStrategy(),
        new GroundPricingStrategy(),
        new SeaPricingStrategy(),
      ];

      const weight = 100;
      const distance = 1000;

      const prices = strategies.map(s => ({
        name: s.getStrategyName(),
        price: s.calculate(weight, distance),
      }));

      // All should return valid prices
      prices.forEach(p => {
        expect(p.price).toBeGreaterThan(0);
      });

      // Air should be most expensive, Sea cheapest
      const airPrice = prices.find(p => p.name === 'Air Express')!.price;
      const seaPrice = prices.find(p => p.name === 'Sea Freight')!.price;
      expect(airPrice).toBeGreaterThan(seaPrice);
    });

    it('should allow adding custom surcharges', () => {
      const strategy = new AirPricingStrategy();
      
      const basePriceBefore = strategy.calculate(10, 100);
      
      strategy.addSurcharge('customs', 50);
      const basePriceAfter = strategy.calculate(10, 100);

      expect(basePriceAfter).toBeGreaterThan(basePriceBefore);
    });

    it('should allow removing surcharges', () => {
      const strategy = new GroundPricingStrategy();
      
      strategy.addSurcharge('express', 25);
      const withSurcharge = strategy.calculate(10, 100);
      
      strategy.removeSurcharge('express');
      const withoutSurcharge = strategy.calculate(10, 100);

      expect(withoutSurcharge).toBeLessThan(withSurcharge);
    });

    it('should implement interface contract consistently', () => {
      const strategies: PricingStrategy[] = [
        new AirPricingStrategy(),
        new GroundPricingStrategy(),
        new SeaPricingStrategy(),
      ];

      strategies.forEach(strategy => {
        // Every strategy must implement these
        expect(typeof strategy.calculate).toBe('function');
        expect(typeof strategy.getStrategyName).toBe('function');
        expect(typeof strategy.getRates).toBe('function');
        expect(typeof strategy.isEligible).toBe('function');

        // And return expected types
        expect(typeof strategy.calculate(10, 100)).toBe('number');
        expect(typeof strategy.getStrategyName()).toBe('string');
        expect(typeof strategy.getRates()).toBe('object');
        expect(typeof strategy.isEligible(10, 100)).toBe('boolean');
      });
    });
  });
});
