import { User, UserRole } from '@/types';

export type PermissionAction = 'view' | 'create_update' | 'approve';

export interface ActionCapability {
  canView: boolean;
  canCreateUpdate: boolean;
  canApprove: boolean;
}

/**
 * مصفوفة الصلاحيات المعتمدة للتعليم الفني (V: عرض, C: إنشاء/تعديل, A: اعتماد)
 */
export const ROLE_PERMISSION_MATRIX: Record<
  string,
  Record<UserRole, { V: boolean; C: boolean; A: boolean }>
> = {
  student_admissions: {
    principal: { V: true, C: true, A: true },
    affairs_deputy: { V: true, C: true, A: true },
    affairs_officer: { V: true, C: true, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: true, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  daily_attendance: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: true, C: false, A: true },
    affairs_officer: { V: true, C: true, A: false },
    social_worker: { V: true, C: false, A: false },
    dept_head: { V: true, C: true, A: true }, // قسمه
    teacher: { V: true, C: true, A: false }, // فصوله
    parent: { V: true, C: false, A: false }, // ابنه فقط
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: true, C: false, A: false },
  },
  excuses_management: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: true, C: true, A: true },
    affairs_officer: { V: true, C: true, A: false },
    social_worker: { V: true, C: true, A: false },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  official_notices: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: true, C: true, A: true },
    affairs_officer: { V: true, C: true, A: false },
    social_worker: { V: true, C: false, A: false },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: true, C: false, A: false }, // إخطارات ابنه فقط
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  expulsion_reinstatement: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: true, C: true, A: false }, // يقترح
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  competencies_evaluation: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: false, C: false, A: false },
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: true, C: true, A: true }, // يعتمد نتائج القسم
    teacher: { V: true, C: true, A: false }, // يرصد أدلة ومخرجات فصوله
    parent: { V: true, C: false, A: false }, // يرى موقف ابنه فقط
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: true, C: false, A: false }, // قراءة فقط أثناء الزيارة
  },
  internal_verification: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: false, C: false, A: false },
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: true, C: true, A: true },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: true, C: true, A: false },
  },
  social_cases: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: true, C: false, A: false }, // يرى ملخصاً فقط
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: true, C: true, A: true },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false }, // لا يرى دراسات الحالة نهائياً
    system_admin: { V: false, C: false, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  user_management: {
    principal: { V: true, C: true, A: true },
    affairs_deputy: { V: false, C: false, A: false },
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: true, C: true, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
  school_settings: {
    principal: { V: true, C: false, A: true },
    affairs_deputy: { V: false, C: false, A: false },
    affairs_officer: { V: false, C: false, A: false },
    social_worker: { V: false, C: false, A: false },
    dept_head: { V: false, C: false, A: false },
    teacher: { V: false, C: false, A: false },
    parent: { V: false, C: false, A: false },
    system_admin: { V: true, C: true, A: false },
    external_verifier: { V: false, C: false, A: false },
  },
};

export const checkUserPermission = (
  user: User | null | undefined,
  resourceKey: string,
  action: PermissionAction
): boolean => {
  if (!user) return false;

  // External verifier expiration check
  if (user.role === 'external_verifier') {
    if (user.externalVerifierExpiresAt && new Date(user.externalVerifierExpiresAt) < new Date()) {
      return false;
    }
  }

  // Internal Verifier Assignment check for verification actions
  if (resourceKey === 'internal_verification' && user.isInternalVerifier) {
    return true;
  }

  const matrixEntry = ROLE_PERMISSION_MATRIX[resourceKey];
  if (!matrixEntry) return false;

  const roleCaps = matrixEntry[user.role];
  if (!roleCaps) return false;

  if (action === 'view') return roleCaps.V;
  if (action === 'create_update') return roleCaps.C;
  if (action === 'approve') return roleCaps.A;

  return false;
};

export const hasPermission = (
  user: User | null | undefined,
  resourceKey: string,
  action: 'view' | 'control' | 'admin' | PermissionAction
): boolean => {
  if (!user) return false;
  if (user.role === 'principal') return true;

  // Map simplified action names
  let permAction: PermissionAction = 'view';
  if (action === 'control' || action === 'create_update') permAction = 'create_update';
  else if (action === 'admin' || action === 'approve') permAction = 'approve';

  // Map simplified resource names
  let key = resourceKey;
  if (resourceKey === 'attendance') key = 'daily_attendance';
  else if (resourceKey === 'competencies') key = 'competencies_evaluation';
  else if (resourceKey === 'verification_sessions') key = 'internal_verification';
  else if (resourceKey === 'student_records') key = 'student_admissions';
  else if (resourceKey === 'user_accounts') key = 'user_management';
  else if (resourceKey === 'excuses') key = 'excuses_management';
  else if (resourceKey === 'audit_logs') return user.role === 'system_admin';

  return checkUserPermission(user, key, permAction);
};

export const ROLE_PERMISSIONS_MATRIX = ROLE_PERMISSION_MATRIX;
