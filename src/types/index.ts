export type UserRole =
  | 'principal'          // مدير عام المدرسة
  | 'affairs_deputy'     // وكيل شئون الطلاب
  | 'affairs_officer'    // مسئول شئون الطلاب
  | 'social_worker'      // الأخصائي الاجتماعي والتربوي / المرشد الطلابي
  | 'competency_officer' // منسق ومسئول الجدارات والتقييم
  | 'dept_head'          // رئيس قسم صناعي
  | 'teacher';           // معلم / مدرب ورشة

export type PortalType =
  | 'parent'
  | 'principal'
  | 'dept_head'
  | 'competencies'
  | 'affairs'
  | 'social_worker'
  | 'teacher';

export interface UserPermission {
  canTakeAttendance: boolean;       // تسجيل الحضور والغياب للورش والفصول
  canManageStudents: boolean;       // إضافة وتعديل وحذف الطلاب
  canTransferStudents: boolean;     // نقل الطلاب بين الفصول والتخصصات
  canApproveExcuses: boolean;       // اعتماد الأعذار الطبية والرسمية
  canIssueNotices: boolean;         // إصدار وطباعة الإنذارات وقرارات الفصل
  canManageSchoolSettings: boolean; // تعديل بيانات المدرسة والأقسام
  canManageUsers: boolean;          // إدارة الحسابات وكلمات المرور والصلاحيات
  canViewReports: boolean;          // الاطلاع على التقارير والإحصائيات العامة
  canManageCompetencies: boolean;   // متابعة نسب الجدارات المهنية
  canLogViolations: boolean;        // تسجيل مخالفات السلامة والهروب
  canManageSocialCases?: boolean;   // إدارة ملفات ودراسة حالات الأخصائي الاجتماعي
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  departmentId?: string;
  assignedClassIds?: string[];
  phone?: string;
  customPermissions?: UserPermission;
}

export type SchoolSystemType = 
  | '3_years'             // نظام الـ 3 سنوات (دبلوم المدارس الثانوية الفنية الصناعية)
  | '5_years_advanced'    // نظام الـ 5 سنوات (المدارس الفنية الصناعية المتقدمة)
  | 'both_systems'        // مدرسة تضم نظامي 3 و 5 سنوات
  | 'applied_technology'  // مدارس التكنولوجيا التطبيقية
  | 'dual_education';     // التعليم والتدريب المزدوج

export type SchoolShiftType = 
  | 'single_morning'      // فترة واحدة صباحية
  | 'two_shifts'           // فترتان دراسيتان (صباحية ومسائية)
  | 'single_full_day';    // فترة كاملة ممتدة

export type WorkDaysScheme = 
  | 'sun_to_thu'          // من الأحد إلى الخميس (5 أيام عمل - الجمعة والسبت عطلة)
  | 'sat_to_thu'          // من السبت إلى الخميس (6 أيام عمل - الجمعة عطلة)
  | 'sat_to_wed';         // من السبت إلى الأربعاء (5 أيام عمل - الخميس والجمعة عطلة)

export type HolidayType = 
  | 'official'    // عطلة رسمية مجدولة (أعياد وطنية ودينية)
  | 'emergency';  // عطلة اضطرارية طارئة (أحوال جوية، أمطار وسيول، قرارات المحافظة)

export interface Holiday {
  id: string;
  name: string;             // اسم العطلة (مثل: ذكرى 6 أكتوبر، عيد الفطر، سوء الأحوال الجوية)
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  type: HolidayType;        // official | emergency
  description?: string;     // سبب العطلة أو القرار الوزاري / قرار المحافظ
  isTermBreak?: boolean;    // هل هي إجازة نصف العام
}

