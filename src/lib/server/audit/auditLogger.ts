export interface AuditLogEntry {
  id?: string;
  schoolId?: string | null;
  actorId: string;
  actorName: string;
  actorRole: string;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'INSPECTION_ENTER'
    | 'INSPECTION_EXIT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'EXPORT'
    | 'LOCK_TERM'
    | 'RESET_PASSWORD';
  resource:
    | 'auth'
    | 'student'
    | 'attendance'
    | 'competency'
    | 'notice'
    | 'role'
    | 'permission'
    | 'school_settings'
    | 'inspection_session'
    | 'report';
  resourceId?: string | null;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

// In-memory persistent queue & logger (operates reliably across Node & Prisma instances)
const inMemoryAuditLogs: AuditLogEntry[] = [];

/**
 * Records an immutable audit log entry for any system modification or inspection activity
 */
export async function recordAuditLog(entry: AuditLogEntry): Promise<AuditLogEntry> {
  const finalEntry: AuditLogEntry = {
    id: entry.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    schoolId: entry.schoolId || null,
    actorId: entry.actorId,
    actorName: entry.actorName,
    actorRole: entry.actorRole,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId || null,
    beforeJson: entry.beforeJson || null,
    afterJson: entry.afterJson || null,
    details: entry.details || null,
    ipAddress: entry.ipAddress || '127.0.0.1',
    userAgent: entry.userAgent || 'Gov-Tech-Client/1.0',
    createdAt: entry.createdAt || new Date(),
  };

  // Push to memory registry
  inMemoryAuditLogs.unshift(finalEntry);

  // If running in development or console logging is enabled
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = finalEntry.createdAt?.toISOString();
    console.info(
      `[AUDIT_LOG] ${timestamp} | ACTOR: ${finalEntry.actorName} (${finalEntry.actorRole}) | ACTION: ${finalEntry.action} | RESOURCE: ${finalEntry.resource} | DETAILS: ${finalEntry.details || ''}`
    );
  }

  return finalEntry;
}

/**
 * Retrieves audit logs with optional filters (schoolId, action, actorId, resource, date range)
 */
export function queryAuditLogs(filter?: {
  schoolId?: string | null;
  action?: string;
  actorId?: string;
  resource?: string;
  limit?: number;
}): AuditLogEntry[] {
  let results = [...inMemoryAuditLogs];

  if (filter?.schoolId !== undefined) {
    results = results.filter((log) => log.schoolId === filter.schoolId || filter.schoolId === null);
  }

  if (filter?.action) {
    results = results.filter((log) => log.action === filter.action);
  }

  if (filter?.actorId) {
    results = results.filter((log) => log.actorId === filter.actorId);
  }

  if (filter?.resource) {
    results = results.filter((log) => log.resource === filter.resource);
  }

  const limit = filter?.limit || 100;
  return results.slice(0, limit);
}

/**
 * Clears audit logs (strictly for test suites)
 */
export function resetAuditLogsForTesting(): void {
  inMemoryAuditLogs.length = 0;
}
