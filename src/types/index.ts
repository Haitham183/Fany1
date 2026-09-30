export type UserRole =
  | 'principal'          // مدير عام المدرسة
  | 'affairs_deputy'     // وكيل شئون الطلاب
  | 'affairs_officer'    // مسؤول شئون الطلاب
  | 'social_worker'      // الأخصائي الاجتماعي والتربوي / المرشد الطلابي
  | 'dept_head'          // رئيس قسم صناعي
  | 'teacher'            // معلم / مدرب ورشة
  | 'parent'             // ولي الأمر
  | 'system_admin'       // مدير النظام التقني (إدارة الحسابات والإعدادات فقط)
  | 'directorate_admin'  // مشرف المديرية والإدارة التعليمية (لوحة تحكم متعددة المدارس)
  | 'external_verifier'; // المحقق الخارجي (حساب مؤقت للقراءة فقط)

export type PortalType =
  | 'parent'
  | 'principal'
  | 'dept_head'
  | 'competencies'
  | 'affairs'
  | 'social_worker'
  | 'teacher'
  | 'admin'
  | 'directorate';

export interface UserPermission {
  canTakeAttendance: boolean;       // تسجيل الحضور والغياب للورش والفصول
  canManageStudents: boolean;       // إضافة وتعديل وحذف الطلاب
  canTransferStudents: boolean;     // نقل الطلاب بين الفصول والتخصصات
  canApproveExcuses: boolean;       // اعتماد الأعذار الطبية والرسمية
  canIssueNotices: boolean;         // إصدار وطباعة الإنذارات وقرارات الفصل
  canManageSchoolSettings: boolean; // تعديل بيانات المدرسة والأقسام
  canManageUsers: boolean;          // إدارة الحسابات وكلمات المرور والصلاحيات
  canViewReports: boolean;          // الاطلاع على التقارير والإحصائيات العامة
  canManageCompetencies: boolean;   // متابعة وتقييم الجدارات المهنية
  canLogViolations: boolean;        // تسجيل مخالفات السلامة والهروب
  canManageSocialCases?: boolean;   // إدارة ملفات ودراسة حالات الأخصائي الاجتماعي
  canAuditAssessments?: boolean;    // التحقق الداخلي لعينات الجدارات
  canManageDirectorate?: boolean;   // إدارة المدارس المتعددة والرقابة المركزية بالمديرية
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
  schoolId?: string;
  isInternalVerifier?: boolean;      // تكليف محقق داخلي على حساب موجود
  externalVerifierExpiresAt?: string; // تاريخ انتهاء صلاحية حساب المحقق الخارجي
  customPermissions?: UserPermission;
  updated_at?: string;
  updated_by?: string;
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
  name: string;             // اسم العطلة
  startDate: string;        // YYYY-MM-DD
  endDate: string;          // YYYY-MM-DD
  type: HolidayType;        // official | emergency
  description?: string;     // سبب العطلة أو القرار الوزاري / قرار المحافظ
  isTermBreak?: boolean;    // هل هي إجازة نصف العام
}

