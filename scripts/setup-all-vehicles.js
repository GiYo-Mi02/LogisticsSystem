const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Hub locations for vehicles
const locations = {
  DRONE: [
    { name: "New York Hub", lat: 40.7128, lng: -74.006 },
    { name: "LA Hub", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago Hub", lat: 41.8781, lng: -87.6298 },
    { name: "Miami Hub", lat: 25.7617, lng: -80.1918 },
  ],
  TRUCK: [
    { name: "New York Depot", lat: 40.7589, lng: -73.9851 },
    { name: "LA Depot", lat: 33.9425, lng: -118.408 },
    { name: "Dallas Depot", lat: 32.7767, lng: -96.797 },
    { name: "Atlanta Depot", lat: 33.749, lng: -84.388 },
    { name: "Denver Depot", lat: 39.7392, lng: -104.9903 },
    { name: "Seattle Depot", lat: 47.6062, lng: -122.3321 },
  ],
};

async function main() {
  // Get all vehicles without coordinates
  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
  });

  console.log(`Found ${vehicles.length} vehicles without coordinates`);

  for (const vehicle of vehicles) {
    const locs = locations[vehicle.type] || locations.TRUCK;
    const loc = locs[Math.floor(Math.random() * locs.length)];

    // Add random offset
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        latitude: loc.lat + latOffset,
        longitude: loc.lng + lngOffset,
      },
    });
    console.log(`  ${vehicle.licenseId} (${vehicle.type}) -> ${loc.name}`);
  }

  console.log("\nDone! All vehicles now have coordinates.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
