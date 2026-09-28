'use client';

import {
  Department,
  SchoolClass,
  Student,
  User,
  OfficialNotice,
  AttendanceRecord,
  AttendanceStatus,
  PeriodType,
  SchoolConfig,
  StudentTransferLog,
  WorkshopViolationRecord,
  DailyMorningCensus,
  GradeLevel,
  Holiday,
  HolidayType,
  CompetencyUnit,
  StudentCompetencyAssessment,
  CompetencyVerificationRecord,
  StudentPortfolioRecord,
  SocialCaseRecord,
  SocialSessionRecord,
  SocialCasePriority,
  SocialCaseCategory,
  BackupPackage,
  EarlyWarningAlert,
  StudentDynamicAttendanceStats,
  GrievanceRecord,
  AssessmentCalendarEvent,
  AuditLogEntry,
} from '@/types';
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
  DEFAULT_EGYPTIAN_HOLIDAYS,
} from './mockData';
import { db } from './db';
import { runLocalStorageToIndexedDbMigration, hashNationalId, generateParentAccessCode } from './migration';
import { logAuditEvent, getAuditLogs } from './auditLogger';
import { OFFICIAL_TERMS } from './terms';
import { autoSyncKeyToCloud, deleteRowFromCloud } from './supabaseSync';

const STORAGE_KEYS = {
  CURRENT_USER: 'egyptian_school_current_user',
  USERS: 'egyptian_school_users',
  DEPARTMENTS: 'egyptian_school_departments',
  CLASSES: 'egyptian_school_classes',
  ATTENDANCE: 'egyptian_school_attendance',
  NOTICES: 'egyptian_school_notices',
  CONFIG: 'egyptian_school_config',
  TRANSFER_LOGS: 'egyptian_school_transfer_logs',
  WORKSHOP_VIOLATIONS: 'egyptian_school_workshop_violations',
  COMPETENCY_UNITS: 'egyptian_school_competency_units',
  COMPETENCY_ASSESSMENTS: 'egyptian_school_competency_assessments',
  COMPETENCY_VERIFICATIONS: 'egyptian_school_competency_verifications',
  STUDENT_PORTFOLIOS: 'egyptian_school_student_portfolios',
  GRIEVANCES: 'egyptian_school_grievances',
  ASSESSMENT_CALENDAR: 'egyptian_school_assessment_calendar',
  IS_AUTHENTICATED: 'egyptian_school_is_auth',
};

// In-Memory Safe Reactive Cache for PII (Students & Social Cases) to prevent storing National IDs in LocalStorage
let inMemoryStudentsCache: Student[] = [...MOCK_STUDENTS];
let inMemorySocialCasesCache: SocialCaseRecord[] = [...MOCK_SOCIAL_CASES];
let inMemoryGrievancesCache: GrievanceRecord[] = [];
let inMemoryCalendarCache: AssessmentCalendarEvent[] = [];

// Safe Storage helpers
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
    autoSyncKeyToCloud(key, value);
  } catch (error) {
    // Non-blocking
  }
};

// Sync dynamic counts
const syncClassAndDepartmentCounts = (
  students: Student[],
  classes: SchoolClass[],
  departments: Department[]
): { classes: SchoolClass[]; departments: Department[] } => {
  const updatedClasses = classes.map((c) => ({
    ...c,
    studentCount: students.filter((s) => s.classId === c.id).length,
  }));

  const updatedDepartments = departments.map((d) => ({
    ...d,
    totalStudents: students.filter((s) => s.departmentId === d.id).length,
  }));

  return { classes: updatedClasses, departments: updatedDepartments };
};

// Initializer
export const initializeData = () => {
  if (typeof window === 'undefined') return;

  // Run Async Migration to Dexie IndexedDB
  runLocalStorageToIndexedDbMigration().then(async () => {
    try {
      const dbStudents = await db.students.toArray();
      if (dbStudents.length > 0) {
        inMemoryStudentsCache = dbStudents;
      }
      const dbCases = await db.social_cases.toArray();
      if (dbCases.length > 0) {
        inMemorySocialCasesCache = dbCases;
      }
      const dbGrievances = await db.grievances.toArray();
      if (dbGrievances.length > 0) {
        inMemoryGrievancesCache = dbGrievances;
      }
      const dbCalendar = await db.assessment_calendar.toArray();
      if (dbCalendar.length > 0) {
        inMemoryCalendarCache = dbCalendar;
      }
    } catch {
      // Non-blocking
    }
  });

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(MOCK_DEPARTMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(MOCK_ATTENDANCE_HISTORY));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTICES)) {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(MOCK_NOTICES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MOCK_USERS[0]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(SCHOOL_CONFIG));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TRANSFER_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSFER_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORKSHOP_VIOLATIONS)) {
    localStorage.setItem(STORAGE_KEYS.WORKSHOP_VIOLATIONS, JSON.stringify(MOCK_WORKSHOP_VIOLATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPETENCY_UNITS)) {
    localStorage.setItem(STORAGE_KEYS.COMPETENCY_UNITS, JSON.stringify(MOCK_COMPETENCY_UNITS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMPETENCY_ASSESSMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, JSON.stringify(MOCK_COMPETENCY_ASSESSMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED)) {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(false));
  }
};

export const sortArabicAlphabetically = (a: string, b: string): number => {
  return a.trim().localeCompare(b.trim(), 'ar', { sensitivity: 'base', numeric: true });
};

export const sortStudentsAlphabetically = (studentList: Student[]): Student[] => {
  return [...studentList].sort((a, b) => sortArabicAlphabetically(a.fullName, b.fullName));
};

// =========================================================================
// Getters
// =========================================================================

export const getCurrentUser = (): User => getStoredData(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]);
export const getUsers = (): User[] => getStoredData(STORAGE_KEYS.USERS, MOCK_USERS);

export const getStudents = (): Student[] => {
  return sortStudentsAlphabetically(inMemoryStudentsCache);
};

export const getDepartments = (): Department[] => getStoredData(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
export const getClasses = (): SchoolClass[] => getStoredData(STORAGE_KEYS.CLASSES, MOCK_CLASSES);
export const getAttendance = (): AttendanceRecord[] => getStoredData(STORAGE_KEYS.ATTENDANCE, MOCK_ATTENDANCE_HISTORY);
export const getNotices = (): OfficialNotice[] => getStoredData(STORAGE_KEYS.NOTICES, MOCK_NOTICES);

export const getSchoolConfig = (): SchoolConfig => {
  const cfg = getStoredData(STORAGE_KEYS.CONFIG, SCHOOL_CONFIG);
  return {
    ...cfg,
    minDaysForAttendanceWarning: cfg.minDaysForAttendanceWarning ?? 10,
    absenceOnePeriodCountsAsDay: cfg.absenceOnePeriodCountsAsDay ?? false,
    workshopRuleEnabled: cfg.workshopRuleEnabled ?? true,
    internalVerificationSampleRate: cfg.internalVerificationSampleRate ?? 15,
    warning1ConsecutiveDays: cfg.warning1ConsecutiveDays ?? 5,
    warning1TotalDays: cfg.warning1TotalDays ?? 10,
    warning2ConsecutiveDays: cfg.warning2ConsecutiveDays ?? 10,
    warning2TotalDays: cfg.warning2TotalDays ?? 20,
    expulsionConsecutiveDays: cfg.expulsionConsecutiveDays ?? 15,
    expulsionTotalDays: cfg.expulsionTotalDays ?? 30,
    reinstatementFeeAbsence: cfg.reinstatementFeeAbsence ?? 25,
    reinstatementFeeFailure: cfg.reinstatementFeeFailure ?? 35,
    fiveYearSystemEnabled: cfg.fiveYearSystemEnabled ?? false,
  };
};

export const getTransferLogs = (): StudentTransferLog[] => getStoredData(STORAGE_KEYS.TRANSFER_LOGS, []);
export const getWorkshopViolations = (): WorkshopViolationRecord[] => getStoredData(STORAGE_KEYS.WORKSHOP_VIOLATIONS, MOCK_WORKSHOP_VIOLATIONS);
export const getCompetencyUnits = (): CompetencyUnit[] => getStoredData(STORAGE_KEYS.COMPETENCY_UNITS, MOCK_COMPETENCY_UNITS);
export const getCompetencyAssessments = (): StudentCompetencyAssessment[] => getStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, MOCK_COMPETENCY_ASSESSMENTS);
export const getSocialCases = (): SocialCaseRecord[] => inMemorySocialCasesCache;
export const getGrievances = (): GrievanceRecord[] => inMemoryGrievancesCache;
export const getAssessmentCalendarEvents = (): AssessmentCalendarEvent[] => inMemoryCalendarCache;
export const getIsAuthenticated = (): boolean => getStoredData(STORAGE_KEYS.IS_AUTHENTICATED, false);

// =========================================================================
// Student Operations (Secure Dexie & Memory)
// =========================================================================

export const setStudentsSecure = (students: Student[]) => {
  inMemoryStudentsCache = sortStudentsAlphabetically(students);
  if (typeof window !== 'undefined') {
    db.students.bulkPut(inMemoryStudentsCache).catch(() => {});
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
  }
};

export const addStudent = (
  studentData: Omit<
    Student,
    | 'id'
    | 'totalAbsenceDays'
    | 'consecutiveAbsenceDays'
    | 'excusedAbsenceDays'
    | 'workshopAbsenceHours'
    | 'theoreticalAbsenceDays'
    | 'workshopEscapeCount'
    | 'warningLevel'
  > &
    Partial<Student>
) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const currentUser = getCurrentUser();

  const newStudent: Student = {
    ...studentData,
    id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    parentAccessCode: studentData.parentAccessCode || generateParentAccessCode(),
    totalAbsenceDays: 0,
    consecutiveAbsenceDays: 0,
    excusedAbsenceDays: 0,
    workshopAbsenceHours: 0,
    theoreticalAbsenceDays: 0,
    workshopEscapeCount: 0,
    warningLevel: 0,
    competencyStatus: 'eligible',
    updated_at: new Date().toISOString(),
    updated_by: currentUser.id,
  };

  const updatedStudents = sortStudentsAlphabetically([newStudent, ...students]);
  setStudentsSecure(updatedStudents);

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'student_added',
    entity: 'student',
    entityId: newStudent.id,
    newValue: { studentCode: newStudent.studentCode, classId: newStudent.classId },
  });

  return newStudent;
};

