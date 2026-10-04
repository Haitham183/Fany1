import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/server/auth/session';
import {
  DEFAULT_ROLE_PERMISSIONS,
  SYSTEM_MODULES_ARABIC,
  SystemModule,
  RolePermissionsMap,
} from '@/lib/server/auth/permissions';
import { recordAuditLog } from '@/lib/server/audit/auditLogger';

// In-memory custom matrix store per school & role
const customSchoolRolePermissions: Record<string, Record<string, RolePermissionsMap>> = {};

const UpdatePermissionsSchema = z.object({
  roleCode: z.string().min(1),
  permissions: z.record(
    z.string(),
    z.object({
      canView: z.boolean(),
      canAdd: z.boolean(),
      canEdit: z.boolean(),
      canDelete: z.boolean(),
      canExport: z.boolean(),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مسجل الدخول' }, { status: 401 });
    }

    const schoolId = session.schoolId || 'global';
    const schoolCustom = customSchoolRolePermissions[schoolId] || {};

    // Merge default and custom
    const rolesList = Object.keys(DEFAULT_ROLE_PERMISSIONS).map((code) => {
      const perms = schoolCustom[code] || DEFAULT_ROLE_PERMISSIONS[code];
      return {
        code,
        permissions: perms,
      };
    });

    return NextResponse.json({
      success: true,
      modules: SYSTEM_MODULES_ARABIC,
      roles: rolesList,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ في جلب الصلاحيات';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مسجل الدخول' }, { status: 401 });
    }

    // Only School Principal or Directorate Admin can modify role permissions
    if (session.roleCode !== 'principal' && session.roleCode !== 'directorate_admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: تعديل مصفوفة الصلاحيات مقتصر على مدير المدرسة فقط' },
        { status: 403 }
      );
    }

    // If in inspection mode, read-only!
    if (session.inspectingSchoolId) {
      return NextResponse.json(
        { success: false, error: 'غير مسموح بالتعديل أثناء وضع المعاينة للقراءة فقط' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parse = UpdatePermissionsSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: parse.error.issues?.[0]?.message || 'بيانات غير صالحة' },
        { status: 400 }
      );
    }

    const { roleCode, permissions } = parse.data;
    const schoolId = session.schoolId || 'global';

    if (!customSchoolRolePermissions[schoolId]) {
      customSchoolRolePermissions[schoolId] = {};
    }

    const previousPerms =
      customSchoolRolePermissions[schoolId][roleCode] || DEFAULT_ROLE_PERMISSIONS[roleCode];

    customSchoolRolePermissions[schoolId][roleCode] = permissions as unknown as RolePermissionsMap;

    // Record Audit Log with before and after diff!
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await recordAuditLog({
      actorId: session.userId,
      actorName: session.fullName,
      actorRole: session.roleCode,
      schoolId: session.schoolId,
      action: 'UPDATE',
      resource: 'permission',
      resourceId: roleCode,
      beforeJson: previousPerms as unknown as Record<string, unknown>,
      afterJson: permissions as unknown as Record<string, unknown>,
      details: `تعديل مصفوفة الصلاحيات للدور: ${roleCode} بواسطة ${session.fullName}`,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ وتحديث مصفوفة الصلاحيات بنجاح',
      roleCode,
      permissions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ أثناء حفظ الصلاحيات';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