// هيكل المنشأة التعليمية / المدرسة (Multi-Tenancy)
export interface SchoolTenant {
  id: string;                      // e.g. 'sch_cairo_ind_01'
  name: string;                    // e.g. 'مدرسة العباسية الثانوية الصناعية الميكانيكية بنين'
  code: string;                    // e.g. '10201' (كود المدرسة المالي والإحصائي بوزارة التربية والتعليم)
  accessPin?: string;              // الرقم السري المعتمد الصادر من المديرية لدخول حساب المدرسة
  schoolUsername?: string;         // اسم مستخدم حساب المدرسة لتسجيل الدخول (كود المدرسة أو اسم مخصص)
  directorate: string;             // مديرية التربية والتعليم (مثل: القاهرة، الجيزة، الإسكندرية)
  administration: string;          // الإدارة التعليمية (مثل: إدارة الوايلي، إدارة وسط)
  systemType: SchoolSystemType;    // '3_years' | '5_years_advanced' | 'applied_technology' | 'dual_education'
  shiftType: SchoolShiftType;      // 'single_morning' | 'two_shifts' | 'single_full_day'
  workDaysScheme: WorkDaysScheme;  // 'sun_to_thu' | 'sat_to_thu' | 'sat_to_wed'
  logoUrl?: string;
  headerImageUrl?: string;
  address?: string;
  phone?: string;
  principalName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// الكتب الدورية والقرارات الصادرة من قيادة المديرية للمدارس الفنية
export interface DirectorateCircular {
  id: string;
  circularNumber: string;        // e.g. "ك/د-2026/14"
  title: string;                 // e.g. "ضوابط استيفاء نسبة حضور الورش 85% لدخول التقييم النهائي"
  subject: 'cbe' | 'safety' | 'attendance' | 'general' | 'exams';
  content: string;               // نص القرار أو التوجيه
  issuedDate: string;            // YYYY-MM-DD
  priority: 'normal' | 'high' | 'urgent';
  targetScope: 'all' | 'specific_school' | '5_years_only' | 'applied_tech_only';
  targetSchoolId?: string;
  targetSchoolName?: string;
  acknowledgedBySchoolIds?: string[]; // معرّفات المدارس التي أكدت قراءة واستلام القرار
  issuedBy: string;              // "د. حسام الدين عبد القادر - مدير عام التعليم الفني"
}

// تقارير زيارات التفتيش والمتابعة الميدانية للمدارس الفنية بالمديرية
export interface SchoolInspectionReport {
  id: string;
  reportNumber: string;          // e.g. "تفتيش-2026/89"
  schoolId: string;
  schoolName: string;
  inspectorName: string;         // اسم رئيس لجنة المتابعة والتفتيش
  visitDate: string;             // YYYY-MM-DD
  departmentInspected?: string;  // القسم / الورشة التي تم التفتيش عليها
  disciplineRating: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  ppeComplianceRating: 'compliant' | 'partial' | 'non_compliant'; // مهمات الوقاية بالورش
  competencyAuditStatus: 'verified' | 'pending_samples' | 'deficiencies_found';
  workshopAttendanceRate: number;// e.g. 88%
  notes: string;                 // ملاحظات اللجنة الميدانية
  recommendations: string;       // التوصيات والإجراءات الملزمة
  status: 'pending_school_action' | 'resolved' | 'escalated_to_undersecretary';
}

// إعدادات المدرسة والقواعد القانونية القابلة للضبط [قابل للضبط]
export interface SchoolConfig {
  id?: string;
  schoolId?: string;
  name: string;
  directorate: string; // مديرية التربية والتعليم
  administration: string; // الإدارة التعليمية
  academicYear: string;
  currentTerm: string;
  
  // ترويسة وشعار المدرسة المرفوع (لا يُدرج شعار نسر ثابت)
  schoolHeaderImageUrl?: string;
  schoolLogoUrl?: string;

  // التواريخ الرسمية للعام الدراسي والفصول الدراسية
  term1StartDate?: string;
  term1EndDate?: string;
  midYearBreakStartDate?: string;
  midYearBreakEndDate?: string;
  term2StartDate?: string;
  term2EndDate?: string;
  holidays?: Holiday[];
  
  schoolSystemType: SchoolSystemType;
  fiveYearSystemEnabled?: boolean; // انطباق لائحة الجدارات على نظام الخمس سنوات [قابل للضبط]
  schoolShiftType: SchoolShiftType;
  workDaysScheme: WorkDaysScheme;
  morningQueueTime?: string;
  eveningQueueTime?: string;
  phone: string;
  address: string;
  postalCode?: string;
  managerName: string;
  managerTitle: string;
  studentAffairsHead: string;
  studentAffairsAgent?: string;

  // القواعد والحدود القانونية القابلة للضبط [قابل للضبط]
  theoreticalMinAttendanceRate: number; // نسبة حضور النظري الإلزامية (افتراضي 75%)
  minTheoreticalAttendanceRate?: number; // alias
  practicalMinAttendanceRate: number;   // نسبة حضور الورش الإلزامية (افتراضي 85%)
  minWorkshopAttendanceRate?: number;   // alias
  workshopRuleEnabled?: boolean;        // تفعيل قاعدة حضور الورش (افتراضي true)
  minDaysForAttendanceWarning?: number; // الحد الأدنى للأيام المرصودة لتفعيل إنذار النسبة (افتراضي 10 أيام)
  absenceOnePeriodCountsAsDay?: boolean;// احتساب غياب حصة واحدة كيوم كامل (افتراضي false)
  internalVerificationSampleRate?: number; // نسبة عينة التحقق الداخلي % (افتراضي 15%)
  externalVerificationSampleRate?: number; // نسبة عينة التحقق الخارجي % (افتراضي 10%)

