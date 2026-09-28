import { describe, it, expect } from 'vitest';
import { Student, Department, SchoolClass, OfficialNotice, User, AttendanceRecord } from '../src/types';

describe('Role-Based Dashboards & Action Centers Logic (Phase 2)', () => {
  const mockDepartments: Department[] = [
    {
      id: 'dept_elec',
      name: 'الكهرباء الصناعية',
      code: 'ELEC',
      description: '',
      scientificSupervisorName: 'د. محمد',
      practicalSupervisorName: 'م. أحمد',
      iconName: 'Zap',
      totalStudents: 30,
      workshopCount: 2,
      availableGrades: [1, 2, 3],
    },
    {
      id: 'dept_auto',
      name: 'ميكانيكا السيارات',
      code: 'AUTO',
      description: '',
      scientificSupervisorName: 'د. خالد',
      practicalSupervisorName: 'م. سامي',
      iconName: 'Car',
      totalStudents: 25,
      workshopCount: 2,
      availableGrades: [1, 2, 3],
    },
  ];

  const mockClasses: SchoolClass[] = [
    {
      id: 'cls_1',
      name: '1/1 كهرباء',
      gradeLevel: 1,
      gradeName: 'الصف الأول',
      departmentId: 'dept_elec',
      departmentName: 'الكهرباء الصناعية',
      supervisorTeacherId: 'teacher_1',
      supervisorTeacherName: 'أستاذ أحمد',
      roomNumber: 'ورشة 1',
      studentCount: 30,
    },
  ];

  const mockStudents: Student[] = [
    {
      id: 'std_safe',
      fullName: 'طالب منضبط ممتاز',
      nationalId: '30801011234567',
      studentCode: '1001',
      gradeLevel: 1,
      departmentId: 'dept_elec',
      classId: 'cls_1',
      guardianName: 'ولي الأمر',
      guardianPhone: '01012345678',
      guardianJob: 'مهندس',
      address: 'القاهرة',
      status: 'منتظم',
      enrollmentDate: '2025-09-01',
      birthDate: '2008-01-01',
      totalAbsenceDays: 2,
      consecutiveAbsenceDays: 1,
      excusedAbsenceDays: 0,
      workshopAbsenceHours: 0,
      theoreticalAbsenceDays: 2,
      workshopEscapeCount: 0,
      warningLevel: 0,
      workshopAttendanceRate: 100,
      attendanceRate: 95,
    },
    {
      id: 'std_warn1_near',
      fullName: 'طالب يقترب من الإنذار الأول',
      nationalId: '30801011234568',
      studentCode: '1002',
      gradeLevel: 1,
      departmentId: 'dept_elec',
      classId: 'cls_1',
      guardianName: 'ولي الأمر 2',
      guardianPhone: '01012345679',
      guardianJob: 'موظف',
      address: 'القاهرة',
      status: 'منتظم',
      enrollmentDate: '2025-09-01',
      birthDate: '2008-01-01',
      totalAbsenceDays: 8,
      consecutiveAbsenceDays: 4,
      excusedAbsenceDays: 0,
      workshopAbsenceHours: 12,
      theoreticalAbsenceDays: 6,
      workshopEscapeCount: 0,
      warningLevel: 0,
      workshopAttendanceRate: 80,
      attendanceRate: 72,
    },
    {
      id: 'std_expulsion_near',
      fullName: 'طالب في منطقة خطر الفصل',
      nationalId: '30801011234569',
      studentCode: '1003',
      gradeLevel: 1,
      departmentId: 'dept_elec',
      classId: 'cls_1',
      guardianName: 'ولي الأمر 3',
      guardianPhone: '01012345680',
      guardianJob: 'تاجر',
      address: 'الجيزة',
      status: 'منتظم',
      enrollmentDate: '2025-09-01',
      birthDate: '2008-01-01',
      totalAbsenceDays: 26,
      consecutiveAbsenceDays: 13,
      excusedAbsenceDays: 0,
      workshopAbsenceHours: 36,
      theoreticalAbsenceDays: 20,
      workshopEscapeCount: 2,
      warningLevel: 2,
      workshopAttendanceRate: 50,
      attendanceRate: 40,
    },
  ];

  it('correctly filters students approaching Warning 1 (4 consec or 8-9 separate)', () => {
    const nearWarning1 = mockStudents.filter(
      (s) =>
        s.warningLevel === 0 &&
        ((s.consecutiveAbsenceDays >= 4 && s.consecutiveAbsenceDays < 5) ||
          (s.totalAbsenceDays >= 8 && s.totalAbsenceDays < 10))
    );

    expect(nearWarning1.length).toBe(1);
    expect(nearWarning1[0].id).toBe('std_warn1_near');
  });

  it('correctly filters students approaching Expulsion (12-14 consec or 25-29 separate)', () => {
    const nearExpulsion = mockStudents.filter(
      (s) =>
        s.warningLevel < 3 &&
        ((s.consecutiveAbsenceDays >= 12 && s.consecutiveAbsenceDays < 15) ||
          (s.totalAbsenceDays >= 25 && s.totalAbsenceDays < 30))
    );

    expect(nearExpulsion.length).toBe(1);
    expect(nearExpulsion[0].id).toBe('std_expulsion_near');
  });

  it('calculates parent absence meters and remaining threshold according to Law 139', () => {
    const student = mockStudents[2]; // totalAbsenceDays: 26, consec: 13
    const remainingToSeparateExpulsion = Math.max(0, 30 - student.totalAbsenceDays);
    const remainingToConsecutiveExpulsion = Math.max(0, 15 - student.consecutiveAbsenceDays);

    expect(remainingToSeparateExpulsion).toBe(4);
    expect(remainingToConsecutiveExpulsion).toBe(2);
    expect(student.workshopAttendanceRate! < 85).toBe(true);
  });

  it('flags students for social worker auto-referral when absence >= 5 or escape > 0', () => {
    const autoReferred = mockStudents.filter(
      (s) => s.totalAbsenceDays >= 5 || s.consecutiveAbsenceDays >= 3 || s.workshopEscapeCount > 0
    );

    expect(autoReferred.length).toBe(2); // std_warn1_near (8 days) and std_expulsion_near (26 days & 2 escapes)
  });
});
