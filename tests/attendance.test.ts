import { describe, it, expect } from 'vitest';
import { calculateStudentAttendanceStats } from '../src/lib/storage';
import { Student, SchoolConfig, AttendanceRecord } from '../src/types';

describe('Attendance Calculation Engine (المادة 25 وقانون 139)', () => {
  const mockConfig: SchoolConfig = {
    name: 'المدرسة الفنية التجريبية',
    directorate: 'مديرية القاهرة',
    administration: 'إدارة التعليم الفني',
    academicYear: '2025/2026',
    currentTerm: 'الفصل الدراسي الأول',
    schoolSystemType: '3_years',
    schoolShiftType: 'single_morning',
    workDaysScheme: 'sun_to_thu',
    phone: '',
    address: '',
    managerName: '',
    managerTitle: 'مدير المدرسة',
    studentAffairsHead: 'رئيس الشئون',
    minDaysForAttendanceWarning: 10,
    absenceOnePeriodCountsAsDay: true,
    practicalMinAttendanceRate: 85,
    theoreticalMinAttendanceRate: 75,
    minWorkshopAttendanceRate: 85,
    minTheoreticalAttendanceRate: 75,
  };

  const mockStudent: Student = {
    id: 'std_test_1',
    studentCode: '1001',
    nationalId: '30501011234567',
    fullName: 'أحمد محمود حسن إبراهيم',
    gender: 'male',
    gradeLevel: 1,
    departmentId: 'dept_1',
    classId: 'class_1',
    guardianName: 'محمود حسن',
    guardianPhone: '01000000000',
    guardianJob: 'موظف',
    address: 'القاهرة',
    status: 'enrolled',
    enrollmentDate: '2025-09-01',
    birthDate: '2008-01-01',
    totalAttendedDays: 8,
    totalAbsenceDays: 2,
    consecutiveAbsenceDays: 1,
    excusedAbsenceDays: 0,
    workshopAbsenceHours: 4,
    theoreticalAbsenceDays: 2,
    workshopEscapeCount: 0,
    warningLevel: 0,
    totalRecordedDays: 10,
    attendanceRate: 80,
    workshopPresentHours: 36,
    workshopAttendanceRate: 90,
  };

  it('calculates dynamic attendance stats from actual days recorded', () => {
    const stats = calculateStudentAttendanceStats(mockStudent, undefined, mockConfig);

    expect(stats.totalRecordedDays).toBe(10);
    expect(stats.actualAttendedDays).toBe(8);
    expect(stats.actualAbsenceDays).toBe(2);
    expect(stats.overallAttendanceRate).toBe(80);
    expect(stats.workshopAttendanceRate).toBe(90);
    expect(stats.isPracticalEligible).toBe(true);
  });

  it('suppresses percentage warnings when recorded days < min threshold (10 days)', () => {
    const earlyStudent: Student = {
      ...mockStudent,
      totalAttendedDays: 2,
      totalAbsenceDays: 1,
      totalRecordedDays: 3, // Less than 10 days
      attendanceRate: 66.7, // 66.7% would trigger warning if threshold not respected
    };

    const stats = calculateStudentAttendanceStats(earlyStudent, undefined, mockConfig);

    expect(stats.isUnderWarningThreshold).toBe(false);
  });

  it('triggers percentage warning when recorded days >= min threshold and rate < 75%', () => {
    const laggingStudent: Student = {
      ...mockStudent,
      totalAttendedDays: 7,
      totalAbsenceDays: 5,
      totalRecordedDays: 12, // >= 10 days
      attendanceRate: 58.3,
    };

    const stats = calculateStudentAttendanceStats(laggingStudent, undefined, mockConfig);

    expect(stats.isUnderWarningThreshold).toBe(true);
  });
});