export const updateStudent = (studentData: Student) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const currentUser = getCurrentUser();

  const oldStudent = students.find((s) => s.id === studentData.id);
  const updatedStudent: Student = {
    ...studentData,
    updated_at: new Date().toISOString(),
    updated_by: currentUser.id,
  };

  const updatedStudents = sortStudentsAlphabetically(
    students.map((s) => (s.id === studentData.id ? updatedStudent : s))
  );
  setStudentsSecure(updatedStudents);

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'student_updated',
    entity: 'student',
    entityId: studentData.id,
    oldValue: oldStudent,
    newValue: updatedStudent,
  });
};

export const deleteStudent = (studentId: string) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const currentUser = getCurrentUser();

  const studentToDelete = students.find((s) => s.id === studentId);
  const updatedStudents = students.filter((s) => s.id !== studentId);
  setStudentsSecure(updatedStudents);

  if (typeof window !== 'undefined') {
    db.students.delete(studentId).catch(() => {});
  }

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  deleteRowFromCloud('students', studentId);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'student_deleted',
    entity: 'student',
    entityId: studentId,
    oldValue: studentToDelete,
  });
};

// =========================================================================
// Social Specialist Operations (Secure Dexie & Memory)
// =========================================================================

export const saveSocialCase = (caseData: Partial<SocialCaseRecord> & { studentId: string }) => {
  const cases = inMemorySocialCasesCache;
  const nowStr = new Date().toISOString();
  const todayDate = nowStr.split('T')[0];
  const currentUser = getCurrentUser();

  if (caseData.id) {
    const updated = cases.map((c) =>
      c.id === caseData.id
        ? ({
            ...c,
            ...caseData,
            updated_at: nowStr,
            updated_by: currentUser.id,
          } as SocialCaseRecord)
        : c
    );
    inMemorySocialCasesCache = updated;
    if (typeof window !== 'undefined') {
      db.social_cases.put(updated.find((c) => c.id === caseData.id)!).catch(() => {});
      window.dispatchEvent(new Event('egyptian_school_storage_update'));
    }

    logAuditEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      action: 'social_case_updated',
      entity: 'social_case',
      entityId: caseData.id,
      newValue: caseData,
    });

    return updated.find((c) => c.id === caseData.id);
  } else {
    const student = getStudents().find((s) => s.id === caseData.studentId);
    const classes = getClasses();
    const departments = getDepartments();
    const studentClass = classes.find((c) => c.id === (caseData.classId || student?.classId));
    const studentDept = departments.find((d) => d.id === (caseData.departmentId || student?.departmentId));

    const newCase: SocialCaseRecord = {
      id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: caseData.studentId,
      studentName: caseData.studentName || student?.fullName || 'طالب غير محدد',
      studentCode: caseData.studentCode || student?.studentCode || '',
      nationalId: caseData.nationalId || student?.nationalId || '',
      classId: caseData.classId || student?.classId || '',
      className: caseData.className || studentClass?.name || '',
      departmentId: caseData.departmentId || student?.departmentId || '',
      departmentName: caseData.departmentName || studentDept?.name || '',
      gradeLevel: (caseData.gradeLevel || student?.gradeLevel || 1) as any,
      guardianName: caseData.guardianName || student?.guardianName || '',
      guardianPhone: caseData.guardianPhone || student?.guardianPhone || '',
      address: caseData.address || student?.address || '',
      referralDate: caseData.referralDate || todayDate,
      referralSource: caseData.referralSource || 'early_warning',
      referralReason: caseData.referralReason || 'إحالة للدعم والإرشاد الاجتماعي والتربوي',
      riskScore: caseData.riskScore,
      riskLevel: caseData.riskLevel,
      riskFactors: caseData.riskFactors || [],
      status: caseData.status || 'pending',
      priority: caseData.priority || 'high',
      category: caseData.category || 'absence_dropout_risk',
      initialDiagnosis: caseData.initialDiagnosis || '',
      familyCircumstances: caseData.familyCircumstances || '',
      behavioralObservations: caseData.behavioralObservations || '',
      workshopAdaptation: caseData.workshopAdaptation || '',
      actionPlan: caseData.actionPlan || '',
      guardianContacted: caseData.guardianContacted || false,
      guardianContactDate: caseData.guardianContactDate,
      guardianNotes: caseData.guardianNotes || '',
      sessions: caseData.sessions || [],
      specialistNotes: caseData.specialistNotes || '',
      createdAt: nowStr,
      updated_at: nowStr,
      updated_by: currentUser.id,
    };

    inMemorySocialCasesCache = [newCase, ...cases];
    if (typeof window !== 'undefined') {
      db.social_cases.put(newCase).catch(() => {});
      window.dispatchEvent(new Event('egyptian_school_storage_update'));
    }

    logAuditEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      action: 'social_case_created',
      entity: 'social_case',
      entityId: newCase.id,
      newValue: { studentId: newCase.studentId, priority: newCase.priority, category: newCase.category },
    });

    return newCase;
  }
};

export const deleteSocialCase = (caseId: string) => {
  const currentUser = getCurrentUser();
  inMemorySocialCasesCache = inMemorySocialCasesCache.filter((c) => c.id !== caseId);
  if (typeof window !== 'undefined') {
    db.social_cases.delete(caseId).catch(() => {});
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
  }
  deleteRowFromCloud('social_cases', caseId);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'social_case_deleted',
    entity: 'social_case',
    entityId: caseId,
  });
};

export const referStudentToSocialSpecialist = (params: {
  student: Student;
  studentClass?: SchoolClass;
  department?: Department;
  reason: string;
  priority?: SocialCasePriority;
  category?: SocialCaseCategory;
  riskScore?: number;
  riskLevel?: 'critical' | 'high' | 'medium' | 'safe';
  riskFactors?: string[];
  source?: 'early_warning' | 'affairs' | 'teacher' | 'dept_head' | 'principal' | 'self' | 'ai_prediction';
  aiRiskScore?: number;
  aiRiskLevel?: string;
  aiRootCauses?: string[];
  aiRecommendations?: string[];
}): SocialCaseRecord => {
  const {
    student,
    studentClass,
    department,
    reason,
    priority = 'urgent',
    category = 'absence_dropout_risk',
    riskScore,
    riskLevel = 'critical',
    riskFactors = [],
    source = 'early_warning',
  } = params;

  const existingCases = getSocialCases();
  const existing = existingCases.find((c) => c.studentId === student.id && (c.status === 'pending' || c.status === 'in_progress'));

  if (existing) {
    const updated = saveSocialCase({
      ...existing,
      riskScore: riskScore ?? existing.riskScore,
      riskLevel: riskLevel ?? existing.riskLevel,
      riskFactors: Array.from(new Set([...(existing.riskFactors || []), ...riskFactors])),
      referralReason: `${existing.referralReason} | تحديث: ${reason}`,
      priority: priority,
    });
    return updated as SocialCaseRecord;
  }

  const newCase = saveSocialCase({
    studentId: student.id,
    studentName: student.fullName,
    studentCode: student.studentCode,
    nationalId: student.nationalId,
    classId: student.classId,
    className: studentClass?.name || '',
    departmentId: student.departmentId,
    departmentName: department?.name || '',
    gradeLevel: student.gradeLevel,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    address: student.address,
    referralSource: source,
    referralReason: reason,
    riskScore,
    riskLevel,
    riskFactors,
    status: 'pending',
    priority,
    category,
    initialDiagnosis: `إحالة من منظومة الإنذار المبكر وشئون الطلاب: ${reason}`,
    sessions: [],
  });

  return newCase as SocialCaseRecord;
};

export const addSocialCaseSession = (
  caseId: string,
  session: Omit<SocialSessionRecord, 'id' | 'createdAt'>
) => {
  const cases = getSocialCases();
  const targetCase = cases.find((c) => c.id === caseId);
  if (!targetCase) return null;

  const newSession: SocialSessionRecord = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    createdAt: new Date().toISOString(),
  };

  const updatedSessions = [newSession, ...(targetCase.sessions || [])];
  let newStatus = targetCase.status;
  if (newStatus === 'pending') newStatus = 'in_progress';
  if (session.outcome === 'improved') newStatus = 'resolved';

  return saveSocialCase({
    ...targetCase,
    status: newStatus,
    sessions: updatedSessions,
  });
};

// =========================================================================
// Grievances Management (سجل التظلمات)
// =========================================================================

