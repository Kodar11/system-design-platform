import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Ensure a single Prisma instance in development to avoid connection issues
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // Log queries and errors for debugging
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;