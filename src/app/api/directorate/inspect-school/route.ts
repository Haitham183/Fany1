import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession, setSessionCookie } from '@/lib/server/auth/session';
import { recordAuditLog } from '@/lib/server/audit/auditLogger';

const InspectSchoolSchema = z.object({
  schoolId: z.string().min(1, 'معرف المدرسة مطلوب'),
  schoolName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.roleCode !== 'directorate_admin') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: هذه الميزة مخصصة لمسئول مديرية التربية والتعليم فقط' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parse = InspectSchoolSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ success: false, error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const { schoolId, schoolName } = parse.data;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Audit log the inspection start event
    await recordAuditLog({
      actorId: session.userId,
      actorName: session.fullName,
      actorRole: session.roleCode,
      schoolId: schoolId,
      action: 'INSPECTION_ENTER',
      resource: 'inspection_session',
      resourceId: schoolId,
      details: `دخول مسئول المديرية (${session.fullName}) في وضع المعاينة والرقابة الميدانية لمدرسة: ${schoolName || schoolId}`,
      ipAddress: ip,
    });

    // 2. Update HttpOnly session cookie with inspectingSchoolId
    await setSessionCookie({
      ...session,
      inspectingSchoolId: schoolId,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل وضع المعاينة للقراءة فقط بنجاح وتوثيق الحدث في سجل التدقيق',
      inspectingSchoolId: schoolId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ أثناء بدء المعاينة';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.roleCode !== 'directorate_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const previousSchoolId = session.inspectingSchoolId;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Audit log the inspection exit event
    if (previousSchoolId) {
      await recordAuditLog({
        actorId: session.userId,
        actorName: session.fullName,
        actorRole: session.roleCode,
        schoolId: previousSchoolId,
        action: 'INSPECTION_EXIT',
        resource: 'inspection_session',
        resourceId: previousSchoolId,
        details: `إنهاء مسئول المديرية (${session.fullName}) لوضع المعاينة والعودة لغرفة القيادة المركزية للمحافظة`,
        ipAddress: ip,
      });
    }

    // 2. Clear inspectingSchoolId in session cookie
    await setSessionCookie({
      ...session,
      inspectingSchoolId: null,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنهاء وضع المعاينة والعودة لغرفة القيادة المركزية',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ أثناء إنهاء المعاينة';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