export const saveGrievance = (grievance: Partial<GrievanceRecord> & { studentId: string; unitId: string; reason: string }) => {
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  if (grievance.id) {
    inMemoryGrievancesCache = inMemoryGrievancesCache.map((g) =>
      g.id === grievance.id
        ? ({
            ...g,
            ...grievance,
            updated_at: nowIso,
            updated_by: currentUser.id,
          } as GrievanceRecord)
        : g
    );
  } else {
    const newGrievance: GrievanceRecord = {
      id: `grv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: grievance.studentId,
      studentName: grievance.studentName || 'طالب',
      studentCode: grievance.studentCode,
      unitId: grievance.unitId,
      unitCode: grievance.unitCode,
      unitName: grievance.unitName || '',
      outcomeId: grievance.outcomeId,
      outcomeCode: grievance.outcomeCode,
      submissionDate: grievance.submissionDate || nowIso.split('T')[0],
      reason: grievance.reason,
      status: grievance.status || 'submitted',
      created_at: nowIso,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    inMemoryGrievancesCache = [newGrievance, ...inMemoryGrievancesCache];
  }

  if (typeof window !== 'undefined') {
    db.grievances.bulkPut(inMemoryGrievancesCache).catch(() => {});
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: grievance.id ? 'grievance_updated' : 'grievance_submitted',
    entity: 'grievance',
    entityId: grievance.id || inMemoryGrievancesCache[0].id,
    newValue: grievance,
  });

  return inMemoryGrievancesCache.find((g) => g.id === (grievance.id || inMemoryGrievancesCache[0].id));
};

export const decideGrievance = (
  grievanceId: string,
  decision: 'accepted' | 'rejected',
  notes: string,
  officerName: string
) => {
  const currentUser = getCurrentUser();
  const target = inMemoryGrievancesCache.find((g) => g.id === grievanceId);
  if (!target) return null;

  const updated = saveGrievance({
    ...target,
    status: decision,
    decision: notes,
    decisionDate: new Date().toISOString().split('T')[0],
    decidedBy: officerName,
  });

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'grievance_decided',
    entity: 'grievance',
    entityId: grievanceId,
    newValue: { decision, decidedBy: officerName, notes },
  });

  return updated;
};

// =========================================================================
// Assessment Calendar Management (التقويم الزمني للجدارات)
// =========================================================================

export const saveAssessmentCalendarEvent = (event: Partial<AssessmentCalendarEvent> & { title: string; eventType: any; startDate: string; endDate: string }) => {
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  if (event.id) {
    inMemoryCalendarCache = inMemoryCalendarCache.map((e) =>
      e.id === event.id
        ? ({
            ...e,
            ...event,
            updated_at: nowIso,
            updated_by: currentUser.id,
          } as AssessmentCalendarEvent)
        : e
    );
  } else {
    const newEvent: AssessmentCalendarEvent = {
      id: `cal_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: event.title,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description || '',
      targetGradeLevel: event.targetGradeLevel,
      departmentId: event.departmentId,
      createdBy: currentUser.name,
      created_at: nowIso,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    inMemoryCalendarCache = [newEvent, ...inMemoryCalendarCache];
  }

  if (typeof window !== 'undefined') {
    db.assessment_calendar.bulkPut(inMemoryCalendarCache).catch(() => {});
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'assessment_calendar_event_saved',
    entity: 'assessment_calendar',
    entityId: event.id || inMemoryCalendarCache[0].id,
    newValue: event,
  });
};

export const deleteAssessmentCalendarEvent = (eventId: string) => {
  const currentUser = getCurrentUser();
  inMemoryCalendarCache = inMemoryCalendarCache.filter((e) => e.id !== eventId);
  if (typeof window !== 'undefined') {
    db.assessment_calendar.delete(eventId).catch(() => {});
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'assessment_calendar_event_deleted',
    entity: 'assessment_calendar',
    entityId: eventId,
  });
};

// =========================================================================
// Auth & Users
// =========================================================================

export const login = (username: string, password?: string): { success: boolean; user?: User; error?: string } => {
  const users = getUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user) return { success: false, error: 'اسم المستخدم غير موجود' };
  if (user.password && password && user.password !== password.trim()) return { success: false, error: 'كلمة المرور غير صحيحة' };

  setCurrentUser(user);
  setStoredData(STORAGE_KEYS.IS_AUTHENTICATED, true);
  return { success: true, user };
};

export const logout = () => {
  setStoredData(STORAGE_KEYS.IS_AUTHENTICATED, false);
};

export const setCurrentUser = (user: User) => {
  setStoredData(STORAGE_KEYS.CURRENT_USER, user);
};

export const saveUser = (userData: Partial<User> & { name: string; username: string; role: any }) => {
  const users = getUsers();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  if (userData.id) {
    const updated = users.map((u) =>
      u.id === userData.id
        ? ({ ...u, ...userData, updated_at: nowIso, updated_by: currentUser.id } as User)
        : u
    );
    setStoredData(STORAGE_KEYS.USERS, updated);
  } else {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name,
      username: userData.username.toLowerCase().trim(),
      password: userData.password || '123',
      role: userData.role,
      roleTitle:
        userData.roleTitle ||
        (userData.role === 'principal'
          ? OFFICIAL_TERMS.ROLE_PRINCIPAL
          : userData.role === 'affairs_deputy'
          ? OFFICIAL_TERMS.ROLE_AFFAIRS_DEPUTY
          : userData.role === 'affairs_officer'
          ? OFFICIAL_TERMS.ROLE_AFFAIRS_OFFICER
          : userData.role === 'social_worker'
          ? OFFICIAL_TERMS.ROLE_SOCIAL_WORKER
          : userData.role === 'dept_head'
          ? OFFICIAL_TERMS.ROLE_DEPT_HEAD
          : userData.role === 'system_admin'
          ? OFFICIAL_TERMS.ROLE_SYSTEM_ADMIN
          : userData.role === 'external_verifier'
          ? OFFICIAL_TERMS.ROLE_EXTERNAL_VERIFIER
          : OFFICIAL_TERMS.ROLE_TEACHER),
      departmentId: userData.departmentId,
      assignedClassIds: userData.assignedClassIds || [],
      phone: userData.phone || '',
      isInternalVerifier: userData.isInternalVerifier || false,
      externalVerifierExpiresAt: userData.externalVerifierExpiresAt,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    setStoredData(STORAGE_KEYS.USERS, [...users, newUser]);
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: userData.id ? 'user_updated' : 'user_created',
    entity: 'user',
    entityId: userData.id || `user_${Date.now()}`,
    newValue: { username: userData.username, role: userData.role },
  });
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const currentUser = getCurrentUser();
  setStoredData(STORAGE_KEYS.USERS, users.filter((u) => u.id !== userId));
  deleteRowFromCloud('school_users', userId);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'user_deleted',
    entity: 'user',
    entityId: userId,
  });
};

// =========================================================================
// Dynamic Cumulative Attendance Calculator (قانون 139 لسنة 1981 ولائحة الجدارات)
// =========================================================================

export const calculateStudentAttendanceStats = (
  student: Student,
  customAttendanceHistory?: AttendanceRecord[],
  config?: SchoolConfig
): StudentDynamicAttendanceStats => {
  const allAttendance = customAttendanceHistory || getAttendance();
  const schoolConfig = config || getSchoolConfig();
  const practicalMinRate = schoolConfig.practicalMinAttendanceRate || 85;
  const theoreticalMinRate = schoolConfig.theoreticalMinAttendanceRate || 75;

  const studentRecords = allAttendance.filter((a) => a.studentId === student.id);

  if (studentRecords.length > 0) {
    const sortedRecords = [...studentRecords].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = sortedRecords[0]?.date;
    const lastDate = sortedRecords[sortedRecords.length - 1]?.date;

    const distinctDates = Array.from(new Set(sortedRecords.map((r) => r.date)));
    const totalRecordedDays = distinctDates.length;

    let presentDays = 0;
    let absentDays = 0;
    let excusedDays = 0;
    let lateDays = 0;
    let escapedDays = 0;

    distinctDates.forEach((d) => {
      const dayRecs = sortedRecords.filter((r) => r.date === d);
      const hasEscaped = dayRecs.some((r) => r.status === 'escaped');
      const hasAbsent = dayRecs.some((r) => r.status === 'absent');
      const hasExcused = dayRecs.some((r) => r.status === 'excused');
      const hasLate = dayRecs.some((r) => r.status === 'late');
      const hasPresent = dayRecs.some((r) => r.status === 'present');

      if (hasEscaped) {
        escapedDays++;
        absentDays++;
      } else if (hasAbsent) {
        absentDays++;
      } else if (hasExcused) {
        excusedDays++;
      } else if (hasLate) {
        lateDays++;
        presentDays++;
      } else if (hasPresent) {
        presentDays++;
      }
    });

    const workshopRecords = sortedRecords.filter((r) => r.periodType === 'workshop');
    const workshopRecordedSessions = workshopRecords.length;
    const workshopRecordedHours = workshopRecordedSessions * 6;

    const workshopPresentSessions = workshopRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
    const workshopPresentHours = workshopPresentSessions * 6;

    const workshopAbsentSessions = workshopRecords.filter((r) => r.status === 'absent' || r.status === 'escaped').length;
    const workshopAbsentHours = workshopAbsentSessions * 6;

    const attendanceRate = totalRecordedDays > 0 ? Math.round((presentDays / totalRecordedDays) * 100) : 100;
    const absenceRate = Math.max(0, 100 - attendanceRate);

    const workshopAttendanceRate = workshopRecordedHours > 0
      ? Math.round((workshopPresentHours / workshopRecordedHours) * 100)
      : (student.workshopAbsenceHours && student.workshopAbsenceHours > 0 ? Math.max(0, 100 - student.workshopAbsenceHours * 2) : 100);
    const workshopAbsenceRate = Math.max(0, 100 - workshopAttendanceRate);

    const minDays = schoolConfig.minDaysForAttendanceWarning ?? 10;
    const isUnderWarningThreshold = totalRecordedDays >= minDays && attendanceRate < theoreticalMinRate;

    return {
      studentId: student.id,
      totalRecordedDays,
      presentDays,
      actualAttendedDays: presentDays,
      absentDays,
      actualAbsenceDays: absentDays,
      excusedDays,
      lateDays,
      escapedDays,
      consecutiveAbsenceDays: student.consecutiveAbsenceDays || 0,
      attendanceRate,
      overallAttendanceRate: attendanceRate,
      absenceRate,
      workshopRecordedSessions,
      workshopRecordedHours,
      workshopPresentSessions,
      workshopPresentHours,
      workshopAbsentSessions,
      workshopAbsentHours,
      workshopAttendanceRate,
      workshopAbsenceRate,
      isPracticalEligible: workshopAttendanceRate >= practicalMinRate,
      isTheoreticalEligible: attendanceRate >= theoreticalMinRate,
      isUnderWarningThreshold,
      firstRecordedDate: firstDate,
      lastRecordedDate: lastDate,
    };
  }

  // Fallback: Compute from student counters
  const totalRecordedDays = student.totalRecordedDays || (student.totalAttendedDays !== undefined && student.totalAbsenceDays !== undefined ? student.totalAttendedDays + student.totalAbsenceDays : 0);
  const presentDays = student.totalAttendedDays !== undefined ? student.totalAttendedDays : (student.totalAbsenceDays ? Math.max(0, 30 - student.totalAbsenceDays) : 30);
  const absentDays = student.totalAbsenceDays || 0;
  const excused = student.excusedAbsenceDays || 0;
  const consec = student.consecutiveAbsenceDays || 0;
  const workshopAbsHours = student.workshopAbsenceHours || 0;
  const workshopPresentHours = student.workshopPresentHours !== undefined ? student.workshopPresentHours : Math.max(0, 40 - workshopAbsHours);
  const totalWorkshopHours = workshopPresentHours + workshopAbsHours || 40;

  const attendanceRate = student.attendanceRate !== undefined ? student.attendanceRate : (totalRecordedDays > 0 ? Math.round((presentDays / totalRecordedDays) * 100) : 100);
  const absenceRate = Math.max(0, 100 - attendanceRate);

  const workshopAttendanceRate = student.workshopAttendanceRate !== undefined ? student.workshopAttendanceRate : (totalWorkshopHours > 0 ? Math.round((workshopPresentHours / totalWorkshopHours) * 100) : 100);
  const workshopAbsenceRate = Math.max(0, 100 - workshopAttendanceRate);

  const minDays = schoolConfig.minDaysForAttendanceWarning ?? 10;
  const isUnderWarningThreshold = totalRecordedDays >= minDays && attendanceRate < theoreticalMinRate;

  return {
    studentId: student.id,
    totalRecordedDays,
    presentDays,
    actualAttendedDays: presentDays,
    absentDays,
    actualAbsenceDays: absentDays,
    excusedDays: excused,
    lateDays: 0,
    escapedDays: student.workshopEscapeCount || 0,
    consecutiveAbsenceDays: consec,
    attendanceRate,
    overallAttendanceRate: attendanceRate,
    absenceRate,
    workshopRecordedSessions: Math.ceil(totalWorkshopHours / 6),
    workshopRecordedHours: totalWorkshopHours,
    workshopPresentSessions: Math.ceil(workshopPresentHours / 6),
    workshopPresentHours,
    workshopAbsentSessions: Math.ceil(workshopAbsHours / 6),
    workshopAbsentHours: workshopAbsHours,
    workshopAttendanceRate,
    workshopAbsenceRate,
    isPracticalEligible: workshopAttendanceRate >= practicalMinRate,
    isTheoreticalEligible: attendanceRate >= theoreticalMinRate,
    isUnderWarningThreshold,
  };
};

