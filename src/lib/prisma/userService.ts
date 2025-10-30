import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure a single Prisma instance in development to avoid connection issues
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Log queries and errors for debugging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Handle connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  console.log('Retrying connection in 5 seconds...');
  setTimeout(() => {
    prisma.$connect().catch(console.error);
  }, 5000);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;