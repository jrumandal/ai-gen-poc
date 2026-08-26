import { prisma } from './prisma';

describe('shared db prisma singleton', () => {
  it('exposes a PrismaClient instance', () => {
    // PrismaClient instances expose $connect / $disconnect / $on.
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
    expect(typeof prisma.$on).toBe('function');
  });

  it('is the same instance across imports (no pool leak)', async () => {
    // Re-importing the module must return the cached singleton, not a fresh
    // client (which would open a second connection pool).
    const { prisma: again } = await import('./prisma');
    expect(again).toBe(prisma);
  });

  it('can be disconnected cleanly', async () => {
    await prisma.$disconnect();
  });
});
