import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.shipment.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create Customers
  const customer1 = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'hashed_password',
      role: 'CUSTOMER',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'hashed_password',
      role: 'CUSTOMER',
    },
  });

  // Create Drivers
  const driver1 = await prisma.user.create({
    data: {
      name: 'Charlie Driver',
      email: 'charlie@logiq.com',
      password: 'hashed_password',
      role: 'DRIVER',
    },
  });

  // Create Admin
  const admin1 = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@logiq.com',
      password: 'hashed_password',
      role: 'ADMIN',
    },
  });

  // Create Vehicles
  const drone1 = await prisma.vehicle.create({
    data: {
      licenseId: 'DRONE-001',
      type: 'DRONE',
      capacity: 5.0,
      currentFuel: 100.0,
      status: 'IDLE',
      maxAltitude: 120.0,
      latitude: 40.7128,
      longitude: -74.0060,
    },
  });

  const truck1 = await prisma.vehicle.create({
    data: {
      licenseId: 'TRUCK-101',
      type: 'TRUCK',
      capacity: 1000.0,
      currentFuel: 85.0,
      status: 'IDLE',
      numberOfAxles: 4,
      latitude: 34.0522,
      longitude: -118.2437,
      driver: {
        connect: { id: driver1.id }
      }
    },
  });

  console.log({ customer1, customer2, driver1, admin1, drone1, truck1 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