  // مواعيد الإنذارات والغياب تبعا لقانون 139 لسنة 1981 [قابل للضبط]
  warning1ConsecutiveDays?: number; // افتراضي 5
  warning1TotalDays?: number;       // افتراضي 10
  warning2ConsecutiveDays?: number; // افتراضي 10
  warning2TotalDays?: number;       // افتراضي 20
  expulsionConsecutiveDays?: number;// افتراضي 15
  expulsionTotalDays?: number;      // افتراضي 30

  // أسماء الحقول التوافقية
  continuousAbsenceDaysForWarning1?: number;
  separateAbsenceDaysForWarning1?: number;
  continuousAbsenceDaysForWarning2?: number;
  separateAbsenceDaysForWarning2?: number;
  continuousAbsenceDaysForExpulsion?: number;
  separateAbsenceDaysForExpulsion?: number;

  // رسوم إعادة القيد والغرامات [قابل للضبط]
  reinstatementFeeAbsence?: number; // افتراضي 25 ج.م
  reinstatementFeeFailure?: number; // افتراضي 35 ج.م بعد استنفاد مرات الرسوب
  remedialProgramFeePerUnit?: number; // رسم البرنامج العلاجي لكل وحدة
  
  updated_at?: string;
  updated_by?: string;
}

export interface Department {
  id: string;
  schoolId?: string;
  name: string;
  code: string;
  description: string;
  scientificSupervisorName: string;
  practicalSupervisorName: string;
  headName?: string;
  headPhone?: string;
  iconName: string;
  totalStudents: number;
  workshopCount: number;
  availableGrades: GradeLevel[];
  updated_at?: string;
  updated_by?: string;
}

export type GradeLevel = 1 | 2 | 3 | 4 | 5;

export interface SchoolClass {
  id: string;
  schoolId?: string;
  name: string;
  gradeLevel: GradeLevel;
  gradeName: string;
  departmentId: string;
  departmentName: string;
  supervisorTeacherId: string;
  supervisorTeacherName: string;
  roomNumber: string;
  studentCount: number;
  shift?: 'morning' | 'evening';
  updated_at?: string;
  updated_by?: string;
}

export type StudentStatus = 'منتظم' | 'خدمات' | 'نظام عمال' | 'دمج' | 'enrolled' | 'transferred' | 'graduated' | 'expelled';

export interface StudentTransferLog {
  id: string;
  schoolId?: string;
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
  updated_at?: string;
  updated_by?: string;
}

// المخالفات والانضباط داخل الورش
export type SafetyViolationType =
  | 'no_uniform'         // عدم ارتداء الأفرول / الزي المخصص للورشة
  | 'no_safety_shoes'    // عدم ارتداء حذاء الأمان (Safety Shoes)
  | 'no_safety_glasses'  // عدم ارتداء نظارات الحماية أثناء الخراطة/اللحام
  | 'tools_misuse'       // استخدام خاطئ للعدد والماكينات
  | 'workshop_escape'    // الهروب من الحصة/الورشة
  | 'behavioral';        // مخالفة سلوكية داخل الورشة

export interface WorkshopViolationRecord {
  id: string;
  schoolId?: string;
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
  actionTaken: string;
  updated_at?: string;
  updated_by?: string;
}

// Competency Status
export type CompetencyAttendanceStatus =
  | 'eligible'           // مستوفٍ لنسبة الحضور ومؤهل للتقييم
  | 'at_risk'            // في خطر الحرمان من تقييم الجدارة
  | 'ineligible'         // ممنوع لعدم استيفاء نسبة الحضور
  | 'reassessment';      // فرصة تقييم ثانية / دور ثانٍ

// نتائج تقييم الجدارات المهنية الرسمية
export type CompetencyEvaluationResult =
  | 'first_attempt_pass'    // اجتاز من المرة الأولى (جدير 1)
  | 'second_attempt_pass'   // اجتاز من المرة الثانية (جدير 2)
  | 'remedial_program'      // برنامج علاجي
  | 'not_competent'         // غير جدير
  | 'unassessed_blocked'    // غير مقيَّم / ممنوع لعدم استيفاء الحضور
  | 'pending';              // قيد التقييم

// تصنيف وحدات الجدارات
export type CompetencyUnitCategory =
  | 'technical_core'        // جدارات فنية وتخصصية بالورش
  | 'employability'         // جدارات التوظيف ومهارات الحياة وريادة الأعمال
  | 'supporting';           // جدارات مساندة وأكاديمية

export type EvidenceType =
  | 'performance_checklist'  // دليل أداء (بطاقة ملاحظة)
  | 'product_inspection'     // دليل منتج (فحص ومطابقة المنتج الفني)
  | 'knowledge_questioning'; // دليل تساؤل (استبيان معرفي / اختبار قصير)

export interface LearningOutcome {
  id: string;
  code: string;             // LO1, LO2
  title: string;
  description?: string;
  weightHours?: number;
  requiredEvidences?: EvidenceType[];
  performanceCriteria?: string[];
}

export interface CompetencyUnit {
  id: string;
  schoolId?: string;
  code: string;             // ELE-101
  name: string;
  category?: CompetencyUnitCategory;
  departmentId: string;
  gradeLevel: GradeLevel;
  term: 'term_1' | 'term_2' | 'full_year';
  outcomesCount: number;
  outcomes: LearningOutcome[];
  totalHours: number;
  description?: string;
  prerequisites?: string[];
  updated_at?: string;
  updated_by?: string;
}

export interface StudentCompetencyAssessment {
  id: string;
  schoolId?: string;
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
  outcomeId: string;
  outcomeCode: string;
  outcomeTitle: string;
  result: CompetencyEvaluationResult;
  hasPerformanceEvidence?: boolean;
  hasProductEvidence?: boolean;
  hasKnowledgeEvidence?: boolean;
  firstAttemptDate?: string;
  secondAttemptDate?: string;
  remedialDate?: string;
  assessorTeacherName?: string;
  internalVerifierName?: string;
  internalVerifierSignedDate?: string;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
}

// ملف إنجاز الطالب (Student Portfolio)
export interface StudentPortfolioRecord {
  id: string;
  schoolId?: string;
  studentId: string;
  studentName: string;
  classId: string;
  departmentId: string;
  gradeLevel: GradeLevel;
  hasIndex: boolean;
  hasSafetyPledge: boolean;
  hasObservationCards: boolean;
  hasProductInspectionCards: boolean;
  hasKnowledgeTests: boolean;
  hasAttendanceProof: boolean;
  isInternalVerified: boolean;
  isExternalVerified: boolean;
  completionPercentage: number;
  notes?: string;
  lastAuditedDate?: string;
  auditedBy?: string;
  updated_at?: string;
  updated_by?: string;
}

// سجلات التحقق الداخلي والخارجي
export interface CompetencyVerificationRecord {
  id: string;
  schoolId?: string;
  verificationType: 'internal' | 'external';
  unitId: string;
  unitName: string;
  unitCode: string;
  departmentId: string;
  departmentName: string;
  gradeLevel: GradeLevel;
  date: string;
  verifierName: string;
  verifierRole: 'internal_verifier' | 'external_verifier' | 'market_representative';
  totalStudentsAudited: number;
  samplePercentage: number;
  sampleRandomSeed?: string; // بذرة التوليد العشوائي لإعادة الفحص
  sampleSeed?: number | string;
  sampleStudentIds: string[];
  sampleStudentNames: string[];
  status: 'conforming' | 'non_conforming' | 'conditional_pass';
  assessorDecisionAgreed: boolean;
  correctiveActions?: string;
  feedbackNotes: string;
  externalInterviewNotes?: string; // ملاحظات مقابلات المحقق الخارجي
  isSigned: boolean;
  updated_at?: string;
  updated_by?: string;
}

// سجل التظلمات على قرارات التقييم
export interface GrievanceRecord {
  id: string;
  schoolId?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  departmentId?: string;
  gradeLevel?: GradeLevel;
  unitId: string;
  unitCode?: string;
  unitName: string;
  outcomeId?: string;
  outcomeCode?: string;
  submissionDate: string;
  reason: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  decision?: string;
  decisionNotes?: string;
  decisionDate?: string;
  committeeDecisionDate?: string;
  decidedBy?: string;
  resolvedBy?: string;
  assessorTeacherName?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export type AssessmentCalendarEventType =
  | 'attempt_1'
  | 'attempt_2'
  | 'remedial_attempt_3'
  | 'remedial_term1'
  | 'remedial_term2'
  | 'second_round'
  | 'internal_verification'
  | 'external_verification'
  | 'ev_visit'
  | 'grievance_window'
  | 'exam_period';

// تقويم التقييم والتحقق
export interface AssessmentCalendarEvent {
  id: string;
  schoolId?: string;
  title: string;
  eventType: AssessmentCalendarEventType;
  startDate: string;
  endDate: string;
  unitId?: string;
  unitCode?: string;
  unitName?: string;
  notes?: string;
  status?: string;
  description?: string;
  targetGradeLevel?: GradeLevel;
  gradeLevel?: GradeLevel;
  departmentId?: string;
  createdBy?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

// Early Warning Alert System (محرك الإنذار المبكر)
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

// Social Counseling System Types
export type SocialCaseStatus =
  | 'pending'      // قيد الانتظار / إحالة جديدة
  | 'in_progress'  // جاري المتابعة ودراسة الحالة
  | 'resolved'     // تم العلاج والتحسن
  | 'escalated'    // تم التصعيد لإدارة المدرسة
  | 'closed';      // مغلقة ومحفوظة

export type SocialCasePriority = 'urgent' | 'high' | 'medium' | 'routine';

export type SocialCaseCategory =
  | 'absence_dropout_risk'         // خطر الغياب المتكرر والتسرب
  | 'workshop_escape_behavior'     // الهروب من الحصص والورش
  | 'academic_competency_struggle' // تعثر الجدارات والبرامج العلاجية
  | 'economic_social_circumstances'// ظروف اقتصادية أو أسرية طارئة
  | 'safety_violation_repetition'  // تكرار مخالفات السلامة والسلوك
  | 'psychological_counseling'     // إرشاد نفسي وتكيف مهني
  | 'general';

export type SocialSessionType =
  | 'individual_counseling'
  | 'guardian_meeting'
  | 'behavioral_contract'
  | 'workshop_visit'
  | 'home_visit';

export interface SocialSessionRecord {
  id: string;
  sessionNumber: number;
  date: string;
  sessionType: SocialSessionType;
  sessionTitle: string;
  summary: string;
  studentCommitments?: string;
  guardianCommitments?: string;
  recommendations: string;
  specialistName: string;
  outcome: 'improved' | 'stable' | 'needs_followup' | 'no_response';
  createdAt: string;
}

export interface SocialCaseRecord {
  id: string;
  schoolId?: string;
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
  referralDate: string;
  referralSource: 'early_warning' | 'affairs' | 'teacher' | 'dept_head' | 'principal' | 'self' | 'ai_prediction';
  referralReason: string;
  riskScore?: number;
  riskLevel?: 'critical' | 'high' | 'medium' | 'safe';
  riskFactors?: string[];
  aiRiskScore?: number;
  aiRiskLevel?: string;
  aiRootCauses?: string[];
  aiRecommendations?: string[];
  status: SocialCaseStatus;
  priority: SocialCasePriority;
  category: SocialCaseCategory;
  initialDiagnosis?: string;
  familyCircumstances?: string;
  behavioralObservations?: string;
  workshopAdaptation?: string;
  actionPlan?: string;
  guardianContacted: boolean;
  guardianContactDate?: string;
  guardianNotes?: string;
  sessions: SocialSessionRecord[];
  specialistNotes?: string;
  closureReason?: string;
  resolvedDate?: string;
  createdAt: string;
  updated_at: string;
  updated_by?: string;
}

// Student Model
export interface Student {
  id: string;
  schoolId?: string;
  nationalId: string;
  nationalIdHash?: string;       // هاش للبحث الآمن المشفر
  studentCode: string;
  fullName: string;
  gender?: 'male' | 'female' | string;
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
  