export const saveClassAttendance = (
  classId: string,
  date: string,
  periodType: PeriodType,
  periodNumber: number,
  teacher: User,
  records: { studentId: string; status: AttendanceStatus; notes?: string }[]
): { success: boolean; newWarningsCreated: number } => {
  const currentAttendance = getAttendance();
  const currentStudents = getStudents();
  const currentNotices = getNotices();
  const currentClasses = getClasses();
  const schoolConfig = getSchoolConfig();
  const targetClass = currentClasses.find((c) => c.id === classId);

  const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dateObj = new Date(date);
  const dayOfWeek = daysArabic[dateObj.getDay()] || 'اليوم';

  let newWarningsCount = 0;
  const updatedRecords = [...currentAttendance];

  records.forEach((rec) => {
    const existingIndex = updatedRecords.findIndex(
      (r) =>
        r.studentId === rec.studentId &&
        r.date === date &&
        r.classId === classId &&
        r.periodNumber === periodNumber &&
        r.periodType === periodType
    );

    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date,
      dayOfWeek,
      periodType,
      periodNumber,
      classId,
      studentId: rec.studentId,
      status: rec.status,
      notes: rec.notes || '',
      recordedByTeacherId: teacher.id,
      recordedByTeacherName: teacher.name,
      timestamp: new Date().toISOString(),
      isVerifiedByAffairs: false,
      updated_at: new Date().toISOString(),
      updated_by: teacher.id,
    };

    if (existingIndex >= 0) {
      updatedRecords[existingIndex] = newRecord;
    } else {
      updatedRecords.push(newRecord);
    }
  });

  const updatedStudents = currentStudents.map((student) => {
    const studentSubmission = records.find((r) => r.studentId === student.id);
    if (!studentSubmission) return student;

    let totalAbs = student.totalAbsenceDays;
    let consecAbs = student.consecutiveAbsenceDays;
    let excused = student.excusedAbsenceDays;
    let workshopAbs = student.workshopAbsenceHours || 0;
    let escapeCount = student.workshopEscapeCount || 0;

    const isDayHoliday = studentSubmission.status === 'holiday';

    if (!isDayHoliday && studentSubmission.status === 'absent') {
      totalAbs += 1;
      consecAbs += 1;
      if (periodType === 'workshop') workshopAbs += 6;
    } else if (!isDayHoliday && studentSubmission.status === 'escaped') {
      totalAbs += 1;
      consecAbs += 1;
      escapeCount += 1;
      workshopAbs += 6;
    } else if (studentSubmission.status === 'present' || studentSubmission.status === 'late') {
      consecAbs = 0;
    } else if (studentSubmission.status === 'excused') {
      excused += 1;
      consecAbs = 0;
    }

    let warningLevel: 0 | 1 | 2 | 3 = student.warningLevel;
    let competencyStatus: 'eligible' | 'at_risk' | 'ineligible' | 'reassessment' =
      workshopAbs > 30 ? 'ineligible' : workshopAbs > 15 ? 'at_risk' : 'eligible';

    const expulsionConsec = schoolConfig.expulsionConsecutiveDays || 15;
    const expulsionTotal = schoolConfig.expulsionTotalDays || 30;
    const warn2Consec = schoolConfig.warning2ConsecutiveDays || 10;
    const warn2Total = schoolConfig.warning2TotalDays || 20;
    const warn1Consec = schoolConfig.warning1ConsecutiveDays || 5;
    const warn1Total = schoolConfig.warning1TotalDays || 10;

    if ((consecAbs >= expulsionConsec || totalAbs >= expulsionTotal) && warningLevel < 3) {
      warningLevel = 3;
      newWarningsCount++;
      const notice: OfficialNotice = {
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        studentCode: student.studentCode,
        departmentName: targetClass?.departmentName || '',
        className: targetClass?.name || '',
        noticeType: 'expulsion_notice',
        noticeTitle: OFFICIAL_TERMS.EXPULSION_ARTICLE_25,
        issueDate: date,
        consecutiveDays: consecAbs,
        totalDays: totalAbs,
        serialNumber: `ق/ف/${new Date().getFullYear()}/${String(currentNotices.length + newWarningsCount).padStart(3, '0')}`,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
        schoolName: schoolConfig.name,
        educationalDirectorate: schoolConfig.directorate,
        administration: schoolConfig.administration,
        isDelivered: false,
      };
      currentNotices.unshift(notice);
    } else if ((consecAbs >= warn2Consec || totalAbs >= warn2Total) && warningLevel < 2) {
      warningLevel = 2;
      newWarningsCount++;
      const notice: OfficialNotice = {
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        studentCode: student.studentCode,
        departmentName: targetClass?.departmentName || '',
        className: targetClass?.name || '',
        noticeType: 'warning_2',
        noticeTitle: OFFICIAL_TERMS.WARNING_LEVEL_2,
        issueDate: date,
        consecutiveDays: consecAbs,
        totalDays: totalAbs,
        serialNumber: `إ/2/${new Date().getFullYear()}/${String(currentNotices.length + newWarningsCount).padStart(3, '0')}`,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
        schoolName: schoolConfig.name,
        educationalDirectorate: schoolConfig.directorate,
        administration: schoolConfig.administration,
        isDelivered: false,
      };
      currentNotices.unshift(notice);
    } else if ((consecAbs >= warn1Consec || totalAbs >= warn1Total) && warningLevel < 1) {
      warningLevel = 1;
      newWarningsCount++;
      const notice: OfficialNotice = {
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        studentCode: student.studentCode,
        departmentName: targetClass?.departmentName || '',
        className: targetClass?.name || '',
        noticeType: 'warning_1',
        noticeTitle: OFFICIAL_TERMS.WARNING_LEVEL_1,
        issueDate: date,
        consecutiveDays: consecAbs,
        totalDays: totalAbs,
        serialNumber: `إ/1/${new Date().getFullYear()}/${String(currentNotices.length + newWarningsCount).padStart(3, '0')}`,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
        schoolName: schoolConfig.name,
        educationalDirectorate: schoolConfig.directorate,
        administration: schoolConfig.administration,
        isDelivered: false,
      };
      currentNotices.unshift(notice);
    }

    return {
      ...student,
      totalAbsenceDays: totalAbs,
      consecutiveAbsenceDays: consecAbs,
      excusedAbsenceDays: excused,
      workshopAbsenceHours: workshopAbs,
      workshopEscapeCount: escapeCount,
      warningLevel,
      competencyStatus,
      lastAbsenceDate: studentSubmission.status === 'absent' || studentSubmission.status === 'escaped' ? date : student.lastAbsenceDate,
    };
  });

  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedRecords);
  setStudentsSecure(updatedStudents);
  if (newWarningsCount > 0) {
    setStoredData(STORAGE_KEYS.NOTICES, currentNotices);
  }

  logAuditEvent({
    actorId: teacher.id,
    actorName: teacher.name,
    action: 'attendance_recorded',
    entity: 'attendance',
    entityId: classId,
    newValue: { date, periodType, periodNumber, count: records.length, newWarningsCount },
  });

  return { success: true, newWarningsCreated: newWarningsCount };
};

