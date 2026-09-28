/**
 * محرك الإنذار المبكر الشفاف لمخاطر التعثر والتسرب الدراسي (Early Warning Engine)
 * يعتمد على خوارزمية تسجيل موزونة وشفافة وفق السلوكيات ومؤشرات الحضور الفعلية
 * دون تخمين أسباب نفسية أو أسرية آلياً
 */

import {
  Student,
  AttendanceRecord,
  SchoolClass,
  Department,
  SchoolConfig,
  WorkshopViolationRecord,
  StudentCompetencyAssessment,
  CompetencyUnit,
} from '@/types';

export interface EarlyWarningFactorScore {
  factorName: string;
  weightMax: number;
  scoreAwarded: number;
  description: string;
}

export interface StudentEarlyWarningAnalysis {
  studentId: string;
  studentName: string;
  studentCode: string;
  nationalId: string;
  className: string;
  departmentName: string;
  gradeLevel: number;
  totalScore: number; // 0 - 100
  riskLevel: 'critical' | 'high' | 'medium' | 'safe';
  riskLevelLabel: string;
  factorsBreakdown: EarlyWarningFactorScore[];
  recommendedAction: string;
  needsSpecialistReferral: boolean;
  requiresHumanApproval: boolean;
}

export interface EarlyWarningSummary {
  totalAnalyzed: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  safeCount: number;
  students: StudentEarlyWarningAnalysis[];
  generatedAt: string;
}

