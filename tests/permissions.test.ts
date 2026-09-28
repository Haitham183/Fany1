import { describe, it, expect } from 'vitest';
import { hasPermission, ROLE_PERMISSIONS_MATRIX } from '../src/lib/permissions';
import { User, UserRole } from '../src/types';

describe('RBAC & Permission Matrix (مصفوفة الصلاحيات والأدوار)', () => {
  const createUser = (role: UserRole): User => ({
    id: `user_${role}`,
    name: `مستخدم ${role}`,
    username: `${role}_user`,
    role,
    roleTitle: `منصب ${role}`,
  });

  it('grants principal full administrative, audit, and settings permissions', () => {
    const principal = createUser('principal');
    expect(hasPermission(principal, 'school_settings', 'admin')).toBe(true);
    expect(hasPermission(principal, 'user_accounts', 'admin')).toBe(true);
    expect(hasPermission(principal, 'audit_logs', 'view')).toBe(true);
    expect(hasPermission(principal, 'student_records', 'admin')).toBe(true);
  });

  it('grants social worker access to social cases and excuses but not school settings', () => {
    const socialWorker = createUser('social_worker');
    expect(hasPermission(socialWorker, 'social_cases', 'admin')).toBe(true);
    expect(hasPermission(socialWorker, 'excuses', 'control')).toBe(true);
    expect(hasPermission(socialWorker, 'school_settings', 'admin')).toBe(false);
    expect(hasPermission(socialWorker, 'user_accounts', 'admin')).toBe(false);
  });

  it('restricts teacher from deleting students or modifying school settings', () => {
    const teacher = createUser('teacher');
    expect(hasPermission(teacher, 'attendance', 'control')).toBe(true);
    expect(hasPermission(teacher, 'competencies', 'control')).toBe(true);
    expect(hasPermission(teacher, 'student_records', 'admin')).toBe(false);
    expect(hasPermission(teacher, 'school_settings', 'admin')).toBe(false);
  });

  it('allows external verifier read and audit access on competencies but no settings edit', () => {
    const verifier = createUser('external_verifier');
    expect(hasPermission(verifier, 'competencies', 'view')).toBe(true);
    expect(hasPermission(verifier, 'verification_sessions', 'control')).toBe(true);
    expect(hasPermission(verifier, 'school_settings', 'admin')).toBe(false);
  });
});
