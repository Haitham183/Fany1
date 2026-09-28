import { logAuditEvent } from './auditLogger';

export interface ConflictRecord {
  [key: string]: any;
  updated_at?: string;
  updated_by?: string;
}

/**
 * محرك حل التعارضات على مستوى الحقل (Field-Level Last-Write-Wins Conflict Resolver)
 * يقارن الحقول ويفوز الحقل الأحدث زمناً، ويسجل أي تعارض في سجل التدقيق
 */
export const resolveFieldLevelConflict = async <T extends ConflictRecord>(
  entityName: string,
  recordId: string,
  localRecord: T,
  remoteRecord: T,
  actorId: string = 'sync_engine'
): Promise<T> => {
  const localTime = new Date(localRecord.updated_at || 0).getTime();
  const remoteTime = new Date(remoteRecord.updated_at || 0).getTime();

  const merged: any = { ...localRecord };
  const conflictDetails: Record<string, { local: any; remote: any; winner: string }> = {};
  let hasConflict = false;

  const allKeys = Array.from(new Set([...Object.keys(localRecord), ...Object.keys(remoteRecord)]));

  for (const key of allKeys) {
    if (key === 'updated_at' || key === 'updated_by') continue;

    const localVal = localRecord[key];
    const remoteVal = remoteRecord[key];

    if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
      hasConflict = true;
      if (remoteTime >= localTime) {
        merged[key] = remoteVal;
        conflictDetails[key] = { local: localVal, remote: remoteVal, winner: 'remote' };
      } else {
        merged[key] = localVal;
        conflictDetails[key] = { local: localVal, remote: remoteVal, winner: 'local' };
      }
    }
  }

  merged.updated_at = new Date(Math.max(localTime, remoteTime, Date.now())).toISOString();
  merged.updated_by = remoteTime >= localTime ? remoteRecord.updated_by || actorId : localRecord.updated_by || actorId;

  if (hasConflict) {
    await logAuditEvent({
      actorId,
      actorName: 'محرك حل التعارضات التلقائي',
      action: 'conflict_resolved_lww',
      entity: entityName,
      entityId: recordId,
      oldValue: { local: localRecord, remote: remoteRecord },
      newValue: { merged, conflictDetails },
    });
  }

  return merged as T;
};