export const saveWeeklyClassAttendance = (
  classId: string,
  weekDays: { date: string; dayOfWeek: string }[],
  periodType: 'workshop' | 'theoretical',
  periodNumber: number,
  teacher: User,
  records: {
    studentId: string;
    dayStatuses: Record<string, AttendanceStatus | undefined | null | ''>;
  }[]
): { success: boolean; newWarningsCreated: number } => {
  const currentAttendance = getAttendance();
  const currentStudents = getStudents();
  const currentNotices = getNotices();
  const currentClasses = getClasses();
  const schoolConfig = getSchoolConfig();
  const targetClass = currentClasses.find((c) => c.id === classId);

  let newWarningsCount = 0;
  const updatedRecords = [...currentAttendance];

  records.forEach((studentRec) => {
    weekDays.forEach((day) => {
      const status = studentRec.dayStatuses[day.date];
      const existingIndex = updatedRecords.findIndex(
        (r) =>
          r.studentId === studentRec.studentId &&
          r.date === day.date &&
          r.classId === classId &&
          r.periodNumber === periodNumber &&
          r.periodType === periodType
      );

      if (status && status !== ('unrecorded' as any)) {
        const newRecord: AttendanceRecord = {
          id: existingIndex >= 0 ? updatedRecords[existingIndex].id : `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          periodType,
          periodNumber,
          classId,
          studentId: studentRec.studentId,
          status: status as AttendanceStatus,
          notes: '',
          recordedByTeacherId: teacher.id,
          recordedByTeacherName: teacher.name,
          timestamp: new Date().toISOString(),
          isVerifiedByAffairs: false,
        };

        if (existingIndex >= 0) {
          updatedRecords[existingIndex] = newRecord;
        } else {
          updatedRecords.push(newRecord);
        }
      } else if (existingIndex >= 0) {
        updatedRecords.splice(existingIndex, 1);
      }
    });
  });

  const updatedStudents = currentStudents.map((student) => {
    const studentSubmission = records.find((r) => r.studentId === student.id);
    if (!studentSubmission) return student;

    let weekAbsences = 0;
    let weekExcused = 0;
    let lastStatus: AttendanceStatus = 'present';
    let lastDate = student.lastAbsenceDate;

    weekDays.forEach((day) => {
      const st = studentSubmission.dayStatuses[day.date];
      if (st !== 'holiday' && (st === 'absent' || st === 'escaped')) {
        weekAbsences += 1;
        lastDate = day.date;
      } else if (st === 'excused') {
        weekExcused += 1;
      }
      if (st) lastStatus = st;
    });

    let totalAbs = student.totalAbsenceDays + weekAbsences;
    const isLastAbsent = (lastStatus as string) === 'absent' || (lastStatus as string) === 'escaped';
    let consecAbs = isLastAbsent ? student.consecutiveAbsenceDays + weekAbsences : 0;
    let excused = student.excusedAbsenceDays + weekExcused;
    let workshopAbs = (student.workshopAbsenceHours || 0) + (periodType === 'workshop' ? weekAbsences * 6 : 0);
    let escapeCount = student.workshopEscapeCount || 0;

    let warningLevel: 0 | 1 | 2 | 3 = student.warningLevel;
    let competencyStatus: 'eligible' | 'at_risk' | 'ineligible' | 'reassessment' =
      workshopAbs > 30 ? 'ineligible' : workshopAbs > 15 ? 'at_risk' : 'eligible';

    if ((consecAbs >= 15 || totalAbs >= 30) && warningLevel < 3) {
      warningLevel = 3;
      newWarningsCount++;
      const notice: OfficialNotice = {
        id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        studentCode: student.studentCode,
        departmentName: targetClass?.departmentName || '',
        className: targetClass?.name || '',
        noticeType: 'expulsion_notice',
        noticeTitle: OFFICIAL_TERMS.EXPULSION_ARTICLE_25,
        issueDate: weekDays[weekDays.length - 1]?.date || new Date().toISOString().split('T')[0],
        consecutiveDays: consecAbs,
        totalDays: totalAbs,
        serialNumber: `ق/ف/${new Date().getFullYear()}/${String(currentNotices.length + newWarningsCount).padStart(3, '0')}`,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
        schoolName: schoolConfig.name,
        educationalDirectorate: schoolConfig.directorate,
        administration: schoolConfig.administration,
        isDelivered: false,
      };
      currentNotices.unshift(notice);
    }

    return {
      ...student,
      totalAbsenceDays: totalAbs,
      consecutiveAbsenceDays: consecAbs,
      excusedAbsenceDays: excused,
      workshopAbsenceHours: workshopAbs,
      workshopEscapeCount: escapeCount,
      warningLevel,
      competencyStatus,
      lastAbsenceDate: lastDate,
    };
  });

  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedRecords);
  setStudentsSecure(updatedStudents);
  if (newWarningsCount > 0) {
    setStoredData(STORAGE_KEYS.NOTICES, currentNotices);
  }

  logAuditEvent({
    actorId: teacher.id,
    actorName: teacher.name,
    action: 'weekly_attendance_recorded',
    entity: 'attendance',
    entityId: classId,
    newValue: { periodType, periodNumber, count: records.length },
  });

  return { success: true, newWarningsCreated: newWarningsCount };
};

export const approveStudentExcuse = (
  studentId: string,
  date: string,
  reason: string,
  affairsOfficerName: string
) => {
  const attendance = getAttendance();
  const students = getStudents();
  const currentUser = getCurrentUser();

  const updatedAttendance = attendance.map((rec) => {
    if (rec.studentId === studentId && rec.date === date) {
      return {
        ...rec,
        status: 'excused' as AttendanceStatus,
        isVerifiedByAffairs: true,
        officialExcuseReason: `${reason} (اعتماد: ${affairsOfficerName})`,
      };
    }
    return rec;
  });

  const updatedStudents = students.map((std) => {
    if (std.id === studentId) {
      return {
        ...std,
        totalAbsenceDays: Math.max(0, std.totalAbsenceDays - 1),
        consecutiveAbsenceDays: 0,
        excusedAbsenceDays: std.excusedAbsenceDays + 1,
      };
    }
    return std;
  });

  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedAttendance);
  setStudentsSecure(updatedStudents);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: affairsOfficerName,
    action: 'excuse_approved',
    entity: 'student_excuse',
    entityId: studentId,
    newValue: { date, reason, affairsOfficerName },
  });
};

export const reinstateStudent = (studentId: string, receiptNumber: string, feeAmount?: number) => {
  const students = getStudents();
  const schoolConfig = getSchoolConfig();
  const currentUser = getCurrentUser();
  const fee = feeAmount || schoolConfig.reinstatementFeeAbsence || 25;

  const updatedStudents = students.map((std) => {
    if (std.id === studentId) {
      return {
        ...std,
        consecutiveAbsenceDays: 0,
        warningLevel: 0 as const,
        notes: `تمت إعادة القيد بتاريخ ${new Date().toLocaleDateString('ar-EG')} بإيصال 33 ع.ح رقم (${receiptNumber}) وسداد رسم ${fee} ج.م (المادة 25 من قانون 139/1981)`,
      };
    }
    return std;
  });

  setStudentsSecure(updatedStudents);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'student_reinstated',
    entity: 'student',
    entityId: studentId,
    newValue: { receiptNumber, feeAmount: fee },
  });
};

// =========================================================================
// Competencies & Assessments CRUD with Audit
// =========================================================================

export const saveCompetencyAssessment = (assessment: Partial<StudentCompetencyAssessment> & { studentId: string; unitId: string; outcomeId: string; result: any }) => {
  const assessments = getCompetencyAssessments();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  const existingIdx = assessments.findIndex(
    (a) => a.studentId === assessment.studentId && a.unitId === assessment.unitId && a.outcomeId === assessment.outcomeId
  );

  let updatedList = [...assessments];
  let finalRecord: StudentCompetencyAssessment;

  if (existingIdx >= 0) {
    finalRecord = {
      ...assessments[existingIdx],
      ...assessment,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    updatedList[existingIdx] = finalRecord;
  } else {
    finalRecord = {
      id: `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: assessment.studentId,
      studentName: assessment.studentName || '',
      nationalId: assessment.nationalId,
      studentCode: assessment.studentCode,
      classId: assessment.classId || '',
      departmentId: assessment.departmentId || '',
      gradeLevel: assessment.gradeLevel || 1,
      unitId: assessment.unitId,
      unitCode: assessment.unitCode || '',
      unitName: assessment.unitName || '',
      outcomeId: assessment.outcomeId,
      outcomeCode: assessment.outcomeCode || '',
      outcomeTitle: assessment.outcomeTitle || '',
      result: assessment.result,
      hasPerformanceEvidence: assessment.hasPerformanceEvidence,
      hasProductEvidence: assessment.hasProductEvidence,
      hasKnowledgeEvidence: assessment.hasKnowledgeEvidence,
      firstAttemptDate: assessment.firstAttemptDate || nowIso.split('T')[0],
      assessorTeacherName: assessment.assessorTeacherName || currentUser.name,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    updatedList.unshift(finalRecord);
  }

  setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, updatedList);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'competency_assessment_saved',
    entity: 'competency_assessment',
    entityId: finalRecord.id,
    newValue: { unitId: finalRecord.unitId, outcomeId: finalRecord.outcomeId, result: finalRecord.result },
  });

  return finalRecord;
};

export const bulkSaveCompetencyAssessments = (assessmentsList: StudentCompetencyAssessment[]) => {
  const current = getCompetencyAssessments();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  const updatedMap = new Map<string, StudentCompetencyAssessment>();
  current.forEach((a) => updatedMap.set(`${a.studentId}_${a.unitId}_${a.outcomeId}`, a));

  assessmentsList.forEach((a) => {
    const key = `${a.studentId}_${a.unitId}_${a.outcomeId}`;
    updatedMap.set(key, { ...a, updated_at: nowIso, updated_by: currentUser.id });
  });

  const updatedList = Array.from(updatedMap.values());
  setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, updatedList);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'bulk_competency_assessments_saved',
    entity: 'competency_assessment',
    newValue: { count: assessmentsList.length },
  });
};

export const saveCompetencyUnit = (
  unit: Partial<CompetencyUnit> & { code: string; name: string; departmentId: string }
): CompetencyUnit => {
  const units = getCompetencyUnits();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  let finalUnit: CompetencyUnit;

  if (unit.id) {
    finalUnit = {
      ...units.find((u) => u.id === unit.id)!,
      ...unit,
      updated_at: nowIso,
      updated_by: currentUser.id,
    } as CompetencyUnit;
    const updated = units.map((u) => (u.id === unit.id ? finalUnit : u));
    setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, updated);
  } else {
    finalUnit = {
      id: `unit_${Date.now()}`,
      code: unit.code,
      name: unit.name,
      category: unit.category || 'technical_core',
      departmentId: unit.departmentId,
      gradeLevel: unit.gradeLevel || 1,
      term: unit.term || 'term_1',
      outcomesCount: unit.outcomes?.length || unit.outcomesCount || 2,
      totalHours: unit.totalHours || 36,
      outcomes: unit.outcomes || [],
      description: unit.description || '',
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, [...units, finalUnit]);
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: unit.id ? 'competency_unit_updated' : 'competency_unit_created',
    entity: 'competency_unit',
    entityId: finalUnit.id,
    newValue: { code: finalUnit.code, name: finalUnit.name },
  });

  return finalUnit;
};

