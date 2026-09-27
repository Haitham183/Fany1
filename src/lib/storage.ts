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
  SCHOOL_CONFIG,
  DEFAULT_EGYPTIAN_HOLIDAYS,
} from './mockData';
import {
  CompetencyUnit,
  StudentCompetencyAssessment,
  SocialCaseRecord,
  SocialSessionRecord,
  SocialCasePriority,
  SocialCaseCategory,
  BackupPackage,
  EarlyWarningAlert,
} from '@/types';

const STORAGE_KEYS = {
  CURRENT_USER: 'egyptian_school_current_user',
  USERS: 'egyptian_school_users',
  STUDENTS: 'egyptian_school_students',
  DEPARTMENTS: 'egyptian_school_departments',
  CLASSES: 'egyptian_school_classes',
  ATTENDANCE: 'egyptian_school_attendance',
  NOTICES: 'egyptian_school_notices',
  CONFIG: 'egyptian_school_config',
  TRANSFER_LOGS: 'egyptian_school_transfer_logs',
  WORKSHOP_VIOLATIONS: 'egyptian_school_workshop_violations',
  COMPETENCY_UNITS: 'egyptian_school_competency_units',
  COMPETENCY_ASSESSMENTS: 'egyptian_school_competency_assessments',
  SOCIAL_CASES: 'egyptian_school_social_cases',
  IS_AUTHENTICATED: 'egyptian_school_is_auth',
};

import { autoSyncKeyToCloud, deleteRowFromCloud } from './supabaseSync';

// Safe LocalStorage helpers
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('egyptian_school_storage_update'));
    // Automatically sync persistent school entities to Supabase Cloud
    autoSyncKeyToCloud(key, value);
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
};

// Sync dynamic counts
const syncClassAndDepartmentCounts = (students: Student[], classes: SchoolClass[], departments: Department[]): { classes: SchoolClass[]; departments: Department[] } => {
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
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
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
  if (!localStorage.getItem(STORAGE_KEYS.SOCIAL_CASES)) {
    localStorage.setItem(STORAGE_KEYS.SOCIAL_CASES, JSON.stringify(MOCK_SOCIAL_CASES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED)) {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(false));
  }

  // Clean initial orphan notices
  const students = getStudents();
  const notices = getNotices();
  const validNotices = notices.filter((n) => students.some((s) => s.id === n.studentId));
  if (validNotices.length !== notices.length) {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(validNotices));
  }
};

// =========================================================================
// Arabic Alphabetical Sorting Collation (الترتيب الهجائي / الأبجدي المعتمد من أ إلى ي)
// =========================================================================
export const sortArabicAlphabetically = (a: string, b: string): number => {
  return a.trim().localeCompare(b.trim(), 'ar', { sensitivity: 'base', numeric: true });
};

export const sortStudentsAlphabetically = (studentList: Student[]): Student[] => {
  return [...studentList].sort((a, b) => sortArabicAlphabetically(a.fullName, b.fullName));
};

// Getters
export const getCurrentUser = (): User => getStoredData(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]);
export const getUsers = (): User[] => getStoredData(STORAGE_KEYS.USERS, MOCK_USERS);
export const getStudents = (): Student[] => {
  const data = getStoredData(STORAGE_KEYS.STUDENTS, MOCK_STUDENTS);
  return sortStudentsAlphabetically(data);
};
export const getDepartments = (): Department[] => getStoredData(STORAGE_KEYS.DEPARTMENTS, MOCK_DEPARTMENTS);
export const getClasses = (): SchoolClass[] => getStoredData(STORAGE_KEYS.CLASSES, MOCK_CLASSES);
export const getAttendance = (): AttendanceRecord[] => getStoredData(STORAGE_KEYS.ATTENDANCE, MOCK_ATTENDANCE_HISTORY);
export const getNotices = (): OfficialNotice[] => getStoredData(STORAGE_KEYS.NOTICES, MOCK_NOTICES);
export const getSchoolConfig = (): SchoolConfig => getStoredData(STORAGE_KEYS.CONFIG, SCHOOL_CONFIG);
export const getTransferLogs = (): StudentTransferLog[] => getStoredData(STORAGE_KEYS.TRANSFER_LOGS, []);
export const getWorkshopViolations = (): WorkshopViolationRecord[] => getStoredData(STORAGE_KEYS.WORKSHOP_VIOLATIONS, MOCK_WORKSHOP_VIOLATIONS);
export const getCompetencyUnits = (): CompetencyUnit[] => getStoredData(STORAGE_KEYS.COMPETENCY_UNITS, MOCK_COMPETENCY_UNITS);
export const getCompetencyAssessments = (): StudentCompetencyAssessment[] => getStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, MOCK_COMPETENCY_ASSESSMENTS);
export const getSocialCases = (): SocialCaseRecord[] => getStoredData(STORAGE_KEYS.SOCIAL_CASES, MOCK_SOCIAL_CASES);
export const getIsAuthenticated = (): boolean => getStoredData(STORAGE_KEYS.IS_AUTHENTICATED, false);

// Social Specialist Cases Operations
export const saveSocialCase = (caseData: Partial<SocialCaseRecord> & { studentId: string }) => {
  const cases = getSocialCases();
  const nowStr = new Date().toISOString();
  const todayDate = nowStr.split('T')[0];

  if (caseData.id) {
    const updated = cases.map((c) =>
      c.id === caseData.id
        ? {
            ...c,
            ...caseData,
            updatedAt: nowStr,
          }
        : c
    );
    setStoredData(STORAGE_KEYS.SOCIAL_CASES, updated);
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
      referralSource: caseData.referralSource || 'ai_prediction',
      referralReason: caseData.referralReason || 'إحالة للدعم والإرشاد الاجتماعي',
      aiRiskScore: caseData.aiRiskScore,
      aiRiskLevel: caseData.aiRiskLevel,
      aiRootCauses: caseData.aiRootCauses || [],
      aiRecommendations: caseData.aiRecommendations || [],
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
      updatedAt: nowStr,
    };

    setStoredData(STORAGE_KEYS.SOCIAL_CASES, [newCase, ...cases]);
    return newCase;
  }
};

export const deleteSocialCase = (caseId: string) => {
  const cases = getSocialCases();
  const updated = cases.filter((c) => c.id !== caseId);
  setStoredData(STORAGE_KEYS.SOCIAL_CASES, updated);
  deleteRowFromCloud('social_cases', caseId);
};