export const runEarlyWarningAnalysis = (params: {
  students: Student[];
  attendance: AttendanceRecord[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  violations?: WorkshopViolationRecord[];
  assessments?: StudentCompetencyAssessment[];
  units?: CompetencyUnit[];
}): EarlyWarningSummary => {
  const {
    students,
    attendance,
    classes,
    departments,
    schoolConfig,
    violations = [],
    assessments = [],
  } = params;

  const analyzedStudents: StudentEarlyWarningAnalysis[] = students.map((student) => {
    const studentClass = classes.find((c) => c.id === student.classId);
    const studentDept = departments.find((d) => d.id === student.departmentId);

    const factors: EarlyWarningFactorScore[] = [];

    // Factor 1: Consecutive & Total Absences (Max 35 pts)
    const consecAbs = student.consecutiveAbsenceDays || 0;
    const totalAbs = student.totalAbsenceDays || 0;
    let absenceScore = 0;
    let absenceDesc = 'سجل الحضور منتظم';

    if (consecAbs >= (schoolConfig.expulsionConsecutiveDays || 15) || totalAbs >= (schoolConfig.expulsionTotalDays || 30)) {
      absenceScore = 35;
      absenceDesc = `بلوغ الحد القانوني للفصل (${consecAbs} متصل / ${totalAbs} منفصل)`;
    } else if (consecAbs >= (schoolConfig.warning2ConsecutiveDays || 10) || totalAbs >= (schoolConfig.warning2TotalDays || 20)) {
      absenceScore = 25;
      absenceDesc = `تجاوز حد الإنذار الثاني (${consecAbs} متصل / ${totalAbs} منفصل)`;
    } else if (consecAbs >= (schoolConfig.warning1ConsecutiveDays || 5) || totalAbs >= (schoolConfig.warning1TotalDays || 10)) {
      absenceScore = 15;
      absenceDesc = `تجاوز حد الإنذار الأول (${consecAbs} متصل / ${totalAbs} منفصل)`;
    } else if (totalAbs > 2) {
      absenceScore = 5;
      absenceDesc = `غياب متفرق (${totalAbs} أيام)`;
    }

    factors.push({
      factorName: 'توالي وتراكم أيام الغياب',
      weightMax: 35,
      scoreAwarded: absenceScore,
      description: absenceDesc,
    });

    // Factor 2: Workshop Escape & Practical Attendance (Max 30 pts)
    const studentViolations = violations.filter((v) => v.studentId === student.id);
    const escapeCount = student.workshopEscapeCount || studentViolations.filter((v) => v.violationType === 'workshop_escape').length;
    const workshopAbsHours = student.workshopAbsenceHours || 0;
    let workshopScore = 0;
    let workshopDesc = 'حضور الورش منتظم';

    if (escapeCount >= 3 || workshopAbsHours > 30) {
      workshopScore = 30;
      workshopDesc = `تكرار الهروب من الورش (${escapeCount} مرات) وغياب ${workshopAbsHours} ساعة`;
    } else if (escapeCount >= 1 || workshopAbsHours > 15) {
      workshopScore = 18;
      workshopDesc = `تسجيل هروب من الحصة أو غياب ورش (${workshopAbsHours} ساعة)`;
    } else if (workshopAbsHours > 0) {
      workshopScore = 8;
      workshopDesc = `غياب ورش بسيط (${workshopAbsHours} ساعة)`;
    }

    factors.push({
      factorName: 'الانضباط والهروب من الورش العملية',
      weightMax: 30,
      scoreAwarded: workshopScore,
      description: workshopDesc,
    });

    // Factor 3: Competencies Assessment Failures & Remedials (Max 25 pts)
    const studentAssessments = assessments.filter((a) => a.studentId === student.id);
    const remedialCount = studentAssessments.filter(
      (a) => a.result === 'remedial_program' || a.result === 'not_competent'
    ).length;
    let cbeScore = 0;
    let cbeDesc = 'مخرجات التعلم مجتازة';

    if (remedialCount >= 3) {
      cbeScore = 25;
      cbeDesc = `تعثر في ${remedialCount} مخرجات جدارات بحاجة لبرامج علاجية`;
    } else if (remedialCount >= 1) {
      cbeScore = 12;
      cbeDesc = `تعثر في ${remedialCount} مخرج جدارة`;
    }

    factors.push({
      factorName: 'التعثر في تقييمات الجدارات',
      weightMax: 25,
      scoreAwarded: cbeScore,
      description: cbeDesc,
    });

    // Factor 4: Safety & Disciplinary Violations (Max 10 pts)
    const safetyViolations = studentViolations.filter((v) => v.violationType !== 'workshop_escape').length;
    let safetyScore = 0;
    let safetyDesc = 'ملتزم بقواعد السلامة';

    if (safetyViolations >= 2) {
      safetyScore = 10;
      safetyDesc = `تكرار مخالفات مهمات السلامة المهنية (${safetyViolations} مخالفات)`;
    } else if (safetyViolations === 1) {
      safetyScore = 5;
      safetyDesc = 'مخالفة مهمات سلامة واحدة';
    }

    factors.push({
      factorName: 'مخالفات السلامة والصحة المهنية',
      weightMax: 10,
      scoreAwarded: safetyScore,
      description: safetyDesc,
    });

    // Calculate Total Score (0 - 100)
    const totalScore = factors.reduce((sum, f) => sum + f.scoreAwarded, 0);

    let riskLevel: 'critical' | 'high' | 'medium' | 'safe' = 'safe';
    let riskLevelLabel = 'منضبط / آمن';
    let recommendedAction = 'متابعة دورية معتادة';
    let needsSpecialistReferral = false;

    if (totalScore >= 60) {
      riskLevel = 'critical';
      riskLevelLabel = 'حرج جداً (خطر فصل / تسرب)';
      recommendedAction = 'إحالة عاجلة لاعتماد الأخصائي الاجتماعي ووكيل الشئون واستدعاء ولي الأمر';
      needsSpecialistReferral = true;
    } else if (totalScore >= 40) {
      riskLevel = 'high';
      riskLevelLabel = 'مرتفع (خطر حرمان ورش أو تعثر)';
      recommendedAction = 'جلسة إرشادية وتنبيه كتابي وتدقيق ملف الإنجاز';
      needsSpecialistReferral = true;
    } else if (totalScore >= 20) {
      riskLevel = 'medium';
      riskLevelLabel = 'متوسط (بحاجة لمتابعة)';
      recommendedAction = 'تنبيه شفهي من مدرب الورشة ومتابعة الحضور';
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      nationalId: student.nationalId,
      className: studentClass?.name || 'غير محدد',
      departmentName: studentDept?.name || 'غير محدد',
      gradeLevel: student.gradeLevel,
      totalScore,
      riskLevel,
      riskLevelLabel,
      factorsBreakdown: factors,
      recommendedAction,
      needsSpecialistReferral,
      requiresHumanApproval: true, // الإحالة تحتاج اعتماداً بشرياً صريحاً
    };
  });

  return {
    totalAnalyzed: analyzedStudents.length,
    criticalCount: analyzedStudents.filter((s) => s.riskLevel === 'critical').length,
    highCount: analyzedStudents.filter((s) => s.riskLevel === 'high').length,
    mediumCount: analyzedStudents.filter((s) => s.riskLevel === 'medium').length,
    safeCount: analyzedStudents.filter((s) => s.riskLevel === 'safe').length,
    students: analyzedStudents.sort((a, b) => b.totalScore - a.totalScore),
    generatedAt: new Date().toISOString(),
  };
};

// Aliases for backwards compatibility
export const runAiRiskAnalysis = runEarlyWarningAnalysis;
