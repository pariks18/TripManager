const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const records = await prisma.otpVerification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.log('RECORDS IN DB:', JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('DB ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