export const deleteCompetencyUnit = (unitId: string) => {
  const units = getCompetencyUnits();
  setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, units.filter((u) => u.id !== unitId));
  deleteRowFromCloud('competency_units', unitId);
};

export const getVerificationRecords = (): CompetencyVerificationRecord[] => getStoredData(STORAGE_KEYS.COMPETENCY_VERIFICATIONS, MOCK_COMPETENCY_VERIFICATIONS);
export const saveVerificationRecord = (record: Partial<CompetencyVerificationRecord> & { unitId: string; departmentId: string }) => {
  const records = getVerificationRecords();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  if (record.id) {
    const updated = records.map((r) =>
      r.id === record.id ? ({ ...r, ...record, updated_at: nowIso, updated_by: currentUser.id } as CompetencyVerificationRecord) : r
    );
    setStoredData(STORAGE_KEYS.COMPETENCY_VERIFICATIONS, updated);
  } else {
    const newRecord: CompetencyVerificationRecord = {
      id: `ver_${Date.now()}`,
      verificationType: record.verificationType || 'internal',
      unitId: record.unitId,
      unitName: record.unitName || '',
      unitCode: record.unitCode || '',
      departmentId: record.departmentId,
      departmentName: record.departmentName || '',
      gradeLevel: record.gradeLevel || 1,
      date: record.date || nowIso.split('T')[0],
      verifierName: record.verifierName || currentUser.name,
      verifierRole: record.verifierRole || 'internal_verifier',
      totalStudentsAudited: record.totalStudentsAudited || 0,
      samplePercentage: record.samplePercentage || 15,
      sampleRandomSeed: record.sampleRandomSeed,
      sampleStudentIds: record.sampleStudentIds || [],
      sampleStudentNames: record.sampleStudentNames || [],
      status: record.status || 'conforming',
      assessorDecisionAgreed: record.assessorDecisionAgreed ?? true,
      correctiveActions: record.correctiveActions,
      feedbackNotes: record.feedbackNotes || '',
      externalInterviewNotes: record.externalInterviewNotes,
      isSigned: record.isSigned ?? true,
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    setStoredData(STORAGE_KEYS.COMPETENCY_VERIFICATIONS, [newRecord, ...records]);
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'verification_record_saved',
    entity: 'verification_record',
    entityId: record.id || `ver_${Date.now()}`,
    newValue: { unitId: record.unitId, samplePercentage: record.samplePercentage, seed: record.sampleRandomSeed },
  });
};

export const deleteVerificationRecord = (id: string) => {
  const records = getVerificationRecords();
  setStoredData(STORAGE_KEYS.COMPETENCY_VERIFICATIONS, records.filter((r) => r.id !== id));
};

export const getStudentPortfolios = (): StudentPortfolioRecord[] => getStoredData(STORAGE_KEYS.STUDENT_PORTFOLIOS, MOCK_STUDENT_PORTFOLIOS);
export const saveStudentPortfolio = (portfolio: StudentPortfolioRecord) => {
  const portfolios = getStudentPortfolios();
  const existingIdx = portfolios.findIndex((p) => p.studentId === portfolio.studentId);
  const nowIso = new Date().toISOString();
  const currentUser = getCurrentUser();

  let updated = [...portfolios];
  if (existingIdx >= 0) {
    updated[existingIdx] = { ...portfolio, updated_at: nowIso, updated_by: currentUser.id };
  } else {
    updated.unshift({ ...portfolio, updated_at: nowIso, updated_by: currentUser.id });
  }
  setStoredData(STORAGE_KEYS.STUDENT_PORTFOLIOS, updated);
};

// =========================================================================
// Departments & Classes Operations
// =========================================================================

export const saveDepartment = (dept: Partial<Department> & { name: string }) => {
  const departments = getDepartments();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  if (dept.id) {
    const updatedDepartments = departments.map((d) => (d.id === dept.id ? ({ ...d, ...dept, updated_at: nowIso, updated_by: currentUser.id } as Department) : d));
    setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  } else {
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      name: dept.name,
      code: dept.code || `DEP-${Math.floor(100 + Math.random() * 900)}`,
      description: dept.description || '',
      scientificSupervisorName: dept.scientificSupervisorName || '',
      practicalSupervisorName: dept.practicalSupervisorName || '',
      headPhone: dept.headPhone || '',
      iconName: dept.iconName || 'Wrench',
      totalStudents: 0,
      workshopCount: dept.workshopCount || 2,
      availableGrades: dept.availableGrades || [1, 2, 3],
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    setStoredData(STORAGE_KEYS.DEPARTMENTS, [...departments, newDept]);
  }
};

export const deleteDepartment = (deptId: string) => {
  const departments = getDepartments();
  setStoredData(STORAGE_KEYS.DEPARTMENTS, departments.filter((d) => d.id !== deptId));
  deleteRowFromCloud('departments', deptId);
};

export const saveClass = (cls: Partial<SchoolClass> & { name: string; departmentId: string }) => {
  const classes = getClasses();
  const departments = getDepartments();
  const dept = departments.find((d) => d.id === cls.departmentId);
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  const gradeNameMap: Record<number, string> = {
    1: 'الصف الأول الصناعي',
    2: 'الصف الثاني الصناعي',
    3: 'الصف الثالث الصناعي (دبلوم)',
    4: 'الفرقة الرابعة المتقدمة (5 سنوات)',
    5: 'الفرقة الخامسة (دبلوم متقدم 5 سنوات)',
  };

  if (cls.id) {
    const updatedClasses = classes.map((c) =>
      c.id === cls.id
        ? ({
            ...c,
            ...cls,
            departmentName: dept?.name || c.departmentName,
            gradeName: cls.gradeLevel ? gradeNameMap[cls.gradeLevel] || c.gradeName : c.gradeName,
            updated_at: nowIso,
            updated_by: currentUser.id,
          } as SchoolClass)
        : c
    );
    setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  } else {
    const newClass: SchoolClass = {
      id: `class_${Date.now()}`,
      name: cls.name,
      gradeLevel: cls.gradeLevel || 1,
      gradeName: gradeNameMap[cls.gradeLevel || 1] || 'الصف الأول الصناعي',
      departmentId: cls.departmentId,
      departmentName: dept?.name || 'تخصص عام',
      supervisorTeacherId: cls.supervisorTeacherId || 'user_officer',
      supervisorTeacherName: cls.supervisorTeacherName || 'المعلم المشرف',
      roomNumber: cls.roomNumber || 'ورشة 1',
      studentCount: 0,
      shift: cls.shift || 'morning',
      updated_at: nowIso,
      updated_by: currentUser.id,
    };
    setStoredData(STORAGE_KEYS.CLASSES, [...classes, newClass]);
  }
};

export const deleteClass = (classId: string) => {
  const classes = getClasses();
  setStoredData(STORAGE_KEYS.CLASSES, classes.filter((c) => c.id !== classId));
  deleteRowFromCloud('classes', classId);
};

export const updateSchoolConfig = (newConfig: SchoolConfig) => {
  const currentUser = getCurrentUser();
  const updated = {
    ...newConfig,
    updated_at: new Date().toISOString(),
    updated_by: currentUser.id,
  };
  setStoredData(STORAGE_KEYS.CONFIG, updated);
  if (typeof window !== 'undefined') {
    db.school_settings.put(updated).catch(() => {});
  }

  logAuditEvent({
    actorId: currentUser.id,
    actorName: currentUser.name,
    action: 'school_settings_updated',
    entity: 'school_config',
    newValue: { name: newConfig.name, minDays: newConfig.minDaysForAttendanceWarning },
  });
};

// =========================================================================
// Workshop Violations
// =========================================================================

export const logWorkshopViolation = (violation: Omit<WorkshopViolationRecord, 'id'>) => {
  const violations = getWorkshopViolations();
  const students = getStudents();
  const currentUser = getCurrentUser();
  const nowIso = new Date().toISOString();

  const newRecord: WorkshopViolationRecord = {
    ...violation,
    id: `viol_${Date.now()}`,
    updated_at: nowIso,
    updated_by: currentUser.id,
  };

  if (violation.violationType === 'workshop_escape') {
    const updatedStudents = students.map((s) => {
      if (s.id === violation.studentId) {
        return {
          ...s,
          workshopEscapeCount: (s.workshopEscapeCount || 0) + 1,
          workshopAbsenceHours: (s.workshopAbsenceHours || 0) + 6,
          totalAbsenceDays: s.totalAbsenceDays + 1,
          competencyStatus: s.workshopAbsenceHours + 6 > 20 ? ('at_risk' as const) : s.competencyStatus,
        };
      }
      return s;
    });
    setStudentsSecure(updatedStudents);
  }

  setStoredData(STORAGE_KEYS.WORKSHOP_VIOLATIONS, [newRecord, ...violations]);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: violation.instructorName || currentUser.name,
    action: 'workshop_violation_logged',
    entity: 'workshop_violation',
    entityId: newRecord.id,
    newValue: { violationType: violation.violationType, studentId: violation.studentId },
  });

  return newRecord;
};

export const deleteWorkshopViolation = (violationId: string) => {
  const violations = getWorkshopViolations();
  setStoredData(
    STORAGE_KEYS.WORKSHOP_VIOLATIONS,
    violations.filter((v) => v.id !== violationId)
  );
  deleteRowFromCloud('workshop_violations', violationId);
};

// =========================================================================
// Student Affairs Helpers & Transfer Operations
// =========================================================================

export const isHolidayDate = (
  dateStr: string,
  configOrHolidays?: SchoolConfig | Holiday[]
): { isHoliday: boolean; holiday?: Holiday } => {
  let holidays: Holiday[] = [];
  if (Array.isArray(configOrHolidays)) {
    holidays = configOrHolidays;
  } else if (configOrHolidays && configOrHolidays.holidays) {
    holidays = configOrHolidays.holidays;
  } else {
    const config = getSchoolConfig();
    holidays = config.holidays || [];
  }
  const matched = holidays.find((h) => dateStr >= h.startDate && dateStr <= h.endDate);
  return {
    isHoliday: !!matched,
    holiday: matched,
  };
};

