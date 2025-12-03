const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== SYSTEM TEST ===\n");

  // 1. Check sea shipments
  const seaShipments = await prisma.shipment.findMany({
    where: { transportMode: "SHIP" },
    select: {
      id: true,
      trackingId: true,
      status: true,
      weight: true,
      originCity: true,
      destCity: true,
    },
  });
  console.log("SEA Shipments (transportMode: SHIP):");
  seaShipments.forEach((s) => {
    console.log(
      `  ${s.trackingId} | ${s.status} | ${s.weight}kg | ${s.originCity} → ${s.destCity}`
    );
  });

  // 2. Check pending shipments available for Maritime Command
  const pendingSeaShipments = seaShipments.filter(
    (s) => s.status === "PENDING"
  );
  console.log(
    `\nPending SEA shipments (Available Cargo): ${pendingSeaShipments.length}`
  );

  // 3. Check available SHIP vehicles
  const availableShips = await prisma.vehicle.findMany({
    where: {
      type: "SHIP",
      status: "IDLE",
      currentShipmentId: null,
    },
    select: { id: true, licenseId: true, status: true },
  });
  console.log(`\nAvailable SHIP vehicles: ${availableShips.length}`);
  availableShips.forEach((v) => console.log(`  ${v.licenseId} (${v.status})`));

  // 4. Check Driver Command shipments (should NOT include SHIP)
  const driverShipments = await prisma.shipment.findMany({
    where: {
      OR: [{ status: "PENDING" }, { status: "ASSIGNED", driverId: null }],
      NOT: { transportMode: "SHIP" },
      AND: [
        {
          OR: [
            { weight: { lt: 1000 } },
            { transportMode: { in: ["TRUCK", "DRONE"] } },
          ],
        },
      ],
    },
    select: {
      trackingId: true,
      status: true,
      transportMode: true,
      weight: true,
    },
  });
  console.log(
    `\nDriver Command shipments (non-SEA): ${driverShipments.length}`
  );
  driverShipments.forEach((s) => {
    console.log(
      `  ${s.trackingId} | ${s.status} | ${s.transportMode || "null"} | ${
        s.weight
      }kg`
    );
  });

  console.log("\n=== TEST COMPLETE ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
