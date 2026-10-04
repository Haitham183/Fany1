import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Executes database operations with PostgreSQL Row-Level Security (RLS) tenant context.
 * Sets local session variables inside an isolated transaction.
 */
export async function withTenantContext<T>(
  tenantId: string | null,
  isDirectorateAdmin: boolean,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // 1. Set PostgreSQL RLS Session Settings
    if (tenantId) {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}';`);
    } else {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '';`);
    }

    if (isDirectorateAdmin) {
      await tx.$executeRawUnsafe(`SET LOCAL app.is_directorate_admin = 'true';`);
    } else {
      await tx.$executeRawUnsafe(`SET LOCAL app.is_directorate_admin = 'false';`);
    }

    // 2. Execute the tenant-guarded business logic
    return await callback(tx);
  });
}
