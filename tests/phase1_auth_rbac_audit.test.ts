import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/server/auth/passwords';
import { createSessionToken, verifySessionToken, AuthSessionPayload } from '../src/lib/server/auth/session';
import { checkPermission, DEFAULT_ROLE_PERMISSIONS, RolePermissionsMap } from '../src/lib/server/auth/permissions';
import {
  recordAuditLog,
  queryAuditLogs,
  resetAuditLogsForTesting,
  AuditLogEntry,
} from '../src/lib/server/audit/auditLogger';

describe('المرحلة 1: اختبارات المصادقة والأمان والصلاحيات وسجل التدقيق (Phase 1: Auth, RBAC & Audit)', () => {
  beforeEach(() => {
    resetAuditLogsForTesting();
  });

  // -------------------------------------------------------------
  // 1. Argon2id Password Hashing Tests
  // -------------------------------------------------------------
  describe('1. تشفير كلمات المرور (Argon2id Hashing)', () => {
    it('يقوم بتجزئة كلمة المرور بنجاح باستخدام Argon2id', async () => {
      const plain = 'SecretPass2026!';
      const hash = await hashPassword(plain);

      expect(hash).toBeDefined();
      expect(hash.startsWith('$argon2id$')).toBe(true);
      expect(hash).not.toEqual(plain);
    });

    it('يتحقق بنجاح من صحة كلمة المرور ويرفض الكلمات الخاطئة', async () => {
      const plain = 'CorrectPassword123';
      const hash = await hashPassword(plain);

      const isValid = await verifyPassword(plain, hash);
      const isInvalid = await verifyPassword('WrongPassword!', hash);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('يرفض كلمات المرور القصيرة جداً لمنع كلمات المرور الضعيفة', async () => {
      await expect(hashPassword('12')).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------
  // 2. Session Management & Token Tests
  // -------------------------------------------------------------
  describe('2. إدارة الجلسات وتوكن الـ JWT', () => {
    it('يقوم بتوليد توكن مشفر وموقع لجلسات HttpOnly', async () => {
      const payload: AuthSessionPayload = {
        userId: 'usr_teacher_01',
        username: 'teacher_tarek',
        fullName: 'طارق عبد الرازق',
        roleCode: 'teacher',
        schoolId: 'sch_cairo_abbassia',
        departmentId: 'dept_elec',
        isInternalVerifier: false,
      };

      const token = await createSessionToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('usr_teacher_01');
      expect(verified?.schoolId).toBe('sch_cairo_abbassia');
      expect(verified?.roleCode).toBe('teacher');
    });

    it('يرفض التوكنات المعدلة أو المزورة', async () => {
      const validPayload: AuthSessionPayload = {
        userId: 'usr_test',
        username: 'test',
        fullName: 'مستخدم تجريبي',
        roleCode: 'teacher',
        schoolId: 'sch_01',
        departmentId: null,
        isInternalVerifier: false,
      };

      const token = await createSessionToken(validPayload);
      const tamperedToken = token.slice(0, -6) + 'xxxxxx';

      const result = await verifySessionToken(tamperedToken);
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------
  // 3. Multi-Tenancy & Permission Matrix (RBAC) Tests
  // -------------------------------------------------------------
  describe('3. مصفوفة الصلاحيات والعزل بين الأدوار (RBAC)', () => {
    it('يتحقق من الصلاحيات الافتراضية للمعلم (تسجيل حضور وجدارات دون حذف الطلاب)', () => {
      // Teacher can add attendance
      expect(checkPermission('teacher', 'attendance', 'add')).toBe(true);
      // Teacher cannot delete students
      expect(checkPermission('teacher', 'students', 'delete')).toBe(false);
      // Teacher cannot edit school settings
      expect(checkPermission('teacher', 'settings', 'edit')).toBe(false);
    });

    it('يتحقق من صلاحيات مدير المدرسة الإشرافية والإدارية', () => {
      // Principal can view, add, edit, export students
      expect(checkPermission('principal', 'students', 'view')).toBe(true);
      expect(checkPermission('principal', 'students', 'edit')).toBe(true);
      expect(checkPermission('principal', 'roles', 'edit')).toBe(true);
      expect(checkPermission('principal', 'settings', 'edit')).toBe(true);
    });

    it('يطبق التخصيصات المخصصة للمدرسة فوق المصفوفة الافتراضية', () => {
      const customOverride: Partial<RolePermissionsMap> = {
        students: {
          canView: true,
          canAdd: false,
          canEdit: false,
          canDelete: false,
          canExport: true, // Specifically granted export
        },
      };

      // With custom override, export is granted
      const allowed = checkPermission('teacher', 'students', 'export', customOverride);
      expect(allowed).toBe(true);
    });

    it('يحظر جميع عمليات التعديل والحذف والإضافة في وضع المعاينة لمسئول المديرية (Read-Only Mode)', () => {
      // Under inspection mode, even directorate admin is locked to READ-ONLY!
      const canEditAttendance = checkPermission('directorate_admin', 'attendance', 'edit', null, true);
      const canDeleteStudent = checkPermission('directorate_admin', 'students', 'delete', null, true);
      const canAddNotice = checkPermission('directorate_admin', 'notices', 'add', null, true);
      const canViewDashboard = checkPermission('directorate_admin', 'dashboard', 'view', null, true);

      expect(canEditAttendance).toBe(false);
      expect(canDeleteStudent).toBe(false);
      expect(canAddNotice).toBe(false);
      expect(canViewDashboard).toBe(true); // Viewing is allowed
    });
  });

  // -------------------------------------------------------------
  // 4. Enterprise Audit Log Engine Tests
  // -------------------------------------------------------------
  describe('4. سجل التدقيق الشامل والتوثيق (Audit Logging)', () => {
    it('يسجل حركات النظام مع توثيق (من / ماذا / متى / قبل / بعد)', async () => {
      const beforeState = { warningDays: 5, workshopRate: 85 };
      const afterState = { warningDays: 7, workshopRate: 85 };

      await recordAuditLog({
        schoolId: 'sch_cairo_abbassia',
        actorId: 'usr_princ_01',
        actorName: 'م. رفعت الجندي',
        actorRole: 'principal',
        action: 'UPDATE',
        resource: 'school_settings',
        resourceId: 'setting_01',
        beforeJson: beforeState,
        afterJson: afterState,
        details: 'تعديل الحد الأدنى لأيام الإنذار الأول من 5 إلى 7 أيام',
        ipAddress: '192.168.1.100',
      });

      const logs = queryAuditLogs({ schoolId: 'sch_cairo_abbassia' });
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.actorName).toBe('م. رفعت الجندي');
      expect(log.action).toBe('UPDATE');
      expect(log.beforeJson).toEqual(beforeState);
      expect(log.afterJson).toEqual(afterState);
      expect(log.ipAddress).toBe('192.168.1.100');
    });

    it('يوثق دخول وخروج مسئول المديرية في وضع المعاينة الميدانية بدقة', async () => {
      // 1. Enter inspection
      await recordAuditLog({
        schoolId: 'sch_cairo_abbassia',
        actorId: 'usr_dir_cairo',
        actorName: 'د. حسام الدين عبد القادر',
        actorRole: 'directorate_admin',
        action: 'INSPECTION_ENTER',
        resource: 'inspection_session',
        resourceId: 'sch_cairo_abbassia',
        details: 'دخول مسئول المديرية لمعاينة مدرسة العباسية الميكانيكية',
      });

      // 2. Exit inspection
      await recordAuditLog({
        schoolId: 'sch_cairo_abbassia',
        actorId: 'usr_dir_cairo',
        actorName: 'د. حسام الدين عبد القادر',
        actorRole: 'directorate_admin',
        action: 'INSPECTION_EXIT',
        resource: 'inspection_session',
        resourceId: 'sch_cairo_abbassia',
        details: 'إنهاء مسئول المديرية لوضع المعاينة والعودة للقيادة المركزية',
      });

      const inspectionLogs = queryAuditLogs({
        action: 'INSPECTION_ENTER',
      });

      expect(inspectionLogs.length).toBe(1);
      expect(inspectionLogs[0].actorRole).toBe('directorate_admin');
      expect(inspectionLogs[0].details).toContain('دخول مسئول المديرية');
    });

    it('يطبق عزل سجلات التدقيق بين المدارس المختلفة (Tenant Isolation for Audit)', async () => {
      // Log for School A
      await recordAuditLog({
        schoolId: 'school_A',
        actorId: 'user_A',
        actorName: 'مدير مدرسة أ',
        actorRole: 'principal',
        action: 'LOGIN',
        resource: 'auth',
      });

      // Log for School B
      await recordAuditLog({
        schoolId: 'school_B',
        actorId: 'user_B',
        actorName: 'مدير مدرسة ب',
        actorRole: 'principal',
        action: 'LOGIN',
        resource: 'auth',
      });

      const logsSchoolA = queryAuditLogs({ schoolId: 'school_A' });
      const logsSchoolB = queryAuditLogs({ schoolId: 'school_B' });

      expect(logsSchoolA.length).toBe(1);
      expect(logsSchoolA[0].actorName).toBe('مدير مدرسة أ');

      expect(logsSchoolB.length).toBe(1);
      expect(logsSchoolB[0].actorName).toBe('مدير مدرسة ب');
    });
  });
});