export const referStudentToSocialSpecialist = (params: {
  student: Student;
  studentClass?: SchoolClass;
  department?: Department;
  reason: string;
  priority?: SocialCasePriority;
  category?: SocialCaseCategory;
  aiRiskScore?: number;
  aiRiskLevel?: 'critical' | 'high' | 'medium' | 'safe';
  aiRootCauses?: string[];
  aiRecommendations?: string[];
  source?: 'ai_prediction' | 'affairs' | 'teacher' | 'dept_head' | 'principal' | 'self';
}): SocialCaseRecord => {
  const {
    student,
    studentClass,
    department,
    reason,
    priority = 'urgent',
    category = 'absence_dropout_risk',
    aiRiskScore,
    aiRiskLevel = 'critical',
    aiRootCauses = [],
    aiRecommendations = [],
    source = 'ai_prediction',
  } = params;

  const existingCases = getSocialCases();
  const existing = existingCases.find((c) => c.studentId === student.id && (c.status === 'pending' || c.status === 'in_progress'));
  
  if (existing) {
    // Update existing active case with latest AI indicators
    const updated = saveSocialCase({
      ...existing,
      aiRiskScore: aiRiskScore ?? existing.aiRiskScore,
      aiRiskLevel: aiRiskLevel ?? existing.aiRiskLevel,
      aiRootCauses: Array.from(new Set([...(existing.aiRootCauses || []), ...aiRootCauses])),
      aiRecommendations: Array.from(new Set([...(existing.aiRecommendations || []), ...aiRecommendations])),
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
    aiRiskScore,
    aiRiskLevel,
    aiRootCauses,
    aiRecommendations,
    status: 'pending',
    priority,
    category,
    initialDiagnosis: `تم الرصد والإحالة عبر محرك الذكاء الاصطناعي: ${reason}`,
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
  
  // Auto update case status to in_progress if was pending
  let newStatus = targetCase.status;
  if (newStatus === 'pending') {
    newStatus = 'in_progress';
  }
  if (session.outcome === 'improved') {
    newStatus = 'resolved';
  }

  return saveSocialCase({
    ...targetCase,
    status: newStatus,
    sessions: updatedSessions,
  });
};

// Auth & Users
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
  if (userData.id) {
    const updated = users.map((u) => (u.id === userData.id ? ({ ...u, ...userData } as User) : u));
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
          ? 'مدير عام المدرسة'
          : userData.role === 'affairs_deputy'
          ? 'وكيل شئون الطلاب'
          : userData.role === 'affairs_officer'
          ? 'مسئول شئون الطلاب'
          : userData.role === 'dept_head'
          ? 'رئيس قسم صناعي'
          : 'معلم / مدرب ورشة'),
      departmentId: userData.departmentId,
      assignedClassIds: userData.assignedClassIds || [],
      phone: userData.phone || '',
      customPermissions: userData.customPermissions || {
        canTakeAttendance: true,
        canManageStudents: userData.role === 'principal' || userData.role === 'affairs_deputy' || userData.role === 'affairs_officer',
        canTransferStudents: userData.role === 'principal' || userData.role === 'affairs_deputy' || userData.role === 'affairs_officer',
        canApproveExcuses: userData.role === 'principal' || userData.role === 'affairs_deputy' || userData.role === 'affairs_officer',
        canIssueNotices: userData.role === 'principal' || userData.role === 'affairs_deputy' || userData.role === 'affairs_officer',
        canManageSchoolSettings: userData.role === 'principal',
        canManageUsers: userData.role === 'principal',
        canViewReports: true,
        canManageCompetencies: true,
        canLogViolations: true,
      },
    };
    setStoredData(STORAGE_KEYS.USERS, [...users, newUser]);
  }
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  setStoredData(STORAGE_KEYS.USERS, users.filter((u) => u.id !== userId));
  deleteRowFromCloud('school_users', userId);
};

// =========================================================================
// =========================================================================
// CASCADE INTEGRITY OPERATIONS: Student Add, Update, Delete, Transfer, Batch
// =========================================================================

export interface StudentDuplicateCheckResult {
  hasDuplicate: boolean;
  field?: 'nationalId' | 'studentCode' | 'fullName';
  message?: string;
  conflictingStudent?: Student;
}

export const checkStudentDuplicate = (
  student: {
    fullName: string;
    nationalId: string;
    studentCode?: string;
    id?: string;
  },
  existingStudents?: Student[]
): StudentDuplicateCheckResult => {
  const students = existingStudents || getStudents();
  const classes = getClasses();

  const cleanName = (s: string) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanNid = (s: string) => (s || '').trim().replace(/\s+/g, '');
  const cleanCode = (s: string) => (s || '').trim().replace(/\s+/g, '');

  const inputName = cleanName(student.fullName);
  const inputNid = cleanNid(student.nationalId);
  const inputCode = cleanCode(student.studentCode || '');

  for (const s of students) {
    if (student.id && s.id === student.id) continue;

    const sClass = classes.find((c) => c.id === s.classId)?.name || 'غير محدد';

    // 1. Check National ID (14 digits)
    if (inputNid && cleanNid(s.nationalId) === inputNid) {
      return {
        hasDuplicate: true,
        field: 'nationalId',
        conflictingStudent: s,
        message: `الرقم القومي (${inputNid}) مسجل مسبقاً بالمدرسة للطالب (${s.fullName}) في فصل (${sClass})`,
      };
    }

    // 2. Check Student Code
    if (inputCode && cleanCode(s.studentCode) === inputCode) {
      return {
        hasDuplicate: true,
        field: 'studentCode',
        conflictingStudent: s,
        message: `كود الطالب (${inputCode}) مسجل مسبقاً بالمدرسة للطالب (${s.fullName}) في فصل (${sClass})`,
      };
    }

    // 3. Check Full Name (Exact 4-part name match)
    if (inputName && inputName.length > 5 && cleanName(s.fullName) === inputName) {
      return {
        hasDuplicate: true,
        field: 'fullName',
        conflictingStudent: s,
        message: `اسم الطالب (${s.fullName}) مسجل مسبقاً بنفس الاسم بالكامل في فصل (${sClass}) بالمدرسة`,
      };
    }
  }

  return { hasDuplicate: false };
};

export const addStudent = (
  student: Omit<
    Student,
    | 'id'
    | 'totalAbsenceDays'
    | 'consecutiveAbsenceDays'
    | 'excusedAbsenceDays'
    | 'warningLevel'
    | 'workshopAbsenceHours'
    | 'theoreticalAbsenceDays'
    | 'workshopEscapeCount'
    | 'competencyStatus'
  > &
    Partial<
      Pick<
        Student,
        | 'workshopAbsenceHours'
        | 'theoreticalAbsenceDays'
        | 'workshopEscapeCount'
        | 'competencyStatus'
      >
    >
) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();

  // Validate Duplication across school
  const duplicateCheck = checkStudentDuplicate(student, students);
  if (duplicateCheck.hasDuplicate) {
    throw new Error(duplicateCheck.message || 'بيانات الطالب مكررة في المنظومة');
  }

  const newStudent: Student = {
    ...student,
    id: `std_${Date.now()}`,
    totalAbsenceDays: 0,
    consecutiveAbsenceDays: 0,
    excusedAbsenceDays: 0,
    workshopAbsenceHours: 0,
    theoreticalAbsenceDays: 0,
    workshopEscapeCount: 0,
    warningLevel: 0,
    competencyStatus: 'eligible',
  };

  const updatedStudents = sortStudentsAlphabetically([newStudent, ...students]);
  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );

  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  return newStudent;
};

