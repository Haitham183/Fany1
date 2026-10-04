import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server/auth/session';
import { queryAuditLogs } from '@/lib/server/audit/auditLogger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'غير مسجل الدخول' }, { status: 401 });
    }

    // Role verification: Directorate Admin, Principal, or Affairs Deputy only
    const allowedRoles = ['directorate_admin', 'principal', 'affairs_deputy'];
    if (!allowedRoles.includes(session.roleCode)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: صلاحية الاطلاع على سجل التدقيق مقتصرة على الإدارة العليا' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const actorId = searchParams.get('actorId') || undefined;

    // Strict Tenant Isolation:
    // If not directorate_admin, strictly restrict to current school's audit logs!
    const effectiveSchoolId =
      session.roleCode === 'directorate_admin'
        ? searchParams.get('schoolId') || null
        : session.schoolId;

    const logs = queryAuditLogs({
      schoolId: effectiveSchoolId,
      action,
      resource,
      actorId,
      limit: 150,
    });

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ أثناء استعلام سجل التدقيق';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
