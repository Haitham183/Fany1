import { describe, it, expect } from 'vitest';
import { generateVerificationSample, generateReproducibleSample } from '../src/lib/verificationEngine';
import { Student } from '../src/types';

describe('Verification Engine (PRNG Sampling & Reproducibility)', () => {
  const students: Student[] = Array.from({ length: 30 }, (_, i) => ({
    id: `std_${i + 1}`,
    studentCode: `200${i + 1}`,
    nationalId: `3050101123456${i}`,
    fullName: `طالب تجريبي رقم ${i + 1}`,
    gender: 'male',
    gradeLevel: 1,
    departmentId: 'dept_elec',
    classId: 'cls_1',
    guardianName: `ولي أمر ${i + 1}`,
    guardianPhone: '01000000000',
    guardianJob: 'موظف',
    address: 'القاهرة',
    status: 'enrolled',
    enrollmentDate: '2025-09-01',
    birthDate: '2008-01-01',
    totalAbsenceDays: 0,
    consecutiveAbsenceDays: 0,
    excusedAbsenceDays: 0,
    workshopAbsenceHours: 0,
    theoreticalAbsenceDays: 0,
    workshopEscapeCount: 0,
    warningLevel: 0,
  }));

  it('generates reproducible sampling with identical seed', () => {
    const fixedSeed = 12345678;
    const sample1 = generateReproducibleSample(students, 5, fixedSeed);
    const sample2 = generateReproducibleSample(students, 5, fixedSeed);

    expect(sample1.map((s) => s.id)).toEqual(sample2.map((s) => s.id));
  });

  it('generates correct sample size based on sampleRate (e.g. 15% of 30 = 5)', () => {
    const result = generateVerificationSample({
      students,
      sampleRate: 0.15,
      verifierType: 'internal',
      verifierName: 'محقق داخلي تجريبي',
      unitId: 'unit_1',
      departmentId: 'dept_elec',
      gradeLevel: 1,
    });

    expect(result.sampledStudents.length).toBe(5);
    expect(result.sampleStudentIds.length).toBe(5);
    expect(typeof result.seed).toBe('number');
  });

  it('generates distinct seeds for different units or verifiers', () => {
    const res1 = generateVerificationSample({
      students,
      sampleRate: 0.15,
      verifierType: 'internal',
      verifierName: 'محقق أ',
      unitId: 'unit_1',
      departmentId: 'dept_elec',
      gradeLevel: 1,
    });

    const res2 = generateVerificationSample({
      students,
      sampleRate: 0.15,
      verifierType: 'internal',
      verifierName: 'محقق ب',
      unitId: 'unit_2',
      departmentId: 'dept_elec',
      gradeLevel: 1,
    });

    expect(res1.seed).not.toEqual(res2.seed);
  });
});
