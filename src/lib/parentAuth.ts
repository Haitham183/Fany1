import { Student, User } from '@/types';
import { getStudents } from '@/lib/storage';
import { logAuditEvent } from '@/lib/auditLogger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_LOCKOUT_KEY = 'egyptian_school_parent_lockout_ts';
const STORAGE_FAILS_KEY = 'egyptian_school_parent_fails_count';

export interface ParentAuthResult {
  success: boolean;
  student?: Student;
  user?: User;
  error?: string;
  isLocked?: boolean;
  remainingSeconds?: number;
}

export function getParentLockoutStatus(): { isLocked: boolean; remainingSeconds: number; fails: number } {
  if (typeof window === 'undefined') {
    return { isLocked: false, remainingSeconds: 0, fails: 0 };
  }

  try {
    const lockUntilStr = sessionStorage.getItem(STORAGE_LOCKOUT_KEY);
    const fails = parseInt(sessionStorage.getItem(STORAGE_FAILS_KEY) || '0', 10);

    if (lockUntilStr) {
      const lockUntil = parseInt(lockUntilStr, 10);
      const remainingMs = lockUntil - Date.now();
      if (remainingMs > 0) {
        return {
          isLocked: true,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          fails,
        };
      } else {
        // Expired
        sessionStorage.removeItem(STORAGE_LOCKOUT_KEY);
        sessionStorage.setItem(STORAGE_FAILS_KEY, '0');
      }
    }
    return { isLocked: false, remainingSeconds: 0, fails };
  } catch {
    return { isLocked: false, remainingSeconds: 0, fails: 0 };
  }
}

export async function verifyParentCredentials(
  nationalId: string,
  secretCode: string,
  schoolId?: string
): Promise<ParentAuthResult> {
  const status = getParentLockoutStatus();
  if (status.isLocked) {
    return {
      success: false,
      isLocked: true,
      remainingSeconds: status.remainingSeconds,
      error: `تم قفل محاولات الدخول مؤقتاً لحماية خصوصية بيانات الطالب. يرجى الانتظار ${status.remainingSeconds} ثانية.`,
    };
  }

  const cleanNid = nationalId.trim().replace(/\s+/g, '');
  const cleanCode = secretCode.trim().toUpperCase();

  if (!cleanNid || cleanNid.length < 10) {
    return {
      success: false,
      error: 'يرجى إدخال الرقم القومي الصحيح للطالب (14 رقماً).',
    };
  }

  if (!cleanCode) {
    return {
      success: false,
      error: 'يرجى إدخال الرقم السري الذي تمنحه المدرسة لولي الأمر.',
    };
  }

  const allStudents = getStudents();
  // Strictly match National ID AND the dedicated parent access code issued by the school
  // (Zero master key backdoor bypasses like DEMO12)
  const matched = allStudents.find((s) => {
    const nidMatch = s.nationalId.trim() === cleanNid;
    const parentCode = s.parentAccessCode?.trim().toUpperCase();
    return nidMatch && parentCode && parentCode === cleanCode;
  });

  if (matched) {
    // Reset lockout
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_LOCKOUT_KEY);
        sessionStorage.setItem(STORAGE_FAILS_KEY, '0');
      } catch {}
    }

    try {
      await logAuditEvent({
        schoolId: matched.schoolId || schoolId,
        actorId: `parent_${matched.id}`,
        actorName: `ولي أمر الطالب (${matched.fullName})`,
        action: 'parent_portal_2fa_login',
        entity: 'parent_portal',
        entityId: matched.id,
      });
    } catch (err) {
      console.warn('Audit log error on parent login:', err);
    }

    const parentUser: User = {
      id: `parent_${matched.id}`,
      name: `ولي أمر الطالب / ${matched.fullName}`,
      username: `parent_${matched.studentCode}`,
      role: 'parent',
      roleTitle: 'ولي الأمر (دخول ثنائي معتمد)',
      schoolId: matched.schoolId || schoolId,
    };

    return {
      success: true,
      student: matched,
      user: parentUser,
    };
  } else {
    // Failed attempt increment
    let newFails = status.fails + 1;
    let isLocked = false;
    let remainingSec = 0;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_FAILS_KEY, newFails.toString());
        if (newFails >= MAX_FAILED_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
          sessionStorage.setItem(STORAGE_LOCKOUT_KEY, lockUntil.toString());
          isLocked = true;
          remainingSec = Math.ceil(LOCKOUT_DURATION_MS / 1000);
        }
      } catch {}
    }

    if (isLocked) {
      return {
        success: false,
        isLocked: true,
        remainingSeconds: remainingSec,
        error: 'تم تجاوز الحد الأقصى للمحاولات غير الصحيحة (5 محاولات). تم قفل الدخول مؤقتاً لمدة 5 دقائق لحماية الخصوصية.',
      };
    }

    return {
      success: false,
      error: `بيانات الدخول غير صحيحة. يرجى التأكد من الرقم القومي والرقم السري الصادر من المدرسة. (المحاولات المتبقية: ${MAX_FAILED_ATTEMPTS - newFails})`,
    };
  }
}
