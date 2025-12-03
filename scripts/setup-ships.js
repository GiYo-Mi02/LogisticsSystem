const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Port locations for ships
const portLocations = [
  { name: "Los Angeles Port", lat: 33.7283, lng: -118.2616 },
  { name: "Singapore Port", lat: 1.2644, lng: 103.8198 },
  { name: "Rotterdam Port", lat: 51.9036, lng: 4.4993 },
  { name: "Shanghai Port", lat: 31.3565, lng: 121.5905 },
  { name: "Tokyo Port", lat: 35.6229, lng: 139.7756 },
  { name: "Sydney Port", lat: -33.8523, lng: 151.2108 },
];

async function main() {
  // Get all SHIP vehicles
  const ships = await prisma.vehicle.findMany({
    where: { type: "SHIP" },
  });

  console.log(`Found ${ships.length} SHIP vehicles`);

  // Update ships without coordinates
  let updated = 0;
  for (let i = 0; i < ships.length; i++) {
    const ship = ships[i];
    if (ship.latitude === null || ship.longitude === null) {
      const port = portLocations[i % portLocations.length];
      // Add slight random offset so ships aren't all at exact same location
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;

      await prisma.vehicle.update({
        where: { id: ship.id },
        data: {
          latitude: port.lat + latOffset,
          longitude: port.lng + lngOffset,
        },
      });
      console.log(`  Updated ${ship.licenseId} -> ${port.name}`);
      updated++;
    } else {
      console.log(`  ${ship.licenseId} already has coordinates`);
    }
  }

  console.log(`\nUpdated ${updated} ships with port locations`);

  // Show all vehicles with coordinates
  const allVehicles = await prisma.vehicle.findMany({
    select: {
      licenseId: true,
      type: true,
      status: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log("\nAll vehicles:");
  allVehicles.forEach((v) => {
    const hasCoords = v.latitude !== null && v.longitude !== null;
    console.log(
      `  ${v.licenseId} (${v.type}) - ${v.status} - ${
        hasCoords
          ? `[${v.latitude?.toFixed(2)}, ${v.longitude?.toFixed(2)}]`
          : "NO COORDS"
      }`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
