/**
 * Centralized Tab Router & Alias Normalizer for the Egyptian TVET School Management System
 * Guarantees that all links, buttons, shortcuts, and notifications route seamlessly.
 */

export type CanonicalTabId =
  | 'dashboard'
  | 'attendance'
  | 'competencies'
  | 'safety'
  | 'affairs'
  | 'transfers'
  | 'class_rosters'
  | 'student_report'
  | 'official_sheets'
  | 'notices'
  | 'departments'
  | 'census'
  | 'social_portal'
  | 'ai_prediction'
  | 'settings'
  | 'users'
  | 'parent_portal';

export function normalizeTabId(rawTab: string): CanonicalTabId {
  if (!rawTab) return 'dashboard';
  const clean = rawTab.trim().toLowerCase();

  switch (clean) {
    // 1. Dashboard / Main
    case 'dashboard':
    case 'main':
    case 'home':
    case 'overview':
      return 'dashboard';

    // 2. Attendance
    case 'attendance':
    case 'attendance_taker':
    case 'take_attendance':
    case 'workshop_attendance':
      return 'attendance';

    // 3. Competencies (CBE)
    case 'competencies':
    case 'cbe':
    case 'competency':
    case 'assessments':
    case 'verification':
    case 'portfolio':
    case 'student_portfolio':
      return 'competencies';

    // 4. Workshop Safety
    case 'safety':
    case 'workshop_safety':
    case 'safety_view':
    case 'safety_violations':
    case 'violations':
      return 'safety';

    // 5. Student Affairs
    case 'affairs':
    case 'student_affairs':
    case 'students':
    case 'roster':
      return 'affairs';

    // 6. Student Transfers
    case 'transfers':
    case 'transfer':
    case 'student_transfers':
    case 'transfer_logs':
      return 'transfers';

    // 7. Class Rosters
    case 'class_rosters':
    case 'rosters':
    case 'classes':
    case 'class_lists':
      return 'class_rosters';

    // 8. Student Report Card (A4 File)
    case 'student_report':
    case 'report_card':
    case 'student_report_card':
    case 'student_card':
    case 'student_file':
      return 'student_report';

    // 9. Official Ministerial Sheets (Register 41, Sheet 1 Ser, Register 5)
    case 'official_sheets':
    case 'official_sheets_view':
    case 'ministry_sheets':
    case 'sheets':
    case 'official':
    case 'ser1':
    case 'daftar41':
    case 'register_41':
    case 'sheet_1_ser':
    case 'register_5':
      return 'official_sheets';

    // 10. Official Notices (Law 139)
    case 'notices':
    case 'official_notices':
    case 'warnings':
    case 'expulsions':
    case 'legal_notices':
      return 'notices';

    // 11. Departments
    case 'departments':
    case 'department_reports':
    case 'department_stats':
    case 'dept_reports':
    case 'workshops':
      return 'departments';

    // 12. Daily Morning Census
    case 'census':
    case 'daily_census':
    case 'daily_report':
    case 'morning_census':
    case 'census_5':
      return 'census';

    // 13. Social Worker Portal
    case 'social_portal':
    case 'social_worker':
    case 'social_cases':
    case 'counseling':
      return 'social_portal';

    // 14. AI Dropout & Failure Prediction
    case 'ai_prediction':
    case 'ai_predictions':
    case 'ai_dashboard':
    case 'ai':
    case 'ai_dropout':
    case 'predictions':
      return 'ai_prediction';

    // 15. School Settings
    case 'settings':
    case 'school_settings':
    case 'config':
    case 'school_config':
      return 'settings';

    // 16. User & Team Management
    case 'users':
    case 'user_management':
    case 'team':
    case 'permissions':
    case 'accounts':
      return 'users';

    // 17. Parent Portal
    case 'parent_portal':
    case 'parent':
    case 'guardian':
      return 'parent_portal';

    default:
      return 'dashboard';
  }
}

export const TAB_META: Record<CanonicalTabId, { label: string; description: string }> = {
  dashboard: {
    label: 'الرئيسية',
    description: 'لوحة القيادة والمؤشرات التنفيذية المتخصصة لكل دور',
  },
  attendance: {
    label: 'حضور الورش والحصص',
    description: 'تسجيل الحضور اليومي والورش بضغطة واحدة مع حد الـ 85%',
  },
  competencies: {
    label: 'تقييم الجدارات (CBE)',
    description: 'التقييم المستمر ومحاولات التحقق الداخلي والخارجي للوحدات',
  },
  safety: {
    label: 'سلامة الورش (HSE)',
    description: 'سجل مخالفات ومحاضر السلامة والصحة المهنية بالورش',
  },
  affairs: {
    label: 'شئون الطلاب والسجلات',
    description: 'إدارة الطلاب ومطابقة قانون 139 والإنذارات ونقل القيود',
  },
  transfers: {
    label: 'تحويلات الطلاب',
    description: 'سجل طلبات التحويل الداخلي والخارجي مع توثيق الأسباب',
  },
  class_rosters: {
    label: 'قوائم الفصول المدرسية',
    description: 'استعراض قوائم الفصول والورش والطباعة المباشرة',
  },
  student_report: {
    label: 'بطاقة الطالب المجمعة (A4)',
    description: 'الملف الشامل للطالب (سلوك، غياب، جدارات، إنذارات)',
  },
  official_sheets: {
    label: 'الدفاتر الوزارية (41 وسر 1)',
    description: 'شيت 1 سر وسجل 41 وسجل 5 مستخرجة رسمياً للوزارة',
  },
  notices: {
    label: 'الإنذارات والإخطارات الرسمية',
    description: 'خطابات الإنذار الأول والثاني والفصل والتسليم بالبريد',
  },
  departments: {
    label: 'الأقسام الصناعية والورش',
    description: 'متابعة كفاءة التخصصات ونسب الحضور ومخرجات الجدارات',
  },
  census: {
    label: 'إحصاء الصباح اليومي',
    description: 'استمارة الإحصاء الصباحي للإدارة التعليمية والمديرية',
  },
  social_portal: {
    label: 'رعاية الطلاب والأخصائي الاجتماعي',
    description: 'الحالات الاجتماعية والبحث الميداني والمساعدات والتدخل المبكر',
  },
  ai_prediction: {
    label: 'التنبؤ الذكي بالرسوب والتسرب',
    description: 'تحليل المخاطر المسبق للطلاب المعرضين للفصل أو التعثر',
  },
  settings: {
    label: 'إعدادات المدرسة',
    description: 'البيانات الرسمية للمدرسة والإدارة والمديرية وشعار المؤسسة',
  },
  users: {
    label: 'إدارة المستخدمين والصلاحيات',
    description: 'إدارة الكادر التعليمي والإداري وتعيين الأدوار الفنية',
  },
  parent_portal: {
    label: 'بوابة ولي الأمر',
    description: 'متابعة الأبناء والإنذارات وغياب الورش من الهاتف',
  },
};
