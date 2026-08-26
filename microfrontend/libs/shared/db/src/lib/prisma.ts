import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client singleton.
 *
 * Every service (catalog / cart / user) imports this SAME instance so the
 * whole process shares one connection pool. Creating a new `PrismaClient` per
 * import is a common leak — it opens a fresh pool each time and exhausts
 * connections under load.
 *
 * In development (hot reload / next dev) the client is cached on
 * `globalThis` so it survives module re-evaluation without leaking pools.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env["NODE_ENV"] !== 'production') {
  globalForPrisma.prisma = prisma;
}
