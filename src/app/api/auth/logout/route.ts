import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, clearSessionCookie } from '@/lib/server/auth/session';
import { recordAuditLog } from '@/lib/server/audit/auditLogger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (session) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'Gov-Tech-Client';

      await recordAuditLog({
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.roleCode,
        schoolId: session.schoolId,
        action: 'LOGOUT',
        resource: 'auth',
        resourceId: session.userId,
        details: `تسجيل خروج رسمي للمستخدم ${session.fullName}`,
        ipAddress: ip,
        userAgent: userAgent,
      });
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'خطأ أثناء تسجيل الخروج';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
