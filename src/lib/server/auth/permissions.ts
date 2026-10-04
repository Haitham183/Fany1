export type SystemModule =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'competencies'
  | 'notices'
  | 'reports'
  | 'settings'
  | 'users'
  | 'roles'
  | 'audit_logs';

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete' | 'export';

export interface ModulePermissionRule {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export type RolePermissionsMap = Record<SystemModule, ModulePermissionRule>;

export const SYSTEM_MODULES_ARABIC: Record<SystemModule, { name: string; description: string }> = {
  dashboard: {
    name: 'لوحة المؤشرات والقيادة',
    description: 'عرض الإحصائيات العامة ونسب الحضور ومؤشرات الانضباط',
  },
  students: {
    name: 'شئون الطلاب والقيد',
    description: 'إدارة سجلات الطلاب، مطابقة الأرقام القومية، وحالات القيد',
  },
  attendance: {
    name: 'الحضور والغياب والورش',
    description: 'رصد الحضور اليومي والحصصي ونسب حضور تدريبات الورش',
  },
  competencies: {
    name: 'تقييمات الجدارات المهنية (CBE)',
    description: 'شجرة الجدارات، مخرجات التعلم، وتقييمات المحاولات',
  },
  notices: {
    name: 'الإنذارات الرسمية (مادة 25)',
    description: 'إصدار خطابات الإنذار واستدعاء أولياء الأمور وإعادة القيد',
  },
  reports: {
    name: 'التقارير وسجلات الرصد الوزارية',
    description: 'استخراج كشوف 5د، شيتات الرصد، وبيانات الدرجات الرسمية',
  },
  settings: {
    name: 'إعدادات وقواعد المنظومة',
    description: 'ضبط نسب الورش وقواعد الغياب وأيام الإنذارات ورسوم القيد',
  },
  users: {
    name: 'إدارة المستخدمين والحسابات',
    description: 'إنشاء حسابات المعلمين والإداريين وتعيين الأقسام',
  },
  roles: {
    name: 'مصفوفة الصلاحيات والأدوار',
    description: 'تخصيص وضبط صلاحيات الأدوار المختلفة بالمدرسة',
  },
  audit_logs: {
    name: 'سجل التدقيق والتتبع',
    description: 'استعراض سجل كافة الحركات والتعديلات وأنشطة المعاينة',
  },
};

/**
 * Standard Default Role Permissions Matrix
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissionsMap> = {
  directorate_admin: {
    dashboard: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    students: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    competencies: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    notices: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    settings: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    users: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    roles: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    audit_logs: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
  },
  principal: {
    dashboard: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    students: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    competencies: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    notices: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    settings: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    users: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    roles: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    audit_logs: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
  },
  dept_head: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    students: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    competencies: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    notices: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
  affairs_deputy: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    students: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    competencies: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    notices: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true },
    reports: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    settings: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
  },
  affairs_officer: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    students: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    competencies: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    notices: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: true },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
  teacher: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    students: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    attendance: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: false },
    competencies: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: false },
    notices: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
  social_worker: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    students: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    attendance: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    competencies: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    notices: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
  parent: {
    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    students: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    attendance: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    competencies: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    notices: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true },
    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
    audit_logs: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false },
  },
};

/**
 * Checks whether a given role has the requested action permission on a module.
 * If customPermissions are passed (e.g. from the School Principal custom matrix), they take priority.
 */
export function checkPermission(
  roleCode: string,
  module: SystemModule,
  action: PermissionAction,
  customRolePermissions?: Partial<RolePermissionsMap> | null,
  isInspectionMode: boolean = false
): boolean {
  // If in Directorate Inspection Mode, all write operations are strictly blocked!
  if (isInspectionMode && action !== 'view' && action !== 'export') {
    return false;
  }

  // Central Directorate Admin has universal access
  if (roleCode === 'directorate_admin') {
    if (action === 'delete' && module === 'audit_logs') return false; // Audit logs can never be deleted
    return true;
  }

  // Check custom school-configured permissions first
  if (customRolePermissions && customRolePermissions[module]) {
    const rule = customRolePermissions[module]!;
    if (action === 'view') return !!rule.canView;
    if (action === 'add') return !!rule.canAdd;
    if (action === 'edit') return !!rule.canEdit;
    if (action === 'delete') return !!rule.canDelete;
    if (action === 'export') return !!rule.canExport;
  }

  // Fallback to default system role permissions
  const defaultMap = DEFAULT_ROLE_PERMISSIONS[roleCode];
  if (!defaultMap || !defaultMap[module]) return false;

  const rule = defaultMap[module];
  if (action === 'view') return !!rule.canView;
  if (action === 'add') return !!rule.canAdd;
  if (action === 'edit') return !!rule.canEdit;
  if (action === 'delete') return !!rule.canDelete;
  if (action === 'export') return !!rule.canExport;

  return false;
}