export interface SchoolConfig {
  name: string;
  directorate: string; // مديرية التربية والتعليم
  administration: string; // الإدارة التعليمية
  academicYear: string;
  currentTerm: string;
  // التواريخ الرسمية للعام الدراسي والفصول الدراسية
  term1StartDate?: string;       // بداية الفصل الدراسي الأول
  term1EndDate?: string;         // نهاية الفصل الدراسي الأول
  midYearBreakStartDate?: string;// بداية إجازة نصف العام
  midYearBreakEndDate?: string;  // نهاية إجازة نصف العام
  term2StartDate?: string;       // بداية الفصل الدراسي الثاني
  term2EndDate?: string;         // نهاية الفصل الدراسي الثاني
  holidays?: Holiday[];          // قائمة العطلات الرسمية والاضطرارية
  schoolSystemType: SchoolSystemType; // 3 سنوات أم 5 سنوات
  schoolShiftType: SchoolShiftType;   // نظام الفترات (فترة واحدة / فترتان)
  workDaysScheme: WorkDaysScheme;     // نظام أيام العمل الأسبوعية
  morningQueueTime?: string;          // موعد طابور الصباح
  eveningQueueTime?: string;          // موعد طابور الفترة المسائية
  phone: string;
  address: string;
  postalCode?: string;
  managerName: string;
  managerTitle: string;
  studentAffairsHead: string;
  studentAffairsAgent?: string;
  theoreticalMinAttendanceRate: number; // نسبة حضور النظري الإلزامية (75%)
  practicalMinAttendanceRate: number;   // نسبة حضور الورش الإلزامية (85%)
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  scientificSupervisorName: string; // مشرف القسم العلمي (المواد الفنية والنظرية)
  practicalSupervisorName: string;  // مشرف القسم العملي (التدريب العملي والورش)
  headName?: string; // التوافق مع السجلات القديمة
  headPhone?: string;
  iconName: string;
  totalStudents: number;
  workshopCount: number;
  availableGrades: GradeLevel[]; // الصفوف المتاحة بالقسم (1,2,3 للـ 3 سنوات و 1..5 للـ 5 سنوات)
}

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export interface SchoolClass {
  id: string;
  name: string; // e.g., 1/1 كهرباء
  gradeLevel: GradeLevel;
  gradeName: string; // الصف الأول الصناعي / الفرقة الرابعة المتقدمة
  departmentId: string;
  departmentName: string;
  supervisorTeacherId: string;
  supervisorTeacherName: string;
  roomNumber: string;
  studentCount: number;
  shift?: 'morning' | 'evening'; // الفترة: صباحية أم مسائية
}

export type StudentStatus = 'منتظم' | 'خدمات' | 'نظام عمال' | 'دمج';

export interface StudentTransferLog {
  id: string;
  studentId: string;
  fromClassId: string;
  fromClassName: string;
  fromDeptId: string;
  fromDeptName: string;
  toClassId: string;
  toClassName: string;
  toDeptId: string;
  toDeptName: string;
  date: string;
  reason: string;
  officerName: string;
}

// Safety Violations & Escape in Industrial Workshops
export type SafetyViolationType =
  | 'no_uniform'         // عدم ارتداء الأفرول / الزي المخصص للورشة
  | 'no_safety_shoes'    // عدم ارتداء حذاء الأمان (Safety Shoes)
  | 'no_safety_glasses'  // عدم ارتداء نظارات الحماية أثناء الخراطة/اللحام
  | 'tools_misuse'       // استخدام خاطئ للعدد والماكينات
  | 'workshop_escape'    // الهروب/التزويغ من فترة التدريب بالورشة بعد طابور الصباح
  | 'behavioral';        // مخالفة سلوكية داخل الورشة

export interface WorkshopViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  departmentId: string;
  departmentName: string;
  date: string;
  violationType: SafetyViolationType;
  violationTitle: string;
  description: string;
  instructorName: string;
  actionTaken: string; // مثل: استدعاء ولي الأمر، تنبيه كتابي، حرمان من استخدام الماكينة
}

// Competency Status (نظام الجدارات المهنية)
export type CompetencyAttendanceStatus =
  | 'eligible'           // مستوفٍ لنسبة الحضور ومؤهل للتقييم (>= 85% ورش و >= 75% نظري)
  | 'at_risk'            // في خطر الحرمان من تقييم الجدارة
  | 'ineligible'         // محروم من التقييم بسبب تجاوز نسبة الغياب
  | 'reassessment';      // فرصة تقييم ثانية (دور ثانٍ)

// نتائج تقييم الجدارات المهنية تبعا للائحة التعليم الفني المصرية
export type CompetencyEvaluationResult =
  | 'first_attempt_pass'    // اجتاز من المرة الأولى (جدير من التقييم الأول)
  | 'second_attempt_pass'   // اجتاز من الفترة الثانية (جدير من التقييم الثاني)
  | 'remedial_program'      // برنامج علاجي (إعادة تدريب وتقييم علاجي)
  | 'not_competent'         // لم يجتاز (غير جدير)
  | 'pending';              // قيد التقييم / لم يرصد