  // بيانات دخول بوابة ولي الأمر الآمنة
  parentAccessCode?: string;     // كود دخول سري تصدره المدرسة
  parentOtp?: string;            // كود OTP مؤقت
  parentCodeExpiresAt?: string;  // تاريخ انتهاء صلاحية الكود

  totalAbsenceDays: number;
  consecutiveAbsenceDays: number;
  excusedAbsenceDays: number;
  workshopAbsenceHours: number;
  theoreticalAbsenceDays: number;
  workshopEscapeCount: number;
  warningLevel: 0 | 1 | 2 | 3;
  lastAbsenceDate?: string;
  totalAttendedDays?: number;
  totalRecordedDays?: number;
  workshopPresentHours?: number;
  attendanceRate?: number;
  workshopAttendanceRate?: number;
  notes?: string;
  competencyStatus?: CompetencyAttendanceStatus;
  updated_at?: string;
  updated_by?: string;
}

export type PeriodType = 'theoretical' | 'workshop';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'escaped' | 'holiday';

export interface AttendanceRecord {
  id: string;
  schoolId?: string;
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
  updated_at?: string;
  updated_by?: string;
}

export interface OfficialNotice {
  id: string;
  schoolId?: string;
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
  updated_at?: string;
  updated_by?: string;
}

// سجل التدقيق الأمني المعتمد (Insert-Only Audit Log)
export interface AuditLogEntry {
  id: string;
  school_id?: string;
  actor_id: string;
  actor_name?: string;
  action: string;      // e.g., 'attendance_record', 'grade_entry', 'notice_issued', 'expulsion', 'exclusion_override', 'sensitive_data_access', 'grievance_decided'
  entity: string;      // e.g., 'student', 'attendance', 'competency_assessment', 'social_case', 'notice'
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
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

// مؤشرات الحضور والغياب الفعلي المتراكم
export interface StudentDynamicAttendanceStats {
  studentId: string;
  totalRecordedDays: number;         // إجمالي أيام التحضير الفعلية التي تم رصدها للطالب / الفصل حتى اليوم
  presentDays: number;               // أيام الحضور الفعلي (حاضر + متأخر)
  actualAttendedDays?: number;       // alias
  absentDays: number;                // أيام الغياب الفعلي بدون عذر (غائب + هروب)
  actualAbsenceDays?: number;        // alias
  excusedDays: number;               // أيام الغياب بعذر قانوني مقبول
  lateDays: number;                  // أيام التأخير
  escapedDays: number;               // أيام الهروب من الحصص/الورش
  consecutiveAbsenceDays: number;    // أيام الغياب المتصل الأخيرة
  attendanceRate: number;            // نسبة الحضور العام = (أيام الحضور / إجمالي الأيام الفعلية المرصودة) * 100
  overallAttendanceRate?: number;    // alias
  absenceRate: number;               // نسبة الغياب العام = 100 - نسبة الحضور