export const checkStudentDuplicate = (
  data: { nationalId?: string; studentCode?: string; fullName?: string; id?: string } | string,
  secondArg?: Student[] | string,
  excludeStudentId?: string
): {
  hasDuplicate: boolean;
  isDuplicateNid?: boolean;
  isDuplicateCode?: boolean;
  field?: 'nationalId' | 'studentCode' | 'fullName';
  message?: string;
  duplicateStudent?: Student;
} => {
  const students = Array.isArray(secondArg) ? secondArg : getStudents();
  let nid = '';
  let code = '';
  let excludeId = excludeStudentId;

  if (typeof data === 'object') {
    nid = data.nationalId ? data.nationalId.trim() : '';
    code = data.studentCode ? data.studentCode.trim() : '';
    excludeId = data.id || excludeStudentId;
  } else if (typeof data === 'string') {
    nid = data.trim();
    code = typeof secondArg === 'string' ? secondArg.trim() : '';
  }

  if (nid) {
    const dupNid = students.find((s) => s.nationalId === nid && s.id !== excludeId);
    if (dupNid) {
      return {
        hasDuplicate: true,
        isDuplicateNid: true,
        field: 'nationalId',
        message: `الرقم القومي (${nid}) مسجل مسبقاً للطالب: ${dupNid.fullName}`,
        duplicateStudent: dupNid,
      };
    }
  }

  if (code) {
    const dupCode = students.find((s) => s.studentCode === code && s.id !== excludeId);
    if (dupCode) {
      return {
        hasDuplicate: true,
        isDuplicateCode: true,
        field: 'studentCode',
        message: `كود الطالب (${code}) مسجل مسبقاً للطالب: ${dupCode.fullName}`,
        duplicateStudent: dupCode,
      };
    }
  }

  return {
    hasDuplicate: false,
    isDuplicateNid: false,
    isDuplicateCode: false,
  };
};

export const transferStudent = (
  param1:
    | {
        studentId: string;
        toClassId: string;
        toClassName?: string;
        toDeptId: string;
        toDeptName?: string;
        reason: string;
        officerName?: string;
      }
    | string,
  targetDeptId?: string,
  targetClassId?: string,
  reason?: string,
  officerName?: string
): boolean => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const currentUser = getCurrentUser();
  const transferLogs = getTransferLogs();

  let studentId = '';
  let toClassId = '';
  let toDeptId = '';
  let transferReason = '';
  let officer = currentUser.name;

  if (typeof param1 === 'object') {
    studentId = param1.studentId;
    toClassId = param1.toClassId;
    toDeptId = param1.toDeptId;
    transferReason = param1.reason;
    officer = param1.officerName || currentUser.name;
  } else {
    studentId = param1;
    toDeptId = targetDeptId || '';
    toClassId = targetClassId || '';
    transferReason = reason || '';
    officer = officerName || currentUser.name;
  }

  const student = students.find((s) => s.id === studentId);
  if (!student) return false;

  const fromClass = classes.find((c) => c.id === student.classId);
  const fromDept = departments.find((d) => d.id === student.departmentId);
  const toClass = classes.find((c) => c.id === toClassId);
  const toDept = departments.find((d) => d.id === toDeptId);

  const logEntry: StudentTransferLog = {
    id: `transfer_${Date.now()}`,
    studentId: student.id,
    fromClassId: student.classId,
    fromClassName: fromClass ? fromClass.name : '',
    fromDeptId: student.departmentId,
    fromDeptName: fromDept ? fromDept.name : '',
    toClassId: toClassId,
    toClassName: toClass ? toClass.name : '',
    toDeptId: toDeptId,
    toDeptName: toDept ? toDept.name : '',
    date: new Date().toISOString().split('T')[0],
    reason: transferReason,
    officerName: officer,
    updated_at: new Date().toISOString(),
    updated_by: currentUser.id,
  };

  const updatedStudents = students.map((s) => {
    if (s.id === student.id) {
      return {
        ...s,
        classId: toClassId,
        departmentId: toDeptId,
        gradeLevel: toClass?.gradeLevel || s.gradeLevel,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id,
      };
    }
    return s;
  });

  setStudentsSecure(updatedStudents);
  setStoredData(STORAGE_KEYS.TRANSFER_LOGS, [logEntry, ...transferLogs]);

  logAuditEvent({
    actorId: currentUser.id,
    actorName: officer,
    action: 'student_transferred',
    entity: 'student',
    entityId: student.id,
    newValue: { fromClassId: student.classId, toClassId, reason: transferReason },
  });

  return true;
};

export const autoFixSwappedStudentFields = (): { fixedCount: number } => {
  const students = getStudents();
  let fixedCount = 0;
  const updated = students.map((s) => {
    if (s.studentCode && s.studentCode.length === 14 && /^\d+$/.test(s.studentCode) && s.nationalId && s.nationalId.length < 14) {
      fixedCount++;
      return {
        ...s,
        nationalId: s.studentCode,
        studentCode: s.nationalId,
      };
    }
    return s;
  });

  if (fixedCount > 0) {
    setStudentsSecure(updated);
  }
  return { fixedCount };
};

// =========================================================================
// Assessment Calendar Alias
// =========================================================================
export const getAssessmentCalendar = getAssessmentCalendarEvents;

// =========================================================================
// Daily Census Engine (سجل 5 مواظبة والإحصاء الصباحي)
// =========================================================================

export const calculateDailyCensus = (
  selectedDate?: string,
  customAttendance?: AttendanceRecord[]
): DailyMorningCensus => {
  const date = selectedDate || new Date().toISOString().split('T')[0];
  const students = getStudents();
  const departments = getDepartments();
  const attendance = customAttendance || getAttendance();

  const activeStudents = students.filter(
    (s) => s.status !== 'expelled' && s.status !== 'transferred' && s.status !== 'graduated'
  );
  const dayRecords = attendance.filter((a) => a.date === date);

  let totalEnrolled = activeStudents.length;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalLate = 0;
  let totalEscaped = 0;

  activeStudents.forEach((st) => {
    const stRec = dayRecords.find((r) => r.studentId === st.id);
    if (!stRec || stRec.status === 'present') {
      totalPresent++;
    } else if (stRec.status === 'absent') {
      totalAbsent++;
    } else if (stRec.status === 'late') {
      totalLate++;
      totalPresent++;
    } else if (stRec.status === 'escaped') {
      totalEscaped++;
    } else if (stRec.status === 'excused') {
      totalAbsent++;
    }
  });

  const overallAttendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 100;

  const gradeNames: Record<number, string> = {
    1: 'الصف الأول',
    2: 'الصف الثاني',
    3: 'الصف الثالث',
    4: 'الصف الرابع',
    5: 'الصف الخامس',
  };

  const byGrade: DailyMorningCensus['byGrade'] = ([1, 2, 3, 4, 5] as const)
    .map((g) => {
      const gradeStudents = activeStudents.filter((s) => s.gradeLevel === g);
      const gEnrolled = gradeStudents.length;
      let gPresent = 0;
      gradeStudents.forEach((st) => {
        const rec = dayRecords.find((r) => r.studentId === st.id);
        if (!rec || rec.status === 'present' || rec.status === 'late') gPresent++;
      });
      const gAbsent = gEnrolled - gPresent;
      const gRate = gEnrolled > 0 ? Math.round((gPresent / gEnrolled) * 100) : 100;
      return {
        gradeLevel: g,
        gradeName: gradeNames[g] || `الصف ${g}`,
        enrolled: gEnrolled,
        present: gPresent,
        absent: gAbsent,
        rate: gRate,
      };
    })
    .filter((g) => g.enrolled > 0);

  const byDepartment: DailyMorningCensus['byDepartment'] = departments.map((d) => {
    const deptStudents = activeStudents.filter((s) => s.departmentId === d.id);
    const dEnrolled = deptStudents.length;
    let dPresent = 0;
    deptStudents.forEach((st) => {
      const rec = dayRecords.find((r) => r.studentId === st.id);
      if (!rec || rec.status === 'present' || rec.status === 'late') dPresent++;
    });
    const dAbsent = dEnrolled - dPresent;
    const dRate = dEnrolled > 0 ? Math.round((dPresent / dEnrolled) * 100) : 100;
    return {
      departmentId: d.id,
      departmentName: d.name,
      enrolled: dEnrolled,
      present: dPresent,
      absent: dAbsent,
      rate: dRate,
    };
  });

  return {
    date,
    totalEnrolled,
    totalPresent,
    totalAbsent,
    totalLate,
    totalEscaped,
    overallAttendanceRate,
    byGrade,
    byDepartment,
  };
};

// =========================================================================
// Early Warning Alerts (محرك الإنذار المبكر)
// =========================================================================

