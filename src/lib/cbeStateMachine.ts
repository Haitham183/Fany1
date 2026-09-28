/**
 * آلة حالات تقييم الجدارات المهنية (Egyptian CBE State Machine)
 * متوافقة مع لائحة التقييم والتحقق لبرامج التعليم الفني المبنية على منهجية الجدارات
 * وقانون التعليم رقم 139 لسنة 1981
 */

import { CompetencyEvaluationResult, StudentCompetencyAssessment } from '@/types';

export type CbeAssessmentStage =
  | 'attempt_1'
  | 'attempt_2'
  | 'remedial_program'
  | 'second_round'
  | 'completed'
  | 'repeat_year_failed_units'
  | 'external_labor_system';

export type CbeUnitStatus =
  | 'competent'
  | 'remedial_required'
  | 'second_round_required'
  | 'ineligible_attendance'
  | 'not_competent'
  | 'pending';

export interface CbeEvaluationSummary {
  finalStatus: CbeUnitStatus;
  statusLabel: string;
  isEligibleForAssessment: boolean;
  ineligibilityReason?: string;
  canAdvanceToNextGrade: boolean;
  requiresSecondRound: boolean;
  repeatsYearFailedUnitsOnly: boolean;
  transfersToExternalLaborSystem: boolean;
  passedOutcomesCount: number;
  totalOutcomesCount: number;
  allOutcomesPassed: boolean;
  actionRequiredText: string;
}

export interface EvaluateCbeUnitInput {
  studentId: string;
  unitId: string;
  outcomesCount?: number;
  outcomesResults?: Array<{
    outcomeId: string;
    result?: CompetencyEvaluationResult;
    hasPerformanceEvidence?: boolean;
    hasProductEvidence?: boolean;
    hasKnowledgeEvidence?: boolean;
  }>;
  assessments?: StudentCompetencyAssessment[];
  isWorkshopEligible?: boolean;
  workshopAttendanceRate?: number; // 0..100
  isExcusedAbsence?: boolean;
  failedUnitsCountInYear?: number;
  consecutiveYearsFailedInGrade?: number;
  allSubjectsAbsentInTerm1?: boolean;
  hasPortfolioWork?: boolean;
}

