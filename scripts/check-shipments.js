const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Check SHIP vehicles
  const shipVehicles = await prisma.vehicle.findMany({
    where: { type: "SHIP" },
    select: {
      id: true,
      licenseId: true,
      status: true,
      currentShipmentId: true,
    },
  });
  console.log("SHIP vehicles:", JSON.stringify(shipVehicles, null, 2));

  // Clear currentShipmentId from vehicles that point to PENDING shipments
  const cleared = await prisma.vehicle.updateMany({
    where: {
      currentShipment: { status: "PENDING" },
    },
    data: { currentShipmentId: null, status: "IDLE" },
  });
  console.log("\nCleared vehicles pointing to PENDING shipments:", cleared);

  // Also clear any vehicles pointing to the specific shipment we're trying to accept
  const shipment = await prisma.shipment.findFirst({
    where: { transportMode: "SHIP", status: "PENDING" },
  });
  if (shipment) {
    const clearedSpecific = await prisma.vehicle.updateMany({
      where: { currentShipmentId: shipment.id },
      data: { currentShipmentId: null, status: "IDLE" },
    });
    console.log(
      "Cleared vehicles for shipment",
      shipment.trackingId,
      ":",
      clearedSpecific
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
