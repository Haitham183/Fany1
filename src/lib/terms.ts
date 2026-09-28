/**
 * القاموس الرسمي الموحد للمصطلحات والنصوص (Terminology & Canonical Terms Dictionary)
 * منظومة مدارس التعليم الفني الصناعي المصرية - برامج الجدارات المهنية
 * متوافق مع قانون التعليم رقم 139 لسنة 1981 ولائحة التقييم والتحقق
 */

export const OFFICIAL_TERMS = {
  // System Branding
  SYSTEM_TITLE: 'منظومة إدارة مدارس التعليم الفني الصناعي والجدارات المهنية',
  SYSTEM_SUBTITLE: 'نظام إدارة وتقييم برامج الجدارات والتحقق والانضباط المدرسي',
  MINISTRY_NAME: 'وزارة التربية والتعليم والتعليم الفني',
  SECTOR_NAME: 'قطاع التعليم الفني والتجهيزات',

  // Official Registers (أسماء السجلات الرسمية الموحدة)
  SHEET_1_SER: 'شيت 1 سر الشهري',
  REGISTER_41: 'سجل 41 (المستجدين)',
  REGISTER_5: 'سجل 5 (سلوك ومواظبة)',
  CLASS_ROSTERS: 'قوائم الفصول الدراسية المعتمدة',
  ASSESSMENT_RECORD_SHEET: 'استمارة رصد نتائج تقييم وحدة الجدارات',
  IV_MINUTES: 'محضر اجتماع واعتماد لجنة التحقق الداخلي',
  EV_MINUTES: 'محضر زيارة واعتماد لجنة التحقق الخارجي',

  // Competency Outcomes & Unit Results (نتائج وحالات الجدارات)
  COMPETENT: 'جدير',
  NOT_COMPETENT: 'غير جدير',
  UNDER_ASSESSMENT: 'قيد التقييم',
  UNASSESSED_ATTENDANCE_BLOCKED: 'غير مقيَّم / ممنوع لعدم استيفاء الحضور',

  // Roles & Titles (المسميات الوظيفية المعتمدة)
  ROLE_PRINCIPAL: 'مدير عام المدرسة',
  ROLE_AFFAIRS_DEPUTY: 'وكيل شئون الطلاب',
  ROLE_AFFAIRS_OFFICER: 'مسؤول شئون الطلاب',
  ROLE_SOCIAL_WORKER: 'الأخصائي الاجتماعي والتربوي',
  ROLE_DEPT_HEAD: 'رئيس القسم الصناعي',
  ROLE_TEACHER: 'معلم / مدرب ورشة',
  ROLE_PARENT: 'ولي الأمر',
  ROLE_SYSTEM_ADMIN: 'مدير النظام التقني',
  ROLE_EXTERNAL_VERIFIER: 'المحقق الخارجي (سوق العمل)',
  ROLE_INTERNAL_VERIFIER_BADGE: 'المحقق الداخلي (مكلف)',

  // Attendance & Absence Terms (مصطلحات الحضور والغياب والانضباط)
  ATTENDANCE_PRESENT: 'حاضر',
  ATTENDANCE_ABSENT: 'غائب دون عذر',
  ATTENDANCE_EXCUSED: 'غائب بعذر مقبول',
  ATTENDANCE_LATE: 'متأخر عن الطابور',
  ATTENDANCE_ESCAPED: 'هارب من الحصة/الورشة',
  ESCAPE_VIOLATION: 'الهروب من الحصة/الورشة',

  // Warning & Discipline Terms (الإنذارات والفصل وقانون 139/1981)
  WARNING_LEVEL_0: 'طالب منضبط',
  WARNING_LEVEL_1: 'إنذار أول بالغياب',
  WARNING_LEVEL_2: 'إنذار ثان بالغياب',
  WARNING_LEVEL_3: 'قرار فصل قانوني لتجاوز مدة الغياب',
  EXPULSION_ARTICLE_25: 'فصل لتجاوز 15 يوماً متصلة أو 30 يوماً منفصلة (المادة 25 من قانون 139/1981)',
  REINSTATEMENT: 'إعادة قيد طالب مفصول',

  // Early Warning Engine (محرك الإنذار المبكر)
  EARLY_WARNING_TITLE: 'محرك الإنذار المبكر لمخاطر التعثر والتسرب',
  EARLY_WARNING_CRITICAL: 'مستوى خطورة حرج',
  EARLY_WARNING_HIGH: 'مستوى خطورة مرتفع',
  EARLY_WARNING_MEDIUM: 'مستوى خطورة متوسط',
  EARLY_WARNING_SAFE: 'مستوى منضبط / آمن',

  // Legal / Watermark Note for Prints
  PRINT_DRAFT_NOTICE: 'مسودة تحتاج مطابقة مع دفاتر المدرسة الرسمية',
} as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: OFFICIAL_TERMS.ATTENDANCE_PRESENT,
  absent: OFFICIAL_TERMS.ATTENDANCE_ABSENT,
  excused: OFFICIAL_TERMS.ATTENDANCE_EXCUSED,
  late: OFFICIAL_TERMS.ATTENDANCE_LATE,
  escaped: OFFICIAL_TERMS.ATTENDANCE_ESCAPED,
  holiday: 'عطلة رسمية',
};

export const ATTENDANCE_CODE_TO_LABEL: Record<string, string> = {
  P: OFFICIAL_TERMS.ATTENDANCE_PRESENT,
  A: OFFICIAL_TERMS.ATTENDANCE_ABSENT,
  E: OFFICIAL_TERMS.ATTENDANCE_EXCUSED,
  L: OFFICIAL_TERMS.ATTENDANCE_LATE,
  S: OFFICIAL_TERMS.ATTENDANCE_ESCAPED,
};

export const CBE_TERMS = OFFICIAL_TERMS;

