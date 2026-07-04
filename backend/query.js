const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const targets = await prisma.salesTarget.findMany();
  console.log("ALL TARGETS:", targets);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
