const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

function createPrismaClient() {
  const { PrismaClient } = require("@prisma/client") as {
    PrismaClient: new (options?: Record<string, unknown>) => any;
  };

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as any, {
  get(_target, property) {
    return getPrismaClient()[property as keyof ReturnType<typeof getPrismaClient>];
  }
});