export const getSmartEarlyWarnings = (
  studentsList?: Student[],
  noticesList?: OfficialNotice[],
  config?: SchoolConfig
): EarlyWarningAlert[] => {
  const students = studentsList || getStudents();
  const schoolConfig = config || getSchoolConfig();
  const classes = getClasses();
  const departments = getDepartments();

  const alerts: EarlyWarningAlert[] = [];

  students.forEach((st) => {
    const cls = classes.find((c) => c.id === st.classId);
    const dept = departments.find((d) => d.id === st.departmentId);
    const consec = st.consecutiveAbsenceDays || 0;
    const total = st.totalAbsenceDays || 0;

    const warn1Consec = schoolConfig.warning1ConsecutiveDays || 5;
    const warn1Total = schoolConfig.warning1TotalDays || 10;
    const warn2Consec = schoolConfig.warning2ConsecutiveDays || 10;
    const warn2Total = schoolConfig.warning2TotalDays || 20;
    const expConsec = schoolConfig.expulsionConsecutiveDays || 15;
    const expTotal = schoolConfig.expulsionTotalDays || 30;

    if (consec >= expConsec - 2 || total >= expTotal - 3) {
      alerts.push({
        id: `alert_exp_${st.id}`,
        type: 'approaching_expulsion',
        severity: 'critical',
        title: 'طالب على حافة الفصل النهائي (المادة 25)',
        message: `بلغ غياب الطالب ${st.fullName} (${consec} أيام متصلة / ${total} منفصلة)، واقترب من حد الفصل (${expConsec} متصل / ${expTotal} منفصل).`,
        studentId: st.id,
        studentName: st.fullName,
        nationalId: st.nationalId,
        classId: st.classId,
        className: cls?.name,
        departmentId: st.departmentId,
        departmentName: dept?.name,
        targetTab: 'notices',
        actionLabel: 'مراجعة إصدار الإنذارات',
      });
    } else if (consec >= warn2Consec - 2 || total >= warn2Total - 3) {
      alerts.push({
        id: `alert_w2_${st.id}`,
        type: 'approaching_warning_2',
        severity: 'warning',
        title: 'طالب يقترب من الإنذار الثاني',
        message: `بلغ غياب الطالب ${st.fullName} (${consec} متصل / ${total} منفصل).`,
        studentId: st.id,
        studentName: st.fullName,
        nationalId: st.nationalId,
        classId: st.classId,
        className: cls?.name,
        departmentId: st.departmentId,
        departmentName: dept?.name,
        targetTab: 'notices',
        actionLabel: 'متابعة الإنذارات',
      });
    } else if (consec >= warn1Consec - 1 || total >= warn1Total - 2) {
      alerts.push({
        id: `alert_w1_${st.id}`,
        type: 'approaching_warning_1',
        severity: 'info',
        title: 'طالب يقترب من الإنذار الأول',
        message: `بلغ غياب الطالب ${st.fullName} (${consec} متصل / ${total} منفصل).`,
        studentId: st.id,
        studentName: st.fullName,
        nationalId: st.nationalId,
        classId: st.classId,
        className: cls?.name,
        departmentId: st.departmentId,
        departmentName: dept?.name,
        targetTab: 'notices',
        actionLabel: 'متابعة الغياب',
      });
    }

    if (st.workshopEscapeCount && st.workshopEscapeCount > 0) {
      alerts.push({
        id: `alert_esc_${st.id}`,
        type: 'workshop_escape',
        severity: 'warning',
        title: 'تكرار هروب من التدريب العملي',
        message: `رُصد للطالب ${st.fullName} (${st.workshopEscapeCount}) حالات هروب من الورش.`,
        studentId: st.id,
        studentName: st.fullName,
        nationalId: st.nationalId,
        classId: st.classId,
        className: cls?.name,
        departmentId: st.departmentId,
        departmentName: dept?.name,
        targetTab: 'social_portal',
        actionLabel: 'إحالة للأخصائي',
      });
    }
  });

  return alerts;
};

// =========================================================================
// Batch Import Students
// =========================================================================

export const batchImportStudents = (
  rows: {
    fullName: string;
    nationalId: string;
    studentCode: string;
    departmentCodeOrName: string;
    className: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianJob?: string;
    address?: string;
    status?: any;
    gender?: string;
  }[]
): { addedCount: number; errors: string[] } => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const currentUser = getCurrentUser();
  const errors: string[] = [];
  let addedCount = 0;

  const newStudents: Student[] = [];

  rows.forEach((row, idx) => {
    if (!row.fullName || !row.fullName.trim()) {
      errors.push(`صف ${idx + 1}: اسم الطالب مفقود`);
      return;
    }

    const dept =
      departments.find(
        (d) =>
          d.name.trim() === row.departmentCodeOrName?.trim() ||
          d.code.trim() === row.departmentCodeOrName?.trim() ||
          d.id === row.departmentCodeOrName
      ) || departments[0];

    const cls =
      classes.find(
        (c) => c.name.trim() === row.className?.trim() || c.id === row.className
      ) ||
      classes.find((c) => c.departmentId === dept?.id) ||
      classes[0];

    const newStd: Student = {
      id: `std_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: row.fullName.trim(),
      nationalId: row.nationalId ? row.nationalId.trim() : `3080101${String(Date.now() + idx).slice(-7)}`,
      studentCode: row.studentCode ? row.studentCode.trim() : String(Date.now() + idx).slice(-8),
      gender: (row.gender as any) || 'male',
      departmentId: dept ? dept.id : '',
      classId: cls ? cls.id : '',
      gradeLevel: cls ? cls.gradeLevel : ((dept?.availableGrades?.[0] as GradeLevel) || 1),
      guardianName: row.guardianName || 'ولي أمر الطالب',
      guardianPhone: row.guardianPhone || '01000000000',
      guardianJob: row.guardianJob || 'موظف',
      address: row.address || 'القاهرة',
      status: row.status || 'منتظم',
      enrollmentDate: new Date().toISOString().split('T')[0],
      birthDate: '2008-01-01',
      parentAccessCode: generateParentAccessCode(),
      totalAbsenceDays: 0,
      consecutiveAbsenceDays: 0,
      excusedAbsenceDays: 0,
      workshopAbsenceHours: 0,
      theoreticalAbsenceDays: 0,
      workshopEscapeCount: 0,
      warningLevel: 0,
      competencyStatus: 'eligible',
      updated_at: new Date().toISOString(),
      updated_by: currentUser.id,
    };

    newStudents.push(newStd);
    addedCount++;
  });

  if (newStudents.length > 0) {
    const allStudents = sortStudentsAlphabetically([...newStudents, ...students]);
    setStudentsSecure(allStudents);
    const { classes: updClasses, departments: updDepts } = syncClassAndDepartmentCounts(
      allStudents,
      classes,
      departments
    );
    setStoredData(STORAGE_KEYS.CLASSES, updClasses);
    setStoredData(STORAGE_KEYS.DEPARTMENTS, updDepts);

    logAuditEvent({
      actorId: currentUser.id,
      actorName: currentUser.name,
      action: 'batch_students_imported',
      entity: 'student',
      newValue: { count: newStudents.length },
    });
  }

  return { addedCount, errors };
};

// =========================================================================
// Academic Calendar, Holidays & Backups
// =========================================================================

export const updateAcademicCalendar = (calendarData: Partial<SchoolConfig>): SchoolConfig => {
  const config = getSchoolConfig();
  const updated = {
    ...config,
    ...calendarData,
    updated_at: new Date().toISOString(),
  };
  updateSchoolConfig(updated);
  return updated;
};

export const saveHoliday = (
  holidayData: Partial<Holiday> & { name: string; startDate: string; endDate: string; type: HolidayType }
): SchoolConfig => {
  const config = getSchoolConfig();
  const currentHolidays = config.holidays || [];
  let updatedHolidays: Holiday[];

  if (holidayData.id) {
    updatedHolidays = currentHolidays.map((h) =>
      h.id === holidayData.id ? ({ ...h, ...holidayData } as Holiday) : h
    );
  } else {
    const newHoliday: Holiday = {
      id: `hol_${Date.now()}`,
      name: holidayData.name,
      startDate: holidayData.startDate,
      endDate: holidayData.endDate,
      type: holidayData.type,
      description: holidayData.description || '',
      isTermBreak: holidayData.isTermBreak || false,
    };
    updatedHolidays = [...currentHolidays, newHoliday];
  }

  const updatedConfig = {
    ...config,
    holidays: updatedHolidays,
    updated_at: new Date().toISOString(),
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const deleteHoliday = (holidayId: string): SchoolConfig => {
  const config = getSchoolConfig();
  const currentHolidays = config.holidays || [];
  const updatedHolidays = currentHolidays.filter((h) => h.id !== holidayId);
  const updatedConfig = {
    ...config,
    holidays: updatedHolidays,
    updated_at: new Date().toISOString(),
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const resetDefaultHolidays = (): SchoolConfig => {
  const config = getSchoolConfig();
  const updatedConfig = {
    ...config,
    holidays: [...(DEFAULT_EGYPTIAN_HOLIDAYS || [])],
    updated_at: new Date().toISOString(),
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const exportBackupData = (): string => {
  const backup = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    config: getSchoolConfig(),
    departments: getDepartments(),
    classes: getClasses(),
    students: getStudents(),
    attendance: getAttendance(),
    notices: getNotices(),
    competencyUnits: getCompetencyUnits(),
    competencyAssessments: getCompetencyAssessments(),
    socialCases: getSocialCases(),
    grievances: getGrievances(),
    assessmentCalendar: getAssessmentCalendarEvents(),
    verifications: getVerificationRecords(),
  };
  return JSON.stringify(backup, null, 2);
};

export const importBackupData = (jsonString: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonString);
    if (data.config) updateSchoolConfig(data.config);
    if (data.departments) setStoredData(STORAGE_KEYS.DEPARTMENTS, data.departments);
    if (data.classes) setStoredData(STORAGE_KEYS.CLASSES, data.classes);
    if (data.students) setStudentsSecure(data.students);
    if (data.attendance) setStoredData(STORAGE_KEYS.ATTENDANCE, data.attendance);
    if (data.notices) setStoredData(STORAGE_KEYS.NOTICES, data.notices);
    if (data.competencyUnits) setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, data.competencyUnits);
    if (data.competencyAssessments) setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, data.competencyAssessments);
    if (data.socialCases) {
      inMemorySocialCasesCache = data.socialCases;
      if (typeof window !== 'undefined') db.social_cases.bulkPut(data.socialCases).catch(() => {});
    }
    if (data.grievances) {
      inMemoryGrievancesCache = data.grievances;
      if (typeof window !== 'undefined') db.grievances.bulkPut(data.grievances).catch(() => {});
    }
    if (data.assessmentCalendar) {
      inMemoryCalendarCache = data.assessmentCalendar;
      if (typeof window !== 'undefined') db.assessment_calendar.bulkPut(data.assessmentCalendar).catch(() => {});
    }
    return { success: true, message: 'تمت استعادة البيانات بنجاح' };
  } catch (err: any) {
    return { success: false, message: `فشل استيراد النسخة الاحتياطية: ${err.message}` };
  }
};

// =========================================================================
// Reset & Defaults
// =========================================================================

export const resetToDefaultData = () => {
  if (typeof window === 'undefined') return;
  localStorage.clear();
  inMemoryStudentsCache = [...MOCK_STUDENTS];
  inMemorySocialCasesCache = [...MOCK_SOCIAL_CASES];
  inMemoryGrievancesCache = [];
  inMemoryCalendarCache = [];
  initializeData();
  window.location.reload();
};
