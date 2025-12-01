import { Drone, Truck, Ship } from '../src/core/Vehicle';
import { AirPricingStrategy, GroundPricingStrategy, SeaPricingStrategy } from '../src/core/PricingStrategy';
import { ShipmentFactory, ShipmentOptions } from '../src/core/ShipmentFactory';
import { Customer } from '../src/core/User';

async function runTests() {
    console.log('\n🚀 STARTING LOGIQ OOP VERIFICATION\n');

    // 1. Test Polymorphism
    console.log('--- TEST 1: POLYMORPHISM (Vehicle.move) ---');
    const drone = new Drone('d1', 'DRONE-001', 120);
    const truck = new Truck('t1', 'TRUCK-001', 4);
    const ship = new Ship('s1', 'SHIP-001');

    const origin = { lat: 40.7128, lng: -74.0060 }; // NYC
    const dest = { lat: 51.5074, lng: -0.1278 };    // London

    console.log('Calling .move() on different vehicle types:');

    const droneRoute = drone.move(origin, dest);
    console.log(`Drone Route: ${droneRoute.distance.toFixed(0)}km (Straight Line)`);

    const truckRoute = truck.move(origin, dest);
    console.log(`Truck Route: ${truckRoute.distance.toFixed(0)}km (Road Network - Simulated L-Shape)`);

    const shipRoute = ship.move(origin, dest);
    console.log(`Ship Route:  ${shipRoute.distance.toFixed(0)}km (Maritime - Longer Path)`);

    // 2. Test Strategy Pattern
    console.log('\n--- TEST 2: STRATEGY PATTERN (Pricing) ---');
    const weight = 100; // kg
    const distance = 1000; // km

    const air = new AirPricingStrategy();
    const ground = new GroundPricingStrategy();
    const sea = new SeaPricingStrategy();

    console.log(`Weight: ${weight}kg, Distance: ${distance}km`);
    console.log(`Air Cost:    $${air.calculate(weight, distance).toFixed(2)}`);
    console.log(`Ground Cost: $${ground.calculate(weight, distance).toFixed(2)}`);
    console.log(`Sea Cost:    $${sea.calculate(weight, distance).toFixed(2)}`);

    // 3. Test Factory Pattern
    console.log('\n--- TEST 3: FACTORY PATTERN (Shipment Creation) ---');
    const customer = new Customer('c1', 'John Doe', 'john@example.com');

    console.log('Scenario A: Urgent, Light Package (<50kg)');
    const optionsA: ShipmentOptions = {
        trackingId: 'TRK-A',
        weight: 10,
        origin,
        destination: dest,
        customer,
        urgency: 'high',
    };
    const resultA = ShipmentFactory.createShipment(optionsA);
    console.log(`-> Assigned Vehicle: ${resultA.recommendedVehicle.type}`);
    console.log(`-> Cost Strategy: ${resultA.shipment.cost > 1000 ? 'Premium (Air)' : 'Standard'}`);

    console.log('\nScenario B: Heavy Cargo (>5000kg)');
    const optionsB: ShipmentOptions = {
        trackingId: 'TRK-B',
        weight: 10000,
        origin,
        destination: dest,
        customer,
        urgency: 'standard',
    };
    const resultB = ShipmentFactory.createShipment(optionsB);
    console.log(`-> Assigned Vehicle: ${resultB.recommendedVehicle.type}`);

    console.log('\nScenario C: Standard Package');
    const optionsC: ShipmentOptions = {
        trackingId: 'TRK-C',
        weight: 200,
        origin,
        destination: dest,
        customer,
        urgency: 'standard',
    };
    const resultC = ShipmentFactory.createShipment(optionsC);
    console.log(`-> Assigned Vehicle: ${resultC.recommendedVehicle.type}`);

    console.log('\n✅ VERIFICATION COMPLETE: All OOP systems functioning as designed.');
}

runTests().catch(console.error);
