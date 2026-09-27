import {
  Department,
  SchoolClass,
  Student,
  User,
  OfficialNotice,
  AttendanceRecord,
  SchoolConfig,
  WorkshopViolationRecord,
  CompetencyUnit,
  StudentCompetencyAssessment,
  Holiday,
} from '@/types';

export const DEFAULT_EGYPTIAN_HOLIDAYS: Holiday[] = [
  {
    id: 'hol_6oct',
    name: 'عيد القوات المسلحة (نصر 6 أكتوبر)',
    startDate: '2025-10-06',
    endDate: '2025-10-06',
    type: 'official',
    description: 'عطلة رسمية بمناسبة ذكرى نصر أكتوبر المجيد',
  },
  {
    id: 'hol_coptic_xmas',
    name: 'عيد الميلاد المجيد',
    startDate: '2026-01-07',
    endDate: '2026-01-07',
    type: 'official',
    description: 'عطلة رسمية بمناسبة عيد الميلاد المجيد',
  },
  {
    id: 'hol_25jan',
    name: 'ثورة 25 يناير وعيد الشرطة',
    startDate: '2026-01-25',
    endDate: '2026-01-25',
    type: 'official',
    description: 'عطلة رسمية بمناسبة ثورة 25 يناير وعيد الشرطة',
  },
  {
    id: 'hol_midyear',
    name: 'إجازة نصف العام الدراسي',
    startDate: '2026-01-24',
    endDate: '2026-02-05',
    type: 'official',
    isTermBreak: true,
    description: 'إجازة منتصف العام المعتمدة من وزارة التربية والتعليم',
  },
  {
    id: 'hol_eid_fitr',
    name: 'عيد الفطر المبارك',
    startDate: '2026-03-20',
    endDate: '2026-03-23',
    type: 'official',
    description: 'عطلة رسمية بمناسبة عيد الفطر المبارك',
  },
  {
    id: 'hol_sham_nessim',
    name: 'عيد شم النسيم',
    startDate: '2026-04-13',
    endDate: '2026-04-13',
    type: 'official',
    description: 'عطلة رسمية بمناسبة عيد الربيع وشم النسيم',
  },
  {
    id: 'hol_sinai',
    name: 'عيد تحرير سيناء',
    startDate: '2026-04-25',
    endDate: '2026-04-25',
    type: 'official',
    description: 'عطلة رسمية بمناسبة ذكرى تحرير سيناء',
  },
  {
    id: 'hol_labor',
    name: 'عيد العمال',
    startDate: '2026-05-01',
    endDate: '2026-05-01',
    type: 'official',
    description: 'عطلة رسمية بمناسبة عيد العمال العالمي',
  },
  {
    id: 'hol_eid_adha',
    name: 'عيد الأضحى المبارك',
    startDate: '2026-05-26',
    endDate: '2026-05-30',
    type: 'official',
    description: 'عطلة رسمية بمناسبة وقفة عرفات وعيد الأضحى المبارك',
  },
];

export const SCHOOL_CONFIG: SchoolConfig = {
  name: 'المدرسة الفنية الصناعية المتقدمة العسكرية',
  directorate: 'مديرية التربية والتعليم',
  administration: 'إدارة التعليم الفني الصناعي',
  academicYear: '2025 / 2026',
  currentTerm: 'الفصل الدراسي الأول',
  term1StartDate: '2025-09-20',
  term1EndDate: '2026-01-22',
  midYearBreakStartDate: '2026-01-24',
  midYearBreakEndDate: '2026-02-05',
  term2StartDate: '2026-02-07',
  term2EndDate: '2026-06-04',
  holidays: DEFAULT_EGYPTIAN_HOLIDAYS,
  schoolSystemType: 'both_systems', // يدعم نظامي الـ 3 سنوات والـ 5 سنوات
  schoolShiftType: 'single_morning', // فترة واحدة صباحية
  workDaysScheme: 'sun_to_thu',      // من الأحد إلى الخميس
  morningQueueTime: '07:30 ص',
  eveningQueueTime: '12:30 م',
  phone: '',
  address: '',
  postalCode: '',
  managerName: '',
  managerTitle: 'مدير عام المدرسة',
  studentAffairsHead: '',
  studentAffairsAgent: '',
  theoreticalMinAttendanceRate: 75,
  practicalMinAttendanceRate: 85,
};

export const MOCK_USERS: User[] = [
  {
    id: 'user_admin',
    name: 'مدير النظام',
    username: 'admin',
    password: '123',
    role: 'principal',
    roleTitle: 'مدير عام المدرسة / مدير النظام',
    phone: '',
    customPermissions: {
      canTakeAttendance: true,
      canManageStudents: true,
      canTransferStudents: true,
      canApproveExcuses: true,
      canIssueNotices: true,
      canManageSchoolSettings: true,
      canManageUsers: true,
      canViewReports: true,
      canManageCompetencies: true,
      canLogViolations: true,
      canManageSocialCases: true,
    },
  },
  {
    id: 'user_social_worker',
    name: 'أ. أحمد السيد إبراهيم',
    username: 'social',
    password: '123',
    role: 'social_worker',
    roleTitle: 'الأخصائي الاجتماعي والتربوي / منسق الحماية المدرسية',
    phone: '01023456789',
    customPermissions: {
      canTakeAttendance: false,
      canManageStudents: true,
      canTransferStudents: false,
      canApproveExcuses: true,
      canIssueNotices: true,
      canManageSchoolSettings: false,
      canManageUsers: false,
      canViewReports: true,
      canManageCompetencies: false,
      canLogViolations: true,
      canManageSocialCases: true,
    },
  },
];

export const MOCK_DEPARTMENTS: Department[] = [];

export const MOCK_CLASSES: SchoolClass[] = [];

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_NOTICES: OfficialNotice[] = [];

export const MOCK_ATTENDANCE_HISTORY: AttendanceRecord[] = [];

export const MOCK_WORKSHOP_VIOLATIONS: WorkshopViolationRecord[] = [];

export const MOCK_COMPETENCY_UNITS: CompetencyUnit[] = [];

export const MOCK_COMPETENCY_ASSESSMENTS: StudentCompetencyAssessment[] = [];

export const MOCK_SOCIAL_CASES: import('@/types').SocialCaseRecord[] = [];