  workshopRecordedSessions: number;  // إجمالي فترات الورش المرصودة فعلياً حتى الآن
  workshopRecordedHours: number;     // إجمالي ساعات الورش المرصودة (كل فترة = 6 ساعات تدريب)
  workshopPresentSessions: number;   // فترات الورش التي حضرها الطالب فعلياً
  workshopPresentHours: number;      // ساعات الورش المحضورة فعلياً
  workshopAbsentSessions: number;    // فترات الغياب عن الورش
  workshopAbsentHours: number;       // ساعات الغياب عن الورش
  workshopAttendanceRate: number;    // نسبة الحضور الفعلي للورش = (ساعات الحضور الفعلي / إجمالي ساعات الورش المرصودة حتى اليوم) * 100
  workshopAbsenceRate: number;       // نسبة الغياب عن الورش = 100 - نسبة الحضور

  isPracticalEligible: boolean;      // مستوفٍ لنسبة الورش (>= 85%)
  isTheoreticalEligible: boolean;    // مستوفٍ للنسبة العامة (>= 75%)
  isUnderWarningThreshold?: boolean; // تجاوز نسبة الإنذار مع استيفاء الحد الأدنى للأيام
  firstRecordedDate?: string;
  lastRecordedDate?: string;
}

// حزمة النسخ الاحتياطي
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
    grievances?: GrievanceRecord[];
    assessmentCalendar?: AssessmentCalendarEvent[];
    auditLogs?: AuditLogEntry[];
  };
}

export interface OfflineMediaEvidence {
  id: string;
  category: 'workshop_product' | 'safety_violation' | 'attendance_excuse' | 'portfolio_evidence' | 'inspection_doc';
  studentId?: string;
  classId?: string;
  departmentId?: string;
  title: string;
  description?: string;
  mimeType: string;
  dataUrl: string; // Base64 data or Blob URL
  fileSize?: number;
  isSynced: boolean;
  createdAt: string;
  updatedAt?: string;
}