export interface LearningOutcome {
  id: string;
  code: string;             // مثل LO1, LO2
  title: string;            // عنوان المخرج (مثل: تجهيز العدد والمهمات اللازمة للتوصيل)
  description?: string;
  weightHours?: number;     // الساعات المخصصة للمخرج
}

export interface CompetencyUnit {
  id: string;
  code: string;             // كود الوحدة مثلاً ELE-101
  name: string;             // اسم الوحدة
  departmentId: string;     // التخصص / القسم
  gradeLevel: GradeLevel;   // الصف الدراسي (1, 2, 3, 4, 5)
  term: 'term_1' | 'term_2' | 'full_year';
  outcomesCount: number;    // عدد مخرجات التعلم
  outcomes: LearningOutcome[];
  totalHours: number;       // إجمالي الساعات
  description?: string;
}

export interface StudentCompetencyAssessment {
  id: string;
  studentId: string;
  studentName: string;
  nationalId?: string;
  studentCode?: string;
  classId: string;
  departmentId: string;
  gradeLevel: GradeLevel;
  unitId: string;
  unitCode: string;
  unitName: string;
  outcomeId: string;        // معرف مخرج التعلم أو 'unit_overall'
  outcomeCode: string;
  outcomeTitle: string;
  result: CompetencyEvaluationResult;
  firstAttemptDate?: string;   // تاريخ التقييم الأول
  secondAttemptDate?: string;  // تاريخ التقييم الثاني
  remedialDate?: string;       // تاريخ البرنامج العلاجي
  assessorTeacherName?: string;// اسم المعلم المقيم
  internalVerifierName?: string;// اسم المحقق الداخلي
  notes?: string;
  updatedAt?: string;
}

// Early Warning Alert System
export type EarlyWarningType =
  | 'approaching_warning_1'
  | 'approaching_warning_2'
  | 'approaching_expulsion'
  | 'competency_at_risk'
  | 'workshop_escape'
  | 'pending_notices';

export interface EarlyWarningAlert {
  id: string;
  type: EarlyWarningType;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  studentId?: string;
  studentName?: string;
  nationalId?: string;
  classId?: string;
  className?: string;
  departmentId?: string;
  departmentName?: string;
  count?: number;
  targetTab: string;
  actionLabel: string;
}

// Social Specialist / Counseling System Types (منظومة الأخصائي الاجتماعي والإرشاد الطلابي)
export type SocialCaseStatus =
  | 'pending'      // قيد الانتظار / إحالة جديدة
  | 'in_progress'  // جاري المتابعة ودراسة الحالة
  | 'resolved'     // تم العلاج والتحسن
  | 'escalated'    // تم التصعيد (لإدارة المدرسة / لجنة الحماية المدرسية)
  | 'closed';      // مغلقة ومحفوظة

export type SocialCasePriority = 'urgent' | 'high' | 'medium' | 'routine';

export type SocialCaseCategory =
  | 'absence_dropout_risk'         // خطر الغياب المتكرر والتسرب
  | 'workshop_escape_behavior'     // التزويغ والهروب من ورش التدريب العملي
  | 'academic_competency_struggle' // تعثر الجدارات والبرامج العلاجية
  | 'economic_social_circumstances'// ظروف اقتصادية أو أسرية طارئة
  | 'safety_violation_repetition'  // تكرار مخالفات السلامة والسلوك العدواني
  | 'psychological_counseling'     // إرشاد نفسي وتكيف مهني
  | 'general';                     // إرشاد عام

export type SocialSessionType =
  | 'individual_counseling' // جلسة إرشاد فردي
  | 'guardian_meeting'     // مقابلة ولي الأمر وبحث الحالة
  | 'behavioral_contract'  // توقيع ميثاق وتعهد سلوكي
  | 'workshop_visit'       // متابعة ميدانية بورشة التخصص
  | 'home_visit';          // بحث ميداني / زيارة منزلية

export interface SocialSessionRecord {
  id: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  sessionType: SocialSessionType;
  sessionTitle: string;
  summary: string;
  studentCommitments?: string; // التزامات وتعهدات الطالب
  guardianCommitments?: string;// التزامات ولي الأمر
  recommendations: string;     // التوجيهات والتوصيات الإجرائية
  specialistName: string;
  outcome: 'improved' | 'stable' | 'needs_followup' | 'no_response';
  createdAt: string;
}

