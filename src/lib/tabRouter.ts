import { UserRole } from '@/types';

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
  | 'directorate'
  | 'directorate_schools'
  | 'directorate_competencies'
  | 'directorate_attendance'
  | 'directorate_circulars'
  | 'directorate_inspection'
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

    // 18. Directorate & Multi-School Management
    case 'directorate':
    case 'directorate_cockpit':
    case 'multi_school':
    case 'super_admin':
      return 'directorate';

    case 'directorate_schools':
    case 'schools':
    case 'schools_management':
    case 'schools_network':
      return 'directorate_schools';

    case 'directorate_competencies':
    case 'directorate_cbe':
    case 'directorate_workshop_rate':
      return 'directorate_competencies';

    case 'directorate_attendance':
    case 'directorate_census':
    case 'directorate_dropout':
      return 'directorate_attendance';

    case 'directorate_circulars':
    case 'circulars':
    case 'directives':
      return 'directorate_circulars';

    case 'directorate_inspection':
    case 'inspection':
    case 'inspection_reports':
      return 'directorate_inspection';

    default:
      return 'dashboard';
  }
}

/**
 * Maps a canonical tab or alias to its clean URL path in the web application.
 */
export function tabToPath(rawTab: CanonicalTabId | string): string {
  const normalized = normalizeTabId(rawTab);
  switch (normalized) {
    case 'directorate':
      return '/directorate';
    case 'directorate_schools':
      return '/directorate/schools';
    case 'directorate_competencies':
      return '/directorate/competencies';
    case 'directorate_attendance':
      return '/directorate/attendance';
    case 'directorate_circulars':
      return '/directorate/circulars';
    case 'directorate_inspection':
      return '/directorate/inspection';
    case 'dashboard':
      return '/dashboard';
    case 'attendance':
      return '/attendance';
    case 'competencies':
      return '/competencies';
    case 'safety':
      return '/safety';
    case 'affairs':
      return '/affairs';
    case 'transfers':
      return '/transfers';
    case 'class_rosters':
      return '/class-rosters';
    case 'student_report':
      return '/student-report';
    case 'official_sheets':
      return '/official-sheets';
    case 'notices':
      return '/notices';
    case 'departments':
      return '/departments';
    case 'census':
      return '/census';
    case 'social_portal':
      return '/social';
    case 'ai_prediction':
      return '/ai-prediction';
    case 'settings':
      return '/settings';
    case 'users':
      return '/users';
    case 'parent_portal':
      return '/parent';
    default:
      return '/dashboard';
  }
}

/**
 * Maps a URL pathname (e.g. '/attendance', '/directorate/schools', '/class-rosters') back to CanonicalTabId.
 */
