import { describe, it, expect } from 'vitest';
import {
  evaluateCbeUnitState,
  evaluateYearEndAdvancement,
  EvaluateCbeUnitInput,
} from '../src/lib/cbeStateMachine';

describe('CBE Regulatory State Machine (لائحة التقييم والتحقق)', () => {
  const defaultOutcomes = [
    { outcomeId: 'lo_1', result: 'first_attempt_pass' as const, hasPerformanceEvidence: true, hasProductEvidence: true, hasKnowledgeEvidence: true },
    { outcomeId: 'lo_2', result: 'first_attempt_pass' as const, hasPerformanceEvidence: true, hasProductEvidence: true, hasKnowledgeEvidence: true },
    { outcomeId: 'lo_3', result: 'first_attempt_pass' as const, hasPerformanceEvidence: true, hasProductEvidence: true, hasKnowledgeEvidence: true },
  ];

  it('evaluates Attempt 1 pass as Competent (جدير)', () => {
    const result = evaluateCbeUnitState({
      studentId: 'std_1',
      unitId: 'unit_1',
      outcomesCount: 3,
      outcomesResults: defaultOutcomes,
      workshopAttendanceRate: 90,
    });

    expect(result.finalStatus).toBe('competent');
    expect(result.statusLabel).toBe('جدير');
    expect(result.allOutcomesPassed).toBe(true);
    expect(result.isEligibleForAssessment).toBe(true);
  });

  it('evaluates Attempt 2 pass as Competent (جدير من الفرصة الثانية)', () => {
    const outcomes = [
      { outcomeId: 'lo_1', result: 'first_attempt_pass' as const, hasPerformanceEvidence: true },
      { outcomeId: 'lo_2', result: 'second_attempt_pass' as const, hasPerformanceEvidence: true, hasProductEvidence: true },
      { outcomeId: 'lo_3', result: 'first_attempt_pass' as const, hasPerformanceEvidence: true },
    ];

    const result = evaluateCbeUnitState({
      studentId: 'std_1',
      unitId: 'unit_1',
      outcomesCount: 3,
      outcomesResults: outcomes,
      workshopAttendanceRate: 88,
    });

    expect(result.finalStatus).toBe('competent');
    expect(result.allOutcomesPassed).toBe(true);
  });

  it('requires remedial program when an outcome fails 2 attempts', () => {
    const outcomes = [
      { outcomeId: 'lo_1', result: 'first_attempt_pass' as const },
      { outcomeId: 'lo_2', result: 'remedial_program' as const },
      { outcomeId: 'lo_3', result: 'first_attempt_pass' as const },
    ];

    const result = evaluateCbeUnitState({
      studentId: 'std_1',
      unitId: 'unit_1',
      outcomesCount: 3,
      outcomesResults: outcomes,
      workshopAttendanceRate: 92,
    });

    expect(result.finalStatus).toBe('remedial_required');
    expect(result.statusLabel).toContain('البرنامج العلاجي');
    expect(result.allOutcomesPassed).toBe(false);
  });

  it('enforces workshop attendance threshold (85%) as Ineligible (غير مستوفٍ لنسبة الحضور)', () => {
    const result = evaluateCbeUnitState({
      studentId: 'std_1',
      unitId: 'unit_1',
      outcomesCount: 3,
      outcomesResults: defaultOutcomes,
      workshopAttendanceRate: 78, // Less than 85%
    });

    expect(result.finalStatus).toBe('ineligible_attendance');
    expect(result.isEligibleForAssessment).toBe(false);
    expect(result.statusLabel).toContain('غير مقيَّم');
  });

  it('evaluates Second Round failure and repeating year in failed units only', () => {
    const yearAdvancement = evaluateYearEndAdvancement({
      studentId: 'std_1',
      totalUnitsCount: 6,
      passedUnitsCount: 4, // 2 units failed
      failedUnitsCount: 2,
      yearsEnrolledInCurrentGrade: 1,
      totalAbsenceRate: 10,
    });

    expect(yearAdvancement.canAdvance).toBe(false);
    expect(yearAdvancement.repeatsYearFailedUnitsOnly).toBe(true);
    expect(yearAdvancement.transfersToExternalLaborSystem).toBe(false);
  });

  it('transfers student to external labor system after failing in 2 consecutive years', () => {
    const yearAdvancement = evaluateYearEndAdvancement({
      studentId: 'std_1',
      totalUnitsCount: 6,
      passedUnitsCount: 3,
      failedUnitsCount: 3,
      yearsEnrolledInCurrentGrade: 2, // 2 years already
      totalAbsenceRate: 15,
    });

    expect(yearAdvancement.canAdvance).toBe(false);
    expect(yearAdvancement.transfersToExternalLaborSystem).toBe(true);
    expect(yearAdvancement.decisionLabel).toContain('نظام العمال');
  });
});
