import { db } from './db';
import {
  MOCK_USERS,
  MOCK_DEPARTMENTS,
  MOCK_CLASSES,
  MOCK_STUDENTS,
  MOCK_NOTICES,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_WORKSHOP_VIOLATIONS,
  MOCK_COMPETENCY_UNITS,
  MOCK_COMPETENCY_ASSESSMENTS,
  MOCK_SOCIAL_CASES,
  MOCK_COMPETENCY_VERIFICATIONS,
  MOCK_STUDENT_PORTFOLIOS,
  SCHOOL_CONFIG,
} from './mockData';
import { Student, User, SocialCaseRecord } from '@/types';

// Simple Fast SHA-256 Hash for National ID
export const hashNationalId = async (nationalId: string): Promise<string> => {
  if (!nationalId) return '';
  const cleanNid = nationalId.trim().replace(/\s+/g, '');
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(cleanNid);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Synchronous fallback hash
  let hash = 0;
  for (let i = 0; i < cleanNid.length; i++) {
    const char = cleanNid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `nid_h_${Math.abs(hash).toString(16)}`;
};

// Generate School-Issued Secret Access Code for Parent Portal (e.g. 6 chars uppercase alphanumeric)
export const generateParentAccessCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const MIGRATION_KEY = 'egyptian_school_migrated_to_indexeddb_v2';

export const runLocalStorageToIndexedDbMigration = async () => {
  if (typeof window === 'undefined') return;

  const isMigrated = localStorage.getItem(MIGRATION_KEY);
  const studentsCountInDb = await db.students.count();

  if (isMigrated && studentsCountInDb > 0) {
    return;
  }

  try {
    // 1. Read legacy data from LocalStorage or Fallback to Seed Mocks
    const readLegacy = <T>(key: string, defaultValue: T): T => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const legacyUsers = readLegacy<User[]>('egyptian_school_users', MOCK_USERS);
    const legacyStudents = readLegacy<Student[]>('egyptian_school_students', MOCK_STUDENTS);
    const legacyDepts = readLegacy('egyptian_school_departments', MOCK_DEPARTMENTS);
    const legacyClasses = readLegacy('egyptian_school_classes', MOCK_CLASSES);
    const legacyAttendance = readLegacy('egyptian_school_attendance', MOCK_ATTENDANCE_HISTORY);
    const legacyNotices = readLegacy('egyptian_school_notices', MOCK_NOTICES);
    const legacyViolations = readLegacy('egyptian_school_workshop_violations', MOCK_WORKSHOP_VIOLATIONS);
    const legacyUnits = readLegacy('egyptian_school_competency_units', MOCK_COMPETENCY_UNITS);
    const legacyAssessments = readLegacy('egyptian_school_competency_assessments', MOCK_COMPETENCY_ASSESSMENTS);
    const legacyVerifications = readLegacy('egyptian_school_competency_verifications', MOCK_COMPETENCY_VERIFICATIONS);
    const legacyPortfolios = readLegacy('egyptian_school_student_portfolios', MOCK_STUDENT_PORTFOLIOS);
    const legacySocialCases = readLegacy<SocialCaseRecord[]>('egyptian_school_social_cases', MOCK_SOCIAL_CASES);
    const legacyConfig = readLegacy('egyptian_school_config', SCHOOL_CONFIG);

    // 2. Enhance Students with National ID Hashes & Parent Access Codes
    const nowIso = new Date().toISOString();
    const enhancedStudents: Student[] = await Promise.all(
      legacyStudents.map(async (std) => {
        const hash = await hashNationalId(std.nationalId);
        return {
          ...std,
          nationalIdHash: hash,
          parentAccessCode: std.parentAccessCode || generateParentAccessCode(),
          updated_at: std.updated_at || nowIso,
          updated_by: std.updated_by || 'migration_engine',
        };
      })
    );

    // 3. Populate IndexedDB Tables via Dexie
    await db.transaction(
      'rw',
      [
        db.students,
        db.users,
        db.departments,
        db.classes,
        db.attendance,
        db.notices,
        db.workshop_violations,
        db.competency_units,
        db.competency_assessments,
        db.competency_verifications,
        db.student_portfolios,
        db.social_cases,
        db.school_settings,
        db.audit_log,
      ],
      async () => {
        if ((await db.students.count()) === 0) {
          await db.students.bulkPut(enhancedStudents);
        }
        if ((await db.users.count()) === 0) {
          await db.users.bulkPut(legacyUsers);
        }
        if ((await db.departments.count()) === 0) {
          await db.departments.bulkPut(legacyDepts);
        }
        if ((await db.classes.count()) === 0) {
          await db.classes.bulkPut(legacyClasses);
        }
        if ((await db.attendance.count()) === 0) {
          await db.attendance.bulkPut(legacyAttendance);
        }
        if ((await db.notices.count()) === 0) {
          await db.notices.bulkPut(legacyNotices);
        }
        if ((await db.workshop_violations.count()) === 0) {
          await db.workshop_violations.bulkPut(legacyViolations);
        }
        if ((await db.competency_units.count()) === 0) {
          await db.competency_units.bulkPut(legacyUnits);
        }
        if ((await db.competency_assessments.count()) === 0) {
          await db.competency_assessments.bulkPut(legacyAssessments);
        }
        if ((await db.competency_verifications.count()) === 0) {
          await db.competency_verifications.bulkPut(legacyVerifications);
        }
        if ((await db.student_portfolios.count()) === 0) {
          await db.student_portfolios.bulkPut(legacyPortfolios);
        }
        if ((await db.social_cases.count()) === 0) {
          await db.social_cases.bulkPut(legacySocialCases);
        }
        if ((await db.school_settings.count()) === 0) {
          await db.school_settings.put({
            ...legacyConfig,
            id: 'current_school_config',
            minDaysForAttendanceWarning: 10,
            absenceOnePeriodCountsAsDay: false,
            workshopRuleEnabled: true,
            internalVerificationSampleRate: 15,
            warning1ConsecutiveDays: 5,
            warning1TotalDays: 10,
            warning2ConsecutiveDays: 10,
            warning2TotalDays: 20,
            expulsionConsecutiveDays: 15,
            expulsionTotalDays: 30,
            reinstatementFeeAbsence: 25,
            reinstatementFeeFailure: 35,
            fiveYearSystemEnabled: false,
            updated_at: nowIso,
            updated_by: 'migration_engine',
          });
        }

        // Add Initial Audit Log
        await db.audit_log.put({
          id: `audit_mig_${Date.now()}`,
          actor_id: 'system',
          actor_name: 'نظام الترحيل الآمن v2',
          action: 'storage_migration_indexeddb',
          entity: 'system_storage',
          created_at: nowIso,
          new_value: { status: 'migrated_successfully', studentsMigrated: enhancedStudents.length },
        });
      }
    );

    // 4. PURGE Sensitive data from LocalStorage to adhere to Rule 6
    // (Never store National ID or Social Case data in LocalStorage)
    const sensitiveKeys = [
      'egyptian_school_students',
      'egyptian_school_social_cases',
      'egyptian_school_attendance',
      'egyptian_school_notices',
      'egyptian_school_workshop_violations',
      'egyptian_school_competency_assessments',
      'egyptian_school_competency_verifications',
      'egyptian_school_student_portfolios',
    ];
    sensitiveKeys.forEach((k) => localStorage.removeItem(k));

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (error) {
    // Non-blocking catch
  }
};