export const evaluateCbeUnitState = (
  input: EvaluateCbeUnitInput
): CbeEvaluationSummary => {
  const {
    unitId,
    studentId,
    outcomesCount = 0,
    outcomesResults = [],
    assessments = [],
    workshopAttendanceRate = 100,
    isWorkshopEligible = workshopAttendanceRate >= 85,
    isExcusedAbsence = false,
    failedUnitsCountInYear = 0,
    consecutiveYearsFailedInGrade = 0,
    allSubjectsAbsentInTerm1 = false,
    hasPortfolioWork = false,
  } = input;

  // Build outcomes from either outcomesResults or assessments
  const effectiveOutcomes = outcomesResults.length > 0
    ? outcomesResults
    : assessments
        .filter((a) => a.unitId === unitId && a.studentId === studentId && a.outcomeId !== 'unit_overall')
        .map((a) => ({
          outcomeId: a.outcomeId,
          result: a.result,
          hasPerformanceEvidence: a.hasPerformanceEvidence,
          hasProductEvidence: a.hasProductEvidence,
          hasKnowledgeEvidence: a.hasKnowledgeEvidence,
        }));

  const totalCount = outcomesCount > 0 ? outcomesCount : effectiveOutcomes.length;

  // 1. Check Workshop Attendance Eligibility (85% Threshold)
  if (!isWorkshopEligible || workshopAttendanceRate < 85) {
    return {
      finalStatus: 'ineligible_attendance',
      statusLabel: 'غير مقيَّم (عدم استيفاء نسبة حضور الورش 85%)',
      isEligibleForAssessment: false,
      ineligibilityReason: 'تجاوز نسبة الغياب المسموحة بالتدريبات العملية بالورش (أقل من 85%)',
      canAdvanceToNextGrade: false,
      requiresSecondRound: false,
      repeatsYearFailedUnitsOnly: true,
      transfersToExternalLaborSystem: consecutiveYearsFailedInGrade >= 2,
      passedOutcomesCount: 0,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: false,
      actionRequiredText: 'حرمان من التقييم وإعادة الوحدة في العام التالي لعدم استيفاء الحضور',
    };
  }

  // 2. Total absence in Term 1 with portfolio -> marked total absence
  if (allSubjectsAbsentInTerm1 && hasPortfolioWork) {
    return {
      finalStatus: 'second_round_required',
      statusLabel: 'غياب كلي (يحول للدور الثاني)',
      isEligibleForAssessment: false,
      canAdvanceToNextGrade: false,
      requiresSecondRound: true,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: false,
      passedOutcomesCount: 0,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: false,
      actionRequiredText: 'غياب كلي عن الدور الأول - يدخل امتحان الدور الثاني',
    };
  }

  // Count passes and remedial
  const passedOutcomes = effectiveOutcomes.filter(
    (o) => o.result === 'first_attempt_pass' || o.result === 'second_attempt_pass'
  );
  const remedialOutcomes = effectiveOutcomes.filter((o) => o.result === 'remedial_program');
  const notCompOutcomes = effectiveOutcomes.filter((o) => o.result === 'not_competent');

  const allPassed = effectiveOutcomes.length > 0 && passedOutcomes.length === effectiveOutcomes.length;

  // Case A: All Passed -> Competent (جدير)
  if (allPassed) {
    return {
      finalStatus: 'competent',
      statusLabel: 'جدير',
      isEligibleForAssessment: true,
      canAdvanceToNextGrade: true,
      requiresSecondRound: false,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: false,
      passedOutcomesCount: passedOutcomes.length,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: true,
      actionRequiredText: 'اجتاز كافة مخرجات التعلم بنجاح ومستوفٍ للأدلة والبورتفوليو',
    };
  }

  // Case B: Remedial Program required (Attempt 3)
  if (remedialOutcomes.length > 0) {
    return {
      finalStatus: 'remedial_required',
      statusLabel: 'قيد البرنامج العلاجي (الفرصة 3)',
      isEligibleForAssessment: true,
      canAdvanceToNextGrade: false,
      requiresSecondRound: false,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: false,
      passedOutcomesCount: passedOutcomes.length,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: false,
      actionRequiredText: 'يتطلب الالتحاق بالبرنامج العلاجي بالورش قبل نهاية الفصل الدراسي',
    };
  }

  // Case C: Failed units evaluation (Second Round vs Repeating Year vs External Labor System)
  if (failedUnitsCountInYear > 2) {
    if (consecutiveYearsFailedInGrade >= 2) {
      return {
        finalStatus: 'not_competent',
        statusLabel: 'نظام العمال (رسوب عامين متتاليين)',
        isEligibleForAssessment: false,
        canAdvanceToNextGrade: false,
        requiresSecondRound: false,
        repeatsYearFailedUnitsOnly: false,
        transfersToExternalLaborSystem: true,
        passedOutcomesCount: passedOutcomes.length,
        totalOutcomesCount: totalCount,
        allOutcomesPassed: false,
        actionRequiredText: 'التحويل لنظام العمال من الخارج بعد استنفاذ مرات الرسوب',
      };
    }

    return {
      finalStatus: 'not_competent',
      statusLabel: 'راسب (يعيد الوحدات غير المجتازة فقط)',
      isEligibleForAssessment: false,
      canAdvanceToNextGrade: false,
      requiresSecondRound: false,
      repeatsYearFailedUnitsOnly: true,
      transfersToExternalLaborSystem: false,
      passedOutcomesCount: passedOutcomes.length,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: false,
      actionRequiredText: 'إعادة قيد لدراسة الوحدات التي لم يجتزها فقط في العام القادم',
    };
  }

  // Case D: Eligible for Second Round (1 or 2 failed units)
  if (notCompOutcomes.length > 0) {
    return {
      finalStatus: 'second_round_required',
      statusLabel: 'غير جدير (دور ثانٍ)',
      isEligibleForAssessment: true,
      canAdvanceToNextGrade: false,
      requiresSecondRound: true,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: false,
      passedOutcomesCount: passedOutcomes.length,
      totalOutcomesCount: totalCount,
      allOutcomesPassed: false,
      actionRequiredText: 'مؤهل لدخول تقييم الدور الثاني',
    };
  }

  // Default: In progress
  return {
    finalStatus: 'pending',
    statusLabel: 'قيد التقييم',
    isEligibleForAssessment: true,
    canAdvanceToNextGrade: false,
    requiresSecondRound: false,
    repeatsYearFailedUnitsOnly: false,
    transfersToExternalLaborSystem: false,
    passedOutcomesCount: passedOutcomes.length,
    totalOutcomesCount: totalCount,
    allOutcomesPassed: false,
    actionRequiredText: 'جارٍ استكمال رصد مخرجات التعلم والأدلة بالورش',
  };
};

export interface YearEndAdvancementInput {
  studentId: string;
  totalUnitsCount: number;
  passedUnitsCount: number;
  failedUnitsCount: number;
  yearsEnrolledInCurrentGrade: number;
  totalAbsenceRate: number;
  isSecondRoundFinal?: boolean;
}

export interface YearEndAdvancementResult {
  canAdvance: boolean;
  repeatsYearFailedUnitsOnly: boolean;
  transfersToExternalLaborSystem: boolean;
  decisionLabel: string;
}

export const evaluateYearEndAdvancement = (
  input: YearEndAdvancementInput
): YearEndAdvancementResult => {
  const {
    passedUnitsCount,
    failedUnitsCount,
    totalUnitsCount,
    yearsEnrolledInCurrentGrade,
    isSecondRoundFinal = true,
  } = input;

  if (failedUnitsCount === 0 && passedUnitsCount === totalUnitsCount) {
    return {
      canAdvance: true,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: false,
      decisionLabel: 'ناجح وينتقل إلى الصف الأعلى (جدير في كافة الوحدات)',
    };
  }

  if (yearsEnrolledInCurrentGrade >= 2) {
    return {
      canAdvance: false,
      repeatsYearFailedUnitsOnly: false,
      transfersToExternalLaborSystem: true,
      decisionLabel: 'مفصول لاستنفاذ مرات الرسوب ويحق له التقدم من الخارج على نظام العمال',
    };
  }

  if (failedUnitsCount > 2 || isSecondRoundFinal) {
    return {
      canAdvance: false,
      repeatsYearFailedUnitsOnly: true,
      transfersToExternalLaborSystem: false,
      decisionLabel: 'باقٍ للإعادة ويعيد دراسة وتقييم الوحدات التي لم يجتزها فقط',
    };
  }

  return {
    canAdvance: false,
    repeatsYearFailedUnitsOnly: false,
    transfersToExternalLaborSystem: false,
    decisionLabel: 'له دور ثانٍ في الوحدات التي لم يجتزها',
  };
};