export function pathToTab(pathname: string): CanonicalTabId {
  if (!pathname || pathname === '/' || pathname === '') return 'dashboard';
  const clean = pathname.trim().replace(/^\/+|\/+$/g, '').toLowerCase();

  switch (clean) {
    case 'parent':
    case 'parent-portal':
    case 'parent_portal':
      return 'parent_portal';

    case 'directorate':
    case 'directorate/overview':
      return 'directorate';

    case 'directorate/schools':
    case 'schools':
      return 'directorate_schools';

    case 'directorate/competencies':
    case 'directorate/cbe':
      return 'directorate_competencies';

    case 'directorate/attendance':
    case 'directorate/census':
      return 'directorate_attendance';

    case 'directorate/circulars':
    case 'circulars':
      return 'directorate_circulars';

    case 'directorate/inspection':
    case 'inspection':
      return 'directorate_inspection';

    case 'dashboard':
    case 'main':
    case 'home':
      return 'dashboard';

    case 'attendance':
      return 'attendance';

    case 'competencies':
    case 'cbe':
      return 'competencies';

    case 'safety':
      return 'safety';

    case 'affairs':
    case 'student-affairs':
    case 'student_affairs':
      return 'affairs';

    case 'transfers':
      return 'transfers';

    case 'class-rosters':
    case 'class_rosters':
    case 'rosters':
      return 'class_rosters';

    case 'student-report':
    case 'student_report':
    case 'student-card':
    case 'report-card':
      return 'student_report';

    case 'official-sheets':
    case 'official_sheets':
    case 'ministry-sheets':
    case 'ministry_sheets':
      return 'official_sheets';

    case 'notices':
      return 'notices';

    case 'departments':
      return 'departments';

    case 'census':
      return 'census';

    case 'social':
    case 'social-portal':
    case 'social_portal':
      return 'social_portal';

    case 'ai-prediction':
    case 'ai_prediction':
    case 'ai':
      return 'ai_prediction';

    case 'settings':
      return 'settings';

    case 'users':
      return 'users';

    default:
      return normalizeTabId(clean);
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
  directorate: {
    label: 'كابينة قيادة المديرية المركزية',
    description: 'لوحة المؤشرات المجمعة لمدارس المحافظة الفنية الصناعية',
  },
  directorate_schools: {
    label: 'شبكة وإدارة المدارس الفنية',
    description: 'إدارة شبكة المدارس بالمحافظة، إضافة مدرسة، وتعيين بيانات الاعتماد',
  },
  directorate_competencies: {
    label: 'رقابة الجدارات ونسب الورش 85%',
    description: 'متابعة التزام مدارس المحافظة بحد الـ 85% لحضور الورش واجتياز الجدارات',
  },
  directorate_attendance: {
    label: 'مرصد الغياب ومواظبة 5',
    description: 'الإحصاء التراكمي الصباحي لمدارس المحافظة ومؤشر التسرب والإنذارات',
  },
  directorate_circulars: {
    label: 'القرارات والكتب الدورية',
    description: 'إصدار وتعميم التوجيهات والقرارات الوزارية على مدارس المحافظة',
  },
  directorate_inspection: {
    label: 'سجل التفتيش والمتابعة الميدانية',
    description: 'توثيق تقارير لجان المتابعة الميدانية والسلامة والصحة المهنية بالورش',
  },
  parent_portal: {
    label: 'بوابة ولي الأمر',
    description: 'متابعة الأبناء والإنذارات وغياب الورش من الهاتف',
  },
};

/**
 * Validates whether a specific role has permission to open and view a canonical tab.
 */
export function canRoleAccessTab(role: UserRole, tab: CanonicalTabId): boolean {
  // Directorate tabs are strictly reserved for directorate_admin
  const directorateTabs: CanonicalTabId[] = [
    'directorate',
    'directorate_schools',
    'directorate_competencies',
    'directorate_attendance',
    'directorate_circulars',
    'directorate_inspection',
  ];

  if (directorateTabs.includes(tab)) {
    return role === 'directorate_admin';
  }

  // Directorate admin has access to view any school's administrative and reporting data, but not local school settings or daily operational tools
  if (role === 'directorate_admin') {
    const forbiddenForDirectorate: CanonicalTabId[] = ['attendance', 'transfers', 'social_portal', 'settings'];
    return !forbiddenForDirectorate.includes(tab);
  }

  switch (role) {
    case 'principal':
      // Full executive access to single school
      return true;

    case 'system_admin':
      return ['dashboard', 'users', 'settings'].includes(tab);

    case 'affairs_deputy':
      return [
        'dashboard',
        'notices',
        'transfers',
        'census',
        'official_sheets',
        'affairs',
        'class_rosters',
        'student_report',
      ].includes(tab);

    case 'affairs_officer':
      return [
        'dashboard',
        'official_sheets',
        'census',
        'affairs',
        'class_rosters',
        'student_report',
        'notices',
      ].includes(tab);

    case 'dept_head':
      return [
        'dashboard',
        'departments',
        'competencies',
        'safety',
        'class_rosters',
        'attendance',
      ].includes(tab);

    case 'teacher':
      return [
        'dashboard',
        'attendance',
        'competencies',
        'class_rosters',
        'safety',
      ].includes(tab);

    case 'social_worker':
      return [
        'dashboard',
        'social_portal',
        'ai_prediction',
        'safety',
        'student_report',
      ].includes(tab);

    case 'external_verifier':
      return [
        'dashboard',
        'competencies',
        'departments',
      ].includes(tab);

    case 'parent':
      return ['parent_portal', 'dashboard'].includes(tab);

    default:
      return ['dashboard'].includes(tab);
  }
}

/**
 * Provides the default canonical landing tab for a given role upon login.
 */
export function getDefaultTabForRole(role: UserRole): CanonicalTabId {
  switch (role) {
    case 'directorate_admin':
      return 'directorate';
    case 'teacher':
      return 'attendance';
    case 'dept_head':
      return 'departments';
    case 'external_verifier':
      return 'competencies';
    case 'social_worker':
      return 'social_portal';
    case 'affairs_deputy':
    case 'affairs_officer':
      return 'affairs';
    case 'parent':
      return 'parent_portal';
    case 'principal':
    case 'system_admin':
    default:
      return 'dashboard';
  }
}
