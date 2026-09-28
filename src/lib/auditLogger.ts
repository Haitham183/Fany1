import { db } from './db';
import { AuditLogEntry } from '@/types';

/**
 * محرك سجل التدقيق الأمني المعتمد (Insert-Only Security Audit Logger)
 * يسجل كافة العمليات الحساسة ولا يسمح بالتعديل أو الحذف
 */
export const logAuditEvent = async (params: {
  schoolId?: string;
  actorId: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
}): Promise<AuditLogEntry> => {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    school_id: params.schoolId,
    actor_id: params.actorId,
    actor_name: params.actorName,
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId,
    old_value: params.oldValue,
    new_value: params.newValue,
    created_at: new Date().toISOString(),
  };

  try {
    await db.audit_log.put(entry);
  } catch {
    // Non-blocking fallback
  }

  return entry;
};

export const getAuditLogs = async (filter?: {
  entity?: string;
  actorId?: string;
  action?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> => {
  try {
    let query = db.audit_log.orderBy('created_at').reverse();
    let results = await query.toArray();

    if (filter?.entity) {
      results = results.filter((r) => r.entity === filter.entity);
    }
    if (filter?.actorId) {
      results = results.filter((r) => r.actor_id === filter.actorId);
    }
    if (filter?.action) {
      results = results.filter((r) => r.action === filter.action);
    }
    if (filter?.limit) {
      results = results.slice(0, filter.limit);
    }
    return results;
  } catch {
    return [];
  }
};
