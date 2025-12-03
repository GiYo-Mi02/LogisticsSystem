const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Get the 5 most recent shipments
  const recentShipments = await prisma.shipment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      trackingId: true,
      status: true,
      transportMode: true,
      weight: true,
      originCity: true,
      destCity: true,
      createdAt: true,
    },
  });

  console.log("5 Most Recent Shipments:");
  recentShipments.forEach((s) => {
    console.log(
      `  ${s.trackingId} | ${s.status} | transportMode: ${
        s.transportMode || "NULL"
      } | ${s.weight}kg | ${s.originCity} → ${
        s.destCity
      } | ${s.createdAt.toISOString()}`
    );
  });

  // Count by status
  const byStatus = await prisma.shipment.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("\nShipments by status:");
  byStatus.forEach((s) => console.log(`  ${s.status}: ${s._count}`));

  // Count by transportMode
  const byMode = await prisma.shipment.groupBy({
    by: ["transportMode"],
    _count: true,
  });
  console.log("\nShipments by transportMode:");
  byMode.forEach((s) =>
    console.log(`  ${s.transportMode || "NULL"}: ${s._count}`)
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