export interface SocialCaseRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  nationalId: string;
  classId: string;
  className: string;
  departmentId: string;
  departmentName: string;
  gradeLevel: GradeLevel;
  guardianName: string;
  guardianPhone: string;
  address?: string;

  // Referral Metadata
  referralDate: string; // YYYY-MM-DD
  referralSource: 'ai_prediction' | 'affairs' | 'teacher' | 'dept_head' | 'principal' | 'self';
  referralReason: string;
  aiRiskScore?: number; // 0 - 100%
  aiRiskLevel?: 'critical' | 'high' | 'medium' | 'safe';
  aiRootCauses?: string[];
  aiRecommendations?: string[];

  // Case Details
  status: SocialCaseStatus;
  priority: SocialCasePriority;
  category: SocialCaseCategory;
  
  // Case Study & Diagnostics (دراسة الحالة والتشخيص)
  initialDiagnosis?: string;          // التشخيص الأولي للمشكلة
  familyCircumstances?: string;       // الجانب الأسري والاجتماعي
  behavioralObservations?: string;    // الملاحظات السلوكية والانفعالية
  workshopAdaptation?: string;        // مدى التكيف في ورشة التدريب العملي
  actionPlan?: string;                // الخطة العلاجية والبرنامج الإرشادي
  
  // Guardian Engagement
  guardianContacted: boolean;
  guardianContactDate?: string;
  guardianNotes?: string;

  // Sessions Log
  sessions: SocialSessionRecord[];

  // Outcomes & Closure
  specialistNotes?: string;
  closureReason?: string;
  resolvedDate?: string;

  createdAt: string;
  updatedAt: string;
}

// System Backup & Restore Package
export interface BackupPackage {
  version: string;
  system: string;
  exportDate: string;
  schoolName: string;
  data: {
    config: SchoolConfig;
    users: User[];
    students: Student[];
    departments: Department[];
    classes: SchoolClass[];
    attendance: AttendanceRecord[];
    notices: OfficialNotice[];
    workshopViolations: WorkshopViolationRecord[];
    transferLogs: StudentTransferLog[];
    competencyUnits: CompetencyUnit[];
    competencyAssessments: StudentCompetencyAssessment[];
    socialCases?: SocialCaseRecord[];
  };
}

export interface Student {
  id: string;
  nationalId: string;
  studentCode: string;
  fullName: string;
  gradeLevel: GradeLevel;
  departmentId: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  guardianJob: string;
  address: string;
  status: StudentStatus;
  enrollmentDate: string;
  birthDate: string;
  totalAbsenceDays: number;
  consecutiveAbsenceDays: number;
  excusedAbsenceDays: number;
  workshopAbsenceHours: number; // ساعات غياب الورش العملية
  theoreticalAbsenceDays: number;
  workshopEscapeCount: number;  // عدد مرات التزويغ من الورشة
  warningLevel: 0 | 1 | 2 | 3;  // 0: طبيعي, 1: إنذار أول, 2: إنذار ثان, 3: حرمان/فصل
  lastAbsenceDate?: string;
  notes?: string;
  competencyStatus?: CompetencyAttendanceStatus;
}

export type PeriodType = 'theoretical' | 'workshop';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'escaped' | 'holiday';

export interface AttendanceRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  periodType: PeriodType;
  periodNumber: number;
  classId: string;
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
  recordedByTeacherId: string;
  recordedByTeacherName: string;
  timestamp: string;
  isVerifiedByAffairs: boolean;
  officialExcuseReason?: string;
  safetyViolation?: SafetyViolationType;
}

export interface OfficialNotice {
  id: string;
  studentId: string;
  studentName: string;
  nationalId: string;
  studentCode: string;
  departmentName: string;
  className: string;
  noticeType: 'warning_1' | 'warning_2' | 'expulsion_notice' | 'guardian_call' | 'reinstatement' | 'workshop_warning';
  noticeTitle: string;
  issueDate: string;
  consecutiveDays: number;
  totalDays: number;
  serialNumber: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  schoolName: string;
  educationalDirectorate: string;
  administration: string;
  notes?: string;
  isDelivered: boolean;
  deliveryDate?: string;
}

export interface DailyMorningCensus {
  date: string;
  totalEnrolled: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalEscaped: number;
  overallAttendanceRate: number;
  byGrade: {
    gradeLevel: GradeLevel;
    gradeName: string;
    enrolled: number;
    present: number;
    absent: number;
    rate: number;
  }[];
  byDepartment: {
    departmentId: string;
    departmentName: string;
    enrolled: number;
    present: number;
    absent: number;
    rate: number;
  }[];
}
