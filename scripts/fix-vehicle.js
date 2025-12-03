const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Clear vehicle SHP-5525 that's pointing to the PENDING shipment
  const cleared = await prisma.vehicle.update({
    where: { id: "c9e59c81-f3d8-49bc-bcb8-033d2a0c350e" },
    data: { currentShipmentId: null, status: "IDLE" },
  });
  console.log("Cleared vehicle:", cleared.licenseId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
