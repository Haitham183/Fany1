import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/server/auth/session';

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        fullName: session.fullName,
        roleCode: session.roleCode,
        schoolId: session.schoolId,
        departmentId: session.departmentId,
        isInternalVerifier: session.isInternalVerifier,
        inspectingSchoolId: session.inspectingSchoolId || null,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'خطأ أثناء جلب الجلسة';
    return NextResponse.json({ authenticated: false, error: errorMsg }, { status: 500 });
  }
}