// Batch Import from Excel / CSV with Full School Duplication Check and Auto-Department/Class Creation
export const batchImportStudents = (
  importedRows: {
    fullName: string;
    nationalId: string;
    studentCode?: string;
    departmentCodeOrName?: string;
    className?: string;
    guardianName?: string;
    guardianPhone?: string;
    address?: string;
    gradeLevel?: number;
    status?: any;
  }[]
): {
  addedCount: number;
  skippedCount: number;
  createdDepartmentsCount: number;
  createdClassesCount: number;
  errors: string[];
} => {
  const students = getStudents();
  let activeClasses = [...getClasses()];
  let activeDepartments = [...getDepartments()];
  const errors: string[] = [];
  let addedCount = 0;
  let skippedCount = 0;
  let createdDepartmentsCount = 0;
  let createdClassesCount = 0;
  const newStudents: Student[] = [];

  const gradeNameMap: Record<number, string> = {
    1: 'الصف الأول الصناعي',
    2: 'الصف الثاني الصناعي',
    3: 'الصف الثالث الصناعي (دبلوم)',
    4: 'الفرقة الرابعة المتقدمة (5 سنوات)',
    5: 'الفرقة الخامسة (دبلوم متقدم 5 سنوات)',
  };

  const normArabic = (s: string) =>
    (s || '')
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u0652]/g, '')
      .replace(/[_\s-]+/g, '');

  // Track seen identifiers to prevent duplication within the imported file itself
  const seenNationalIds = new Set<string>(students.map((s) => s.nationalId.trim().replace(/\s+/g, '')));
  const seenStudentCodes = new Set<string>(students.map((s) => s.studentCode.trim().replace(/\s+/g, '')));
  const seenFullNames = new Set<string>(students.map((s) => s.fullName.trim().toLowerCase().replace(/\s+/g, ' ')));

  importedRows.forEach((row, index) => {
    let fullName = (row.fullName || '').trim();
    let nationalId = (row.nationalId || '').trim();
    let studentCode = (row.studentCode || '').trim();

    // Auto-swap check if fullName is purely numbers and nationalId contains Arabic text
    if (/^\d+$/.test(fullName) && /[\u0600-\u06FF]/.test(nationalId)) {
      const temp = fullName;
      fullName = nationalId;
      nationalId = temp;
    }

    // Auto-swap check if fullName is numbers and studentCode contains Arabic text
    if (/^\d+$/.test(fullName) && /[\u0600-\u06FF]/.test(studentCode)) {
      const temp = fullName;
      fullName = studentCode;
      studentCode = temp;
    }

    if (!fullName) {
      errors.push(`سطر ${index + 1}: تم التخطي لأن اسم الطالب مفقود`);
      skippedCount++;
      return;
    }

    const cleanNid = nationalId.replace(/\s+/g, '');
    const cleanCode = studentCode.replace(/\s+/g, '');
    const cleanName = fullName.toLowerCase().replace(/\s+/g, ' ');

    // 1. Check National ID Duplicate
    if (cleanNid && seenNationalIds.has(cleanNid)) {
      const existing = [...students, ...newStudents].find((s) => s.nationalId.replace(/\s+/g, '') === cleanNid);
      const exCls = activeClasses.find((c) => c.id === existing?.classId)?.name || '';
      errors.push(`سطر ${index + 1}: تم تخطي (${fullName}) - الرقم القومي (${nationalId}) مسجل مسبقاً بالمدرسة ${existing ? `للطالب (${existing.fullName}) فصل (${exCls})` : ''}`);
      skippedCount++;
      return;
    }

    // 2. Check Student Code Duplicate
    if (cleanCode && seenStudentCodes.has(cleanCode)) {
      const existing = [...students, ...newStudents].find((s) => s.studentCode.replace(/\s+/g, '') === cleanCode);
      errors.push(`سطر ${index + 1}: تم تخطي (${fullName}) - كود الطالب (${studentCode}) مكرر ومسجل مسبقاً ${existing ? `للطالب (${existing.fullName})` : ''}`);
      skippedCount++;
      return;
    }

    // 3. Check Exact Full Name Duplicate
    if (cleanName.length > 5 && seenFullNames.has(cleanName)) {
      const existing = [...students, ...newStudents].find((s) => s.fullName.toLowerCase().replace(/\s+/g, ' ') === cleanName);
      const exCls = activeClasses.find((c) => c.id === existing?.classId)?.name || '';
      errors.push(`سطر ${index + 1}: تم تخطي (${fullName}) - الاسم مسجل مسبقاً بالكامل بالمدرسة في فصل (${exCls})`);
      skippedCount++;
      return;
    }

    // ==========================================
    // Smart Department Resolution & Auto-Creation
    // ==========================================
    let deptNameRaw = (row.departmentCodeOrName || '').trim();
    let dept: Department | undefined;

    if (deptNameRaw) {
      const normInput = normArabic(deptNameRaw.replace(/^(قسم|تخصص|شعبة|مجال)\s*/, ''));

      dept = activeDepartments.find((d) => {
        const normDName = normArabic(d.name.replace(/^(قسم|تخصص|شعبة|مجال)\s*/, ''));
        const normDCode = normArabic(d.code);
        return (
          normDName.includes(normInput) ||
          normInput.includes(normDName) ||
          normDCode === normInput
        );
      });

      // If department doesn't exist, automatically create it!
      if (!dept && normInput.length >= 2) {
        let cleanDeptName = deptNameRaw;
        if (!cleanDeptName.startsWith('قسم ') && !cleanDeptName.startsWith('تخصص ')) {
          cleanDeptName = `قسم ${cleanDeptName}`;
        }

        let iconName = 'Wrench';
        if (normInput.includes('كهرب') || normInput.includes('الكترون')) iconName = 'Zap';
        else if (normInput.includes('حاسب') || normInput.includes('برمج') || normInput.includes('تكنولوج')) iconName = 'Cpu';
        else if (normInput.includes('سيار') || normInput.includes('محرك') || normInput.includes('مركب')) iconName = 'Car';
        else if (normInput.includes('بترول') || normInput.includes('غاز') || normInput.includes('كيميا')) iconName = 'Flame';

        const newDept: Department = {
          id: `dept_${Date.now()}_${activeDepartments.length + 1}`,
          name: cleanDeptName,
          code: `DEP-${Math.floor(100 + Math.random() * 900)}`,
          description: `${cleanDeptName} بالتعليم الفني الصناعي`,
          scientificSupervisorName: 'المشرف العلمي',
          practicalSupervisorName: 'المشرف العملي',
          headPhone: '',
          iconName,
          totalStudents: 0,
          workshopCount: 2,
          availableGrades: [1, 2, 3],
        };

        activeDepartments.push(newDept);
        createdDepartmentsCount++;
        dept = newDept;
      }
    }

    if (!dept) {
      dept = activeDepartments[0];
    }

    // ==========================================
    // Smart Class Resolution & Auto-Creation
    // ==========================================
    let classNameRaw = (row.className || '').trim();
    let targetClass: SchoolClass | undefined;

    // Detect Grade Level (1-5)
    let gradeLevel: GradeLevel = (row.gradeLevel || 1) as GradeLevel;
    if (classNameRaw) {
      if (classNameRaw.startsWith('2') || classNameRaw.includes('ثان')) gradeLevel = 2;
      else if (classNameRaw.startsWith('3') || classNameRaw.includes('ثالث') || classNameRaw.includes('دبلوم')) gradeLevel = 3;
      else if (classNameRaw.startsWith('4') || classNameRaw.includes('رابع')) gradeLevel = 4;
      else if (classNameRaw.startsWith('5') || classNameRaw.includes('خامس')) gradeLevel = 5;
      else if (classNameRaw.startsWith('1') || classNameRaw.includes('اول') || classNameRaw.includes('أول')) gradeLevel = 1;
    }

    if (classNameRaw) {
      const normClassInput = normArabic(classNameRaw);
      targetClass = activeClasses.find(
        (c) => c.departmentId === dept!.id && (normArabic(c.name) === normClassInput || normArabic(c.name).includes(normClassInput))
      );

      // If class does not exist under this department, automatically create it!
      if (!targetClass) {
        const newClass: SchoolClass = {
          id: `class_${Date.now()}_${activeClasses.length + 1}`,
          name: classNameRaw,
          gradeLevel,
          gradeName: gradeNameMap[gradeLevel] || 'الصف الأول الصناعي',
          departmentId: dept.id,
          departmentName: dept.name,
          supervisorTeacherId: 'user_officer',
          supervisorTeacherName: 'المعلم المشرف',
          roomNumber: `ورشة ${dept.name.replace('قسم ', '')}`,
          studentCount: 0,
          shift: 'morning',
        };

        activeClasses.push(newClass);
        createdClassesCount++;
        targetClass = newClass;
      }
    } else {
      // Find class in department matching gradeLevel, or create default 1/1
      targetClass =
        activeClasses.find((c) => c.departmentId === dept!.id && c.gradeLevel === gradeLevel) ||
        activeClasses.find((c) => c.departmentId === dept!.id);

      if (!targetClass) {
        const defaultClsName = `1/1 ${dept.name.replace('قسم ', '')}`;
        const newClass: SchoolClass = {
          id: `class_${Date.now()}_${activeClasses.length + 1}`,
          name: defaultClsName,
          gradeLevel: 1,
          gradeName: 'الصف الأول الصناعي',
          departmentId: dept.id,
          departmentName: dept.name,
          supervisorTeacherId: 'user_officer',
          supervisorTeacherName: 'المعلم المشرف',
          roomNumber: `ورشة ${dept.name.replace('قسم ', '')}`,
          studentCount: 0,
          shift: 'morning',
        };

        activeClasses.push(newClass);
        createdClassesCount++;
        targetClass = newClass;
      }
    }

    // Determine status
    let status = row.status || 'منتظم';
    if (row.guardianPhone === 'منتظم' || row.guardianPhone === 'منازل' || row.guardianPhone === 'عمال') {
      status = row.guardianPhone;
    }

    const finalNid = nationalId || `3080101${String(Date.now() + index).slice(-7)}`;
    const finalCode = studentCode || `${new Date().getFullYear()}${String(students.length + addedCount + 1).padStart(4, '0')}`;

    const student: Student = {
      id: `std_imp_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      fullName,
      nationalId: finalNid,
      studentCode: finalCode,
      departmentId: dept.id,
      classId: targetClass.id,
      gradeLevel: (row.gradeLevel || targetClass.gradeLevel || gradeLevel) as GradeLevel,
      guardianName: (row.guardianName && row.guardianName !== '0') ? row.guardianName.trim() : 'ولي أمر الطالب',
      guardianPhone: (row.guardianPhone && !['منتظم', 'منازل', 'عمال', '0'].includes(row.guardianPhone)) ? row.guardianPhone.trim() : '01000000000',
      guardianJob: 'موظف',
      address: row.address?.trim() || 'القاهرة',
      status: status || 'منتظم',
      enrollmentDate: new Date().toISOString().split('T')[0],
      birthDate: '2008-01-01',
      totalAbsenceDays: 0,
      consecutiveAbsenceDays: 0,
      excusedAbsenceDays: 0,
      workshopAbsenceHours: 0,
      theoreticalAbsenceDays: 0,
      workshopEscapeCount: 0,
      warningLevel: 0,
      competencyStatus: 'eligible',
    };

    newStudents.push(student);
    if (cleanNid) seenNationalIds.add(cleanNid);
    if (cleanCode) seenStudentCodes.add(cleanCode);
    if (cleanName) seenFullNames.add(cleanName);
    addedCount++;
  });

  if (newStudents.length > 0 || createdDepartmentsCount > 0 || createdClassesCount > 0) {
    const updatedStudents = sortStudentsAlphabetically([...newStudents, ...students]);
    const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
      updatedStudents,
      activeClasses,
      activeDepartments
    );

    setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
    setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
    setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  }

  return { addedCount, skippedCount, createdDepartmentsCount, createdClassesCount, errors };
};

// Automatic Data Fixer for Swapped / Misaligned Student Records
export const autoFixSwappedStudentFields = (): { fixedCount: number } => {
  const students = getStudents();
  let fixedCount = 0;

  const isArabicText = (s: string) => /[\u0600-\u06FF]/.test(s) && !/^\d+$/.test(s) && !['منتظم', 'منازل', 'عمال', 'باق للإعادة', '0', 'عام'].includes(s.trim());
  const is14Digit = (s: string) => /^\d{14}$/.test(s.replace(/\s+/g, ''));
  const isCode = (s: string) => /^\d{3,10}$/.test(s.replace(/\s+/g, ''));
  const isStatus = (s: string) => ['منتظم', 'منازل', 'عمال', 'باق للإعادة', 'راسب'].includes(s.trim());

  const updatedStudents = students.map((student) => {
    let { fullName, nationalId, studentCode, guardianName, guardianPhone, status } = student;
    let modified = false;

    // Check if fullName is purely numbers
    if (/^\d+$/.test(fullName.trim())) {
      let realName = '';
      if (isArabicText(nationalId)) realName = nationalId;
      else if (isArabicText(studentCode)) realName = studentCode;
      else if (isArabicText(guardianName)) realName = guardianName;

      let realNationalId = '';
      if (is14Digit(studentCode)) realNationalId = studentCode;
      else if (is14Digit(fullName)) realNationalId = fullName;
      else if (is14Digit(nationalId)) realNationalId = nationalId;

      let realCode = '';
      if (isCode(fullName) && fullName !== realNationalId) realCode = fullName;
      else if (isCode(studentCode) && studentCode !== realNationalId) realCode = studentCode;
      else if (isCode(nationalId) && nationalId !== realNationalId) realCode = nationalId;

      if (realName) {
        fullName = realName;
        if (realNationalId) nationalId = realNationalId;
        if (realCode) studentCode = realCode;
        modified = true;
      }
    }

    if (isStatus(guardianPhone)) {
      status = guardianPhone as any;
      guardianPhone = '01000000000';
      modified = true;
    }

    if (guardianName === '0') {
      guardianName = 'ولي أمر الطالب';
      modified = true;
    }

    if (modified) {
      fixedCount++;
      return {
        ...student,
        fullName,
        nationalId,
        studentCode,
        guardianName,
        guardianPhone,
        status,
      };
    }
    return student;
  });

  if (fixedCount > 0) {
    setStoredData(STORAGE_KEYS.STUDENTS, sortStudentsAlphabetically(updatedStudents));
  }

  return { fixedCount };
};

export const updateStudent = (studentData: Student) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const notices = getNotices();

  // Validate Duplication across school (excluding self)
  const duplicateCheck = checkStudentDuplicate(studentData, students);
  if (duplicateCheck.hasDuplicate) {
    throw new Error(duplicateCheck.message || 'بيانات الطالب مكررة مع طالب آخر');
  }

  const targetClass = classes.find((c) => c.id === studentData.classId);
  const targetDept = departments.find((d) => d.id === studentData.departmentId);

  const updatedStudents = sortStudentsAlphabetically(
    students.map((s) => (s.id === studentData.id ? studentData : s))
  );

  const updatedNotices = notices.map((n) => {
    if (n.studentId === studentData.id) {
      return {
        ...n,
        studentName: studentData.fullName,
        nationalId: studentData.nationalId,
        studentCode: studentData.studentCode,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        address: studentData.address,
        className: targetClass?.name || n.className,
        departmentName: targetDept?.name || n.departmentName,
      };
    }
    return n;
  });

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );

  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
};

export const deleteStudent = (studentId: string) => {
  const students = getStudents();
  const notices = getNotices();
  const attendance = getAttendance();
  const transferLogs = getTransferLogs();
  const violations = getWorkshopViolations();
  const classes = getClasses();
  const departments = getDepartments();

  const updatedStudents = students.filter((s) => s.id !== studentId);
  const updatedNotices = notices.filter((n) => n.studentId !== studentId);
  const updatedAttendance = attendance.filter((a) => a.studentId !== studentId);
  const updatedTransferLogs = transferLogs.filter((t) => t.studentId !== studentId);
  const updatedViolations = violations.filter((v) => v.studentId !== studentId);

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );

  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedAttendance);
  setStoredData(STORAGE_KEYS.TRANSFER_LOGS, updatedTransferLogs);
  setStoredData(STORAGE_KEYS.WORKSHOP_VIOLATIONS, updatedViolations);
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  deleteRowFromCloud('students', studentId);
};

export const transferStudent = (
  studentId: string,
  toDeptId: string,
  toClassId: string,
  reason: string,
  officerName: string
) => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const notices = getNotices();
  const transferLogs = getTransferLogs();

  const student = students.find((s) => s.id === studentId);
  if (!student) return false;

  const fromClass = classes.find((c) => c.id === student.classId);
  const fromDept = departments.find((d) => d.id === student.departmentId);
  const toClass = classes.find((c) => c.id === toClassId);
  const toDept = departments.find((d) => d.id === toDeptId);

  const newLog: StudentTransferLog = {
    id: `trans_${Date.now()}`,
    studentId,
    fromClassId: student.classId,
    fromClassName: fromClass?.name || 'فصل سابق',
    fromDeptId: student.departmentId,
    fromDeptName: fromDept?.name || 'تخصص سابق',
    toClassId,
    toClassName: toClass?.name || 'فصل جديد',
    toDeptId,
    toDeptName: toDept?.name || 'تخصص جديد',
    date: new Date().toISOString().split('T')[0],
    reason: reason || 'بناءً على طلب ولي الأمر وتنسيق الأقسام',
    officerName,
  };

  const updatedStudents = students.map((s) => {
    if (s.id === studentId) {
      return {
        ...s,
        departmentId: toDeptId,
        classId: toClassId,
        gradeLevel: toClass?.gradeLevel || s.gradeLevel,
        notes: `تم تحويل ونقل الطالب من (${fromClass?.name || ''} - ${fromDept?.name || ''}) إلى (${toClass?.name || ''} - ${toDept?.name || ''}) بتاريخ ${new Date().toLocaleDateString('ar-EG')}. سبب التحويل: ${reason}`,
      };
    }
    return s;
  });

  const updatedNotices = notices.map((n) => {
    if (n.studentId === studentId) {
      return {
        ...n,
        className: toClass?.name || n.className,
        departmentName: toDept?.name || n.departmentName,
      };
    }
    return n;
  });

  const { classes: updatedClasses, departments: updatedDepartments } = syncClassAndDepartmentCounts(
    updatedStudents,
    classes,
    departments
  );

  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
  setStoredData(STORAGE_KEYS.TRANSFER_LOGS, [newLog, ...transferLogs]);
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  return true;
};

// =========================================================================
// Safety Violations & Workshop Escape
// =========================================================================

export const logWorkshopViolation = (violation: Omit<WorkshopViolationRecord, 'id'>) => {
  const violations = getWorkshopViolations();
  const students = getStudents();

  const newRecord: WorkshopViolationRecord = {
    ...violation,
    id: `viol_${Date.now()}`,
  };

  // If workshop escape, increment student escape count and warning
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
    setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  }

  setStoredData(STORAGE_KEYS.WORKSHOP_VIOLATIONS, [newRecord, ...violations]);
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
// Department & Class Operations
// =========================================================================

export const saveDepartment = (dept: Partial<Department> & { name: string }) => {
  const departments = getDepartments();
  const classes = getClasses();
  const notices = getNotices();

  if (dept.id) {
    const oldDept = departments.find((d) => d.id === dept.id);
    const updatedDepartments = departments.map((d) => (d.id === dept.id ? ({ ...d, ...dept } as Department) : d));

    const updatedClasses = classes.map((c) =>
      c.departmentId === dept.id ? { ...c, departmentName: dept.name } : c
    );

    const updatedNotices = notices.map((n) =>
      oldDept && n.departmentName === oldDept.name ? { ...n, departmentName: dept.name } : n
    );

    setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
    setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
    setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
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
    };
    setStoredData(STORAGE_KEYS.DEPARTMENTS, [...departments, newDept]);
  }
};

export const deleteDepartment = (deptId: string) => {
  const departments = getDepartments();
  const classes = getClasses();
  const students = getStudents();
  const notices = getNotices();

  const deptToDelete = departments.find((d) => d.id === deptId);

  const updatedDepartments = departments.filter((d) => d.id !== deptId);
  const updatedClasses = classes.filter((c) => c.departmentId !== deptId);
  const updatedStudents = students.filter((s) => s.departmentId !== deptId);
  const updatedNotices = notices.filter(
    (n) => updatedStudents.some((s) => s.id === n.studentId) && (!deptToDelete || n.departmentName !== deptToDelete.name)
  );

  setStoredData(STORAGE_KEYS.DEPARTMENTS, updatedDepartments);
  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
  deleteRowFromCloud('departments', deptId);
};

export const saveClass = (cls: Partial<SchoolClass> & { name: string; departmentId: string }) => {
  const classes = getClasses();
  const departments = getDepartments();
  const notices = getNotices();
  const dept = departments.find((d) => d.id === cls.departmentId);

  const gradeNameMap: Record<number, string> = {
    1: 'الصف الأول الصناعي',
    2: 'الصف الثاني الصناعي',
    3: 'الصف الثالث الصناعي (دبلوم)',
    4: 'الفرقة الرابعة المتقدمة (5 سنوات)',
    5: 'الفرقة الخامسة (دبلوم متقدم 5 سنوات)',
  };

  if (cls.id) {
    const oldClass = classes.find((c) => c.id === cls.id);
    const updatedClasses = classes.map((c) =>
      c.id === cls.id
        ? ({
            ...c,
            ...cls,
            shift: cls.shift || c.shift || 'morning',
            departmentName: dept?.name || c.departmentName,
            gradeName: cls.gradeLevel ? gradeNameMap[cls.gradeLevel] || c.gradeName : c.gradeName,
          } as SchoolClass)
        : c
    );

    const updatedNotices = notices.map((n) =>
      oldClass && n.className === oldClass.name ? { ...n, className: cls.name } : n
    );

    setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
    setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
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
    };
    setStoredData(STORAGE_KEYS.CLASSES, [...classes, newClass]);
  }
};

export const deleteClass = (classId: string) => {
  const classes = getClasses();
  const students = getStudents();
  const notices = getNotices();
  const attendance = getAttendance();

  const classToDelete = classes.find((c) => c.id === classId);

  const updatedClasses = classes.filter((c) => c.id !== classId);
  const updatedStudents = students.filter((s) => s.classId !== classId);
  const updatedAttendance = attendance.filter((a) => a.classId !== classId);
  const updatedNotices = notices.filter(
    (n) => updatedStudents.some((s) => s.id === n.studentId) && (!classToDelete || n.className !== classToDelete.name)
  );

  setStoredData(STORAGE_KEYS.CLASSES, updatedClasses);
  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedAttendance);
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
  deleteRowFromCloud('classes', classId);
};

export const updateSchoolConfig = (newConfig: SchoolConfig) => {
  setStoredData(STORAGE_KEYS.CONFIG, newConfig);

  const notices = getNotices();
  const updatedNotices = notices.map((n) => ({
    ...n,
    schoolName: newConfig.name,
    educationalDirectorate: newConfig.directorate,
    administration: newConfig.administration,
  }));
  setStoredData(STORAGE_KEYS.NOTICES, updatedNotices);
};

// =========================================================================
// Academic Calendar & Holidays Management (التقويم الدراسي والعطلات الرسمية)
// =========================================================================

export const isHolidayDate = (
  dateStr: string,
  config?: SchoolConfig
): { isHoliday: boolean; holiday?: Holiday } => {
  const currentConfig = config || getSchoolConfig();
  const holidays = currentConfig.holidays || [];
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  for (const hol of holidays) {
    const start = new Date(hol.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(hol.endDate || hol.startDate);
    end.setHours(23, 59, 59, 999);

    if (targetDate >= start && targetDate <= end) {
      return { isHoliday: true, holiday: hol };
    }
  }

  // Check mid-year break
  if (currentConfig.midYearBreakStartDate && currentConfig.midYearBreakEndDate) {
    const midStart = new Date(currentConfig.midYearBreakStartDate);
    midStart.setHours(0, 0, 0, 0);
    const midEnd = new Date(currentConfig.midYearBreakEndDate);
    midEnd.setHours(23, 59, 59, 999);

    if (targetDate >= midStart && targetDate <= midEnd) {
      return {
        isHoliday: true,
        holiday: {
          id: 'mid_year_break_auto',
          name: 'إجازة نصف العام الدراسي',
          startDate: currentConfig.midYearBreakStartDate,
          endDate: currentConfig.midYearBreakEndDate,
          type: 'official',
          isTermBreak: true,
          description: 'إجازة نصف العام الرسمية',
        },
      };
    }
  }

  return { isHoliday: false };
};

export const saveHoliday = (
  holidayData: Partial<Holiday> & { name: string; startDate: string; endDate: string; type: HolidayType }
): SchoolConfig => {
  const config = getSchoolConfig();
  const holidays = config.holidays ? [...config.holidays] : [];

  if (holidayData.id) {
    const idx = holidays.findIndex((h) => h.id === holidayData.id);
    if (idx >= 0) {
      holidays[idx] = { ...holidays[idx], ...holidayData } as Holiday;
    } else {
      holidays.push(holidayData as Holiday);
    }
  } else {
    const newHol: Holiday = {
      id: `hol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: holidayData.name,
      startDate: holidayData.startDate,
      endDate: holidayData.endDate,
      type: holidayData.type,
      description: holidayData.description || '',
      isTermBreak: holidayData.isTermBreak || false,
    };
    holidays.push(newHol);
  }

  // Sort holidays chronologically
  holidays.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const updatedConfig: SchoolConfig = {
    ...config,
    holidays,
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const deleteHoliday = (holidayId: string): SchoolConfig => {
  const config = getSchoolConfig();
  const holidays = (config.holidays || []).filter((h) => h.id !== holidayId);
  const updatedConfig: SchoolConfig = {
    ...config,
    holidays,
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const resetDefaultHolidays = (): SchoolConfig => {
  const config = getSchoolConfig();
  const updatedConfig: SchoolConfig = {
    ...config,
    holidays: DEFAULT_EGYPTIAN_HOLIDAYS,
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

export const updateAcademicCalendar = (calendar: {
  term1StartDate?: string;
  term1EndDate?: string;
  midYearBreakStartDate?: string;
  midYearBreakEndDate?: string;
  term2StartDate?: string;
  term2EndDate?: string;
  currentTerm?: string;
  academicYear?: string;
}): SchoolConfig => {
  const config = getSchoolConfig();
  const updatedConfig: SchoolConfig = {
    ...config,
    ...calendar,
  };
  updateSchoolConfig(updatedConfig);
  return updatedConfig;
};

// =========================================================================
// Daily Morning Census Calculator (الإحصاء اليومي الصباحي وسجل 5 سلوك)
// =========================================================================

export const calculateDailyCensus = (dateStr: string): DailyMorningCensus => {
  const students = getStudents();
  const attendance = getAttendance();
  const departments = getDepartments();
  const classes = getClasses();

  const todayRecords = attendance.filter((a) => a.date === dateStr);
  const presentStudentIds = new Set(
    todayRecords.filter((a) => a.status === 'present' || a.status === 'late').map((a) => a.studentId)
  );
  const absentStudentIds = new Set(
    todayRecords.filter((a) => a.status === 'absent').map((a) => a.studentId)
  );
  const lateStudentIds = new Set(
    todayRecords.filter((a) => a.status === 'late').map((a) => a.studentId)
  );
  const escapedStudentIds = new Set(
    todayRecords.filter((a) => a.status === 'escaped').map((a) => a.studentId)
  );

  const totalEnrolled = students.length;
  const hasAttendanceRecords = todayRecords.length > 0;
  const totalPresent = hasAttendanceRecords ? presentStudentIds.size : 0;
  const totalAbsent = hasAttendanceRecords ? (absentStudentIds.size > 0 ? absentStudentIds.size : Math.max(0, totalEnrolled - totalPresent)) : 0;
  const totalLate = lateStudentIds.size;
  const totalEscaped = escapedStudentIds.size;
  const overallAttendanceRate = (totalEnrolled > 0 && hasAttendanceRecords) ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  // Grade breakdown
  const gradeLevels: { gradeLevel: GradeLevel; gradeName: string }[] = [
    { gradeLevel: 1, gradeName: 'الصف الأول الصناعي' },
    { gradeLevel: 2, gradeName: 'الصف الثاني الصناعي' },
    { gradeLevel: 3, gradeName: 'الصف الثالث الصناعي (دبلوم)' },
    { gradeLevel: 4, gradeName: 'الفرقة الرابعة المتقدمة' },
    { gradeLevel: 5, gradeName: 'الفرقة الخامسة (دبلوم متقدم)' },
  ];

  const byGrade = gradeLevels
    .map((g) => {
      const gradeStudents = students.filter((s) => s.gradeLevel === g.gradeLevel);
      const enrolled = gradeStudents.length;
      if (enrolled === 0) return null;
      const present = hasAttendanceRecords ? gradeStudents.filter((s) => presentStudentIds.has(s.id)).length : 0;
      const absent = hasAttendanceRecords ? Math.max(0, enrolled - present) : 0;
      const rate = (enrolled > 0 && hasAttendanceRecords) ? Math.round((present / enrolled) * 100) : 0;

      return {
        gradeLevel: g.gradeLevel,
        gradeName: g.gradeName,
        enrolled,
        present,
        absent,
        rate,
      };
    })
    .filter(Boolean) as any[];

  // Department breakdown
  const byDepartment = departments.map((d) => {
    const deptStudents = students.filter((s) => s.departmentId === d.id);
    const enrolled = deptStudents.length;
    const present = hasAttendanceRecords ? deptStudents.filter((s) => presentStudentIds.has(s.id)).length : 0;
    const absent = hasAttendanceRecords ? Math.max(0, enrolled - present) : 0;
    const rate = (enrolled > 0 && hasAttendanceRecords) ? Math.round((present / enrolled) * 100) : 0;

    return {
      departmentId: d.id,
      departmentName: d.name,
      enrolled,
      present,
      absent,
      rate,
    };
  });

  return {
    date: dateStr,
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

    const isDayHoliday = isHolidayDate(date, schoolConfig).isHoliday || studentSubmission.status === 'holiday';

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
    } else if (isDayHoliday || studentSubmission.status === 'holiday') {
      // Holiday preserved without penalty
    }

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
        noticeTitle: 'قرار فصل لتجاوز المدة القانونية للغياب (15 يوماً متصلاً / 30 يوماً منفصلاً)',
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
    } else if ((consecAbs >= 10 || totalAbs >= 20) && warningLevel < 2) {
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
        noticeTitle: 'إنذار ثان بالغياب (10 أيام متصلة أو 20 منفصلة)',
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
    } else if ((consecAbs >= 5 || totalAbs >= 10) && warningLevel < 1) {
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
        noticeTitle: 'إنذار أول بالغياب (5 أيام متصلة أو 10 منفصلة)',
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
  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  if (newWarningsCount > 0) {
    setStoredData(STORAGE_KEYS.NOTICES, currentNotices);
  }

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

  // Process all student daily records
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
        // If status was cleared / became empty, remove the record
        updatedRecords.splice(existingIndex, 1);
      }
    });
  });

  // Calculate updated absence statistics per student for the week
  const updatedStudents = currentStudents.map((student) => {
    const studentSubmission = records.find((r) => r.studentId === student.id);
    if (!studentSubmission) return student;

    // Count new absences and excused in this submission for this week
    let weekAbsences = 0;
    let weekExcused = 0;
    let lastStatus: AttendanceStatus = 'present';
    let lastDate = student.lastAbsenceDate;

    weekDays.forEach((day) => {
      const isDayHoliday = (day as any).isHoliday || isHolidayDate(day.date, schoolConfig).isHoliday;
      const st = studentSubmission.dayStatuses[day.date];
      if (!isDayHoliday && st !== 'holiday' && (st === 'absent' || st === 'escaped')) {
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
        noticeTitle: 'قرار فصل لتجاوز المدة القانونية للغياب (15 يوماً متصلاً / 30 يوماً منفصلاً)',
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
    } else if ((consecAbs >= 10 || totalAbs >= 20) && warningLevel < 2) {
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
        noticeTitle: 'إنذار ثان بالغياب (10 أيام متصلة أو 20 منفصلة)',
        issueDate: weekDays[weekDays.length - 1]?.date || new Date().toISOString().split('T')[0],
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
    } else if ((consecAbs >= 5 || totalAbs >= 10) && warningLevel < 1) {
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
        noticeTitle: 'إنذار أول بالغياب (5 أيام متصلة أو 10 منفصلة)',
        issueDate: weekDays[weekDays.length - 1]?.date || new Date().toISOString().split('T')[0],
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
      lastAbsenceDate: lastDate,
    };
  });

  setStoredData(STORAGE_KEYS.ATTENDANCE, updatedRecords);
  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
  if (newWarningsCount > 0) {
    setStoredData(STORAGE_KEYS.NOTICES, currentNotices);
  }

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
  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
};

export const reinstateStudent = (studentId: string, receiptNumber: string, feeAmount: number = 25) => {
  const students = getStudents();
  const notices = getNotices();
  const schoolConfig = getSchoolConfig();

  const updatedStudents = students.map((std) => {
    if (std.id === studentId) {
      return {
        ...std,
        consecutiveAbsenceDays: 0,
        warningLevel: 0 as const,
        notes: `تمت إعادة القيد بتاريخ ${new Date().toLocaleDateString('ar-EG')} بإيصال 33 ع.ح رقم (${receiptNumber}) وسداد رسم ${feeAmount} ج.م`,
      };
    }
    return std;
  });

  const student = students.find((s) => s.id === studentId);
  if (student) {
    const reinstatementNotice: OfficialNotice = {
      id: `not_${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      nationalId: student.nationalId,
      studentCode: student.studentCode,
      departmentName: '',
      className: '',
      noticeType: 'reinstatement',
      noticeTitle: `إشعار إعادة قيد الطالب بموجب إيصال رقم ${receiptNumber}`,
      issueDate: new Date().toISOString().split('T')[0],
      consecutiveDays: 0,
      totalDays: student.totalAbsenceDays,
      serialNumber: `ق/إق/${new Date().getFullYear()}/${String(notices.length + 1).padStart(3, '0')}`,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
      schoolName: schoolConfig.name,
      educationalDirectorate: schoolConfig.directorate,
      administration: schoolConfig.administration,
      isDelivered: true,
      notes: `تم سداد الرسوم وإعادة قيد الطالب رسمياً لمواصلة الدراسة وتدريبات الورش.`,
    };
    notices.unshift(reinstatementNotice);
    setStoredData(STORAGE_KEYS.NOTICES, notices);
  }

  setStoredData(STORAGE_KEYS.STUDENTS, updatedStudents);
};

// Competency Units & Assessments Management
export const saveCompetencyUnit = (unitData: Omit<CompetencyUnit, 'id'> & { id?: string }): CompetencyUnit => {
  const units = getCompetencyUnits();
  if (unitData.id) {
    const index = units.findIndex((u) => u.id === unitData.id);
    if (index !== -1) {
      const updatedUnit: CompetencyUnit = {
        ...(unitData as CompetencyUnit),
      };
      units[index] = updatedUnit;
      setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, units);
      return updatedUnit;
    }
  }

  const newUnit: CompetencyUnit = {
    ...unitData,
    id: `unit_${Date.now()}`,
  } as CompetencyUnit;
  units.push(newUnit);
  setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, units);
  return newUnit;
};

export const deleteCompetencyUnit = (unitId: string): void => {
  const units = getCompetencyUnits();
  const updatedUnits = units.filter((u) => u.id !== unitId);
  setStoredData(STORAGE_KEYS.COMPETENCY_UNITS, updatedUnits);

  // Also clean up assessments linked to this unit
  const assessments = getCompetencyAssessments();
  const updatedAssessments = assessments.filter((a) => a.unitId !== unitId);
  setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, updatedAssessments);
  deleteRowFromCloud('competency_units', unitId);
};

export const saveCompetencyAssessment = (assessment: StudentCompetencyAssessment): void => {
  const assessments = getCompetencyAssessments();
  const index = assessments.findIndex(
    (a) =>
      a.studentId === assessment.studentId &&
      a.unitId === assessment.unitId &&
      a.outcomeId === assessment.outcomeId
  );

  const updatedRecord: StudentCompetencyAssessment = {
    ...assessment,
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    assessments[index] = updatedRecord;
  } else {
    assessments.push({
      ...updatedRecord,
      id: updatedRecord.id || `ass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
  }

  setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, assessments);
};

export const bulkSaveCompetencyAssessments = (newAssessments: StudentCompetencyAssessment[]): void => {
  const assessments = getCompetencyAssessments();
  const assessmentMap = new Map<string, StudentCompetencyAssessment>();

  assessments.forEach((a) => {
    const key = `${a.studentId}_${a.unitId}_${a.outcomeId}`;
    assessmentMap.set(key, a);
  });

  newAssessments.forEach((a) => {
    const key = `${a.studentId}_${a.unitId}_${a.outcomeId}`;
    assessmentMap.set(key, {
      ...a,
      id: a.id || (assessmentMap.get(key)?.id ?? `ass_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
      updatedAt: new Date().toISOString(),
    });
  });

  const merged = Array.from(assessmentMap.values());
  setStoredData(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, merged);
};

export const resetToDefaultData = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(MOCK_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(MOCK_DEPARTMENTS));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(MOCK_CLASSES));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(MOCK_ATTENDANCE_HISTORY));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(MOCK_NOTICES));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(MOCK_USERS[0]));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(SCHOOL_CONFIG));
  localStorage.setItem(STORAGE_KEYS.TRANSFER_LOGS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WORKSHOP_VIOLATIONS, JSON.stringify(MOCK_WORKSHOP_VIOLATIONS));
  localStorage.setItem(STORAGE_KEYS.COMPETENCY_UNITS, JSON.stringify(MOCK_COMPETENCY_UNITS));
  localStorage.setItem(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, JSON.stringify(MOCK_COMPETENCY_ASSESSMENTS));
  localStorage.setItem(STORAGE_KEYS.SOCIAL_CASES, JSON.stringify(MOCK_SOCIAL_CASES));
  localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, JSON.stringify(true));
  window.dispatchEvent(new Event('egyptian_school_storage_update'));
};

// =========================================================================
// 1-Click Complete System Backup & Restore
// =========================================================================

export const exportBackupData = (): BackupPackage => {
  const config = getSchoolConfig();
  const users = getUsers();
  const students = getStudents();
  const departments = getDepartments();
  const classes = getClasses();
  const attendance = getAttendance();
  const notices = getNotices();
  const workshopViolations = getWorkshopViolations();
  const transferLogs = getTransferLogs();
  const competencyUnits = getCompetencyUnits();
  const competencyAssessments = getCompetencyAssessments();
  const socialCases = getSocialCases();

  return {
    version: '2.0.0',
    system: 'EGYPTIAN_VOCATIONAL_SCHOOL_MANAGEMENT',
    exportDate: new Date().toISOString(),
    schoolName: config.name,
    data: {
      config,
      users,
      students,
      departments,
      classes,
      attendance,
      notices,
      workshopViolations,
      transferLogs,
      competencyUnits,
      competencyAssessments,
      socialCases,
    },
  };
};

export const importBackupData = (
  rawBackup: string | BackupPackage
): { success: boolean; message: string; stats?: any } => {
  if (typeof window === 'undefined') {
    return { success: false, message: 'بيئة غير مدعومة' };
  }

  try {
    const pkg: BackupPackage =
      typeof rawBackup === 'string' ? JSON.parse(rawBackup) : rawBackup;

    if (!pkg.data || !pkg.data.students || !pkg.data.config) {
      return {
        success: false,
        message: 'ملف النسخة الاحتياطية غير صالح أو تالف ولا يحتوي على بنية بيانات المنظومة.',
      };
    }

    // Set each item to localStorage
    if (pkg.data.config) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(pkg.data.config));
    if (pkg.data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(pkg.data.users));
    if (pkg.data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(pkg.data.students));
    if (pkg.data.departments) localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(pkg.data.departments));
    if (pkg.data.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(pkg.data.classes));
    if (pkg.data.attendance) localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(pkg.data.attendance));
    if (pkg.data.notices) localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(pkg.data.notices));
    if (pkg.data.workshopViolations) localStorage.setItem(STORAGE_KEYS.WORKSHOP_VIOLATIONS, JSON.stringify(pkg.data.workshopViolations));
    if (pkg.data.transferLogs) localStorage.setItem(STORAGE_KEYS.TRANSFER_LOGS, JSON.stringify(pkg.data.transferLogs));
    if (pkg.data.competencyUnits) localStorage.setItem(STORAGE_KEYS.COMPETENCY_UNITS, JSON.stringify(pkg.data.competencyUnits));
    if (pkg.data.competencyAssessments) localStorage.setItem(STORAGE_KEYS.COMPETENCY_ASSESSMENTS, JSON.stringify(pkg.data.competencyAssessments));
    if (pkg.data.socialCases) localStorage.setItem(STORAGE_KEYS.SOCIAL_CASES, JSON.stringify(pkg.data.socialCases));

    window.dispatchEvent(new Event('egyptian_school_storage_update'));

    return {
      success: true,
      message: 'تمت استعادة النسخة الاحتياطية بنجاح ومطابقة كافة السجلات المدرسية.',
      stats: {
        studentsCount: pkg.data.students.length,
        classesCount: pkg.data.classes.length,
        departmentsCount: pkg.data.departments.length,
        attendanceCount: pkg.data.attendance.length,
        noticesCount: pkg.data.notices.length,
        unitsCount: pkg.data.competencyUnits?.length || 0,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطأ أثناء قراءة ملف النسخة الاحتياطية: ${err?.message || 'تنسيق غير صالح'}`,
    };
  }
};

// =========================================================================
// Smart Early-Warning & Proactive Notification Engine
// =========================================================================

export const getSmartEarlyWarnings = (): EarlyWarningAlert[] => {
  const students = getStudents();
  const classes = getClasses();
  const departments = getDepartments();
  const notices = getNotices();
  const config = getSchoolConfig();
  const violations = getWorkshopViolations();

  const alerts: EarlyWarningAlert[] = [];

  students.forEach((student) => {
    const studentClass = classes.find((c) => c.id === student.classId);
    const studentDept = departments.find((d) => d.id === student.departmentId);

    // 1. Approaching 1st Warning (4 consecutive days, or 8-9 total days)
    if (student.consecutiveAbsenceDays === 4 && student.warningLevel === 0) {
      alerts.push({
        id: `warn_early_1_${student.id}`,
        type: 'approaching_warning_1',
        severity: 'warning',
        title: 'طالب على وشك الإنذار الأول (غياب متصل)',
        message: `الطالب ${student.fullName} غائب 4 أيام متصلة، غيابه غداً يستوجب إصدار إنذار أول رسمي (5 أيام متصلة).`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        classId: student.classId,
        className: studentClass?.name || '',
        departmentId: student.departmentId,
        departmentName: studentDept?.name || '',
        targetTab: 'notices',
        actionLabel: 'تجهيز إنذار أول',
      });
    } else if (student.totalAbsenceDays >= 8 && student.totalAbsenceDays < 10 && student.warningLevel === 0) {
      alerts.push({
        id: `warn_early_total_1_${student.id}`,
        type: 'approaching_warning_1',
        severity: 'warning',
        title: 'طالب على وشك الإنذار الأول (غياب منفصل)',
        message: `الطالب ${student.fullName} بلغ ${student.totalAbsenceDays} أيام غياب منفصل، واقترب من الحد القانوني (10 أيام).`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        classId: student.classId,
        className: studentClass?.name || '',
        departmentId: student.departmentId,
        departmentName: studentDept?.name || '',
        targetTab: 'notices',
        actionLabel: 'متابعة شيت الغياب',
      });
    }

    // 2. Approaching 2nd Warning (9 consecutive days or 18-19 total days)
    if (student.consecutiveAbsenceDays === 9 && student.warningLevel === 1) {
      alerts.push({
        id: `warn_early_2_${student.id}`,
        type: 'approaching_warning_2',
        severity: 'critical',
        title: 'طالب يستحق إنذاراً ثانياً عاجلاً',
        message: `الطالب ${student.fullName} غائب 9 أيام متصلة مسجل له إنذار أول سابق، يستحق إنذاراً ثانياً بكتاب موصى عليه.`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        classId: student.classId,
        className: studentClass?.name || '',
        departmentId: student.departmentId,
        departmentName: studentDept?.name || '',
        targetTab: 'notices',
        actionLabel: 'إصدار إنذار ثان',
      });
    }

    // 3. Approaching Expulsion (14 consecutive days or 28-29 total days)
    if ((student.consecutiveAbsenceDays === 14 || student.totalAbsenceDays >= 28) && student.warningLevel <= 2) {
      alerts.push({
        id: `warn_expulsion_${student.id}`,
        type: 'approaching_expulsion',
        severity: 'critical',
        title: '⚠️ خطر الفصل النهائي لتجاوز المدد القانونية',
        message: `الطالب ${student.fullName} على وشك الفصل النهائي (15 يوماً متصلاً أو 30 منفصلاً)، يتطلب تدخلاً عاجلاً من لجنة الحماية المدرسية.`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        classId: student.classId,
        className: studentClass?.name || '',
        departmentId: student.departmentId,
        departmentName: studentDept?.name || '',
        targetTab: 'notices',
        actionLabel: 'فتح ملف الطالب',
      });
    }

    // 4. Competency Workshop Attendance at Risk (Between 85% and 88%)
    const totalWorkshopHours = 120;
    const workshopPresentHours = Math.max(0, totalWorkshopHours - (student.workshopAbsenceHours || 0));
    const workshopRate = Math.round((workshopPresentHours / totalWorkshopHours) * 100);

    if (workshopRate >= 85 && workshopRate <= 88 && (student.workshopAbsenceHours || 0) > 0) {
      alerts.push({
        id: `warn_comp_risk_${student.id}`,
        type: 'competency_at_risk',
        severity: 'warning',
        title: 'خطر الحرمان من تقييم الجدارات (نسبة الورش)',
        message: `نسبة حضور الطالب ${student.fullName} في الورش تدنت إلى ${workshopRate}% (الحد الأدنى 85%). أي غياب إضافي يحرمه من التقييم.`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        classId: student.classId,
        className: studentClass?.name || '',
        departmentId: student.departmentId,
        departmentName: studentDept?.name || '',
        targetTab: 'competencies',
        actionLabel: 'كشف الجدارات 85%',
      });
    }
  });

  // 5. Workshop Escape alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEscapes = violations.filter((v) => v.violationType === 'workshop_escape' && v.date === todayStr);
  if (todayEscapes.length > 0) {
    alerts.push({
      id: `alert_escapes_today`,
      type: 'workshop_escape',
      severity: 'critical',
      title: `رصد حالات تزويغ من الورش اليوم (${todayEscapes.length} طالب)`,
      message: `تم رصد ${todayEscapes.length} حالات هروب من فترات تدريب الورش بعد طابور الصباح تتطلب إجراء انضباطي.`,
      targetTab: 'safety',
      actionLabel: 'سجل مخالفات الورش',
      count: todayEscapes.length,
    });
  }

  // 6. Pending notices
  const pendingNotices = notices.filter((n) => !n.isDelivered);
  if (pendingNotices.length > 0) {
    alerts.push({
      id: `alert_pending_notices`,
      type: 'pending_notices',
      severity: 'info',
      title: `إنذارات رسمية قيد التسليم بالبريد (${pendingNotices.length})`,
      message: `يوجد ${pendingNotices.length} خطاب إنذار رسمي صادر لم يتم تسجيل إشعار استلامه بعلم الوصول بعد.`,
      targetTab: 'notices',
      actionLabel: 'متابعة دفاتر الإنذارات',
      count: pendingNotices.length,
    });
  }

  return alerts;
};

