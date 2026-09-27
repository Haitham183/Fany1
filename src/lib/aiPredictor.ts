'use client';

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

export type RiskLevel = 'critical' | 'high' | 'medium' | 'safe';

export interface StudentRiskAnalysis {
  studentId: string;
  studentName: string;
  nationalId: string;
  studentCode: string;
  className: string;
  departmentName: string;
  departmentId: string;
  gradeLevel: number;
  guardianName: string;
  guardianPhone: string;
  
  // Risk Scores (0 to 100%)
  dropoutRiskScore: number;       // احتمالية التسرب أو الفصل (0-100%)
  failureRiskScore: number;       // احتمالية الرسوب أو عدم اجتياز الجدارات (0-100%)
  overallRiskScore: number;       // النسبة المركبة الإجمالية
  riskLevel: RiskLevel;           // المستوى: حرج، مرتفع، متوسط، آمن

  // Factors Breakdown
  factors: {
    totalAbsenceFactor: number;        // عامل إجمالي أيام الغياب
    consecutiveAbsenceFactor: number;  // عامل الغياب المتصل
    workshopAttendanceFactor: number;  // عامل نسبة حضور الورش (الحد الأدنى 85%)
    workshopAbsenceHours: number;      // ساعات غياب الورش
    competencyRemedialFactor: number;  // عامل المخرجات العلاجية
    violationsFactor: number;          // عامل مخالفات السلامة والهروب
    recentAbsenceTrend: 'accelerating' | 'steady' | 'improving'; // وتيرة الغياب الأخيرة
  };

  // Specific Identified Root Causes (الأسباب المباشرة)
  riskReasons: string[];

  // Actionable AI Interventions (التوصيات والتدخلات العاجلة)
  aiRecommendations: {
    id: string;
    title: string;
    description: string;
    urgency: 'immediate' | 'high' | 'medium' | 'routine';
    actionType: 'notice' | 'guardian_call' | 'social_specialist' | 'remedial_workshop' | 'safety_counseling';
    actionLabel: string;
  }[];
}

export interface SchoolAiPredictionsSummary {
  totalStudentsAnalyzed: number;
  safeCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  
  // Forecasted Counts
  projectedDropoutsCount: number;       // المتوقع تعرضهم للفصل ما لم يتم التدخل
  projectedCompetencyFailuresCount: number; // المتوقع حرمانهم من تقييم الجدارات
  topAtRiskDepartments: {
    departmentId: string;
    departmentName: string;
    atRiskStudentsCount: number;
    riskRate: number;
  }[];
  topAtRiskClasses: {
    classId: string;
    className: string;
    atRiskStudentsCount: number;
    riskRate: number;
  }[];

  commonRootCauses: {
    cause: string;
    count: number;
    percentage: number;
  }[];

  studentAnalyses: StudentRiskAnalysis[];
}

/**
 * AI Multi-Factor Risk Assessment Engine for TVET Egyptian Schools
 */
export const runAiRiskAnalysis = (params: {
  students: Student[];
  attendance: AttendanceRecord[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  violations?: WorkshopViolationRecord[];
  assessments?: StudentCompetencyAssessment[];
  units?: CompetencyUnit[];
}): SchoolAiPredictionsSummary => {
  const {
    students,
    attendance,
    classes,
    departments,
    schoolConfig,
    violations = [],
    assessments = [],
    units = [],
  } = params;

  const pracMinRate = schoolConfig.practicalMinAttendanceRate || 85;
  const theoMinRate = schoolConfig.theoreticalMinAttendanceRate || 75;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const studentAnalyses: StudentRiskAnalysis[] = students.map((student) => {
    const studentClass = classes.find((c) => c.id === student.classId);
    const studentDept = departments.find((d) => d.id === student.departmentId);

    // 1. Attendance & Trajectory Metrics
    const studentAttendance = attendance.filter((a) => a.studentId === student.id);
    const recent14DaysAttendance = studentAttendance.filter((a) => a.date >= fourteenDaysAgo);
    const recentAbsences = recent14DaysAttendance.filter((a) => a.status === 'absent' || a.status === 'escaped').length;
    const totalDaysRecorded = studentAttendance.length || 1;
    const totalPresents = studentAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;

    // Actual Workshop Attendance Rate %
    const workshopRecords = studentAttendance.filter((a) => a.periodType === 'workshop');
    const workshopPresents = workshopRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
    const workshopTotal = workshopRecords.length;
    const workshopRate = workshopTotal > 0 ? Math.round((workshopPresents / workshopTotal) * 100) : 100;

    // 2. Behavioral & Safety Escape Violations
    const studentViolations = violations.filter((v) => v.studentId === student.id);
    const escapeCount = student.workshopEscapeCount || studentViolations.filter((v) => v.violationType === 'workshop_escape').length;

    // 3. Competencies Remedial & Assessment Velocity
    const studentAssessments = assessments.filter((a) => a.studentId === student.id);
    const remedialCount = studentAssessments.filter((a) => a.result === 'remedial_program' || a.result === 'not_competent').length;
    const pendingCount = studentAssessments.filter((a) => a.result === 'pending').length;

    // =========================================================================
    // MULTI-FACTOR WEIGHTED RISK CALCULATION
    // =========================================================================
    let dropoutScore = 0;
    let failureScore = 0;
    const riskReasons: string[] = [];

    // Factor A: Total & Consecutive Absence (Max 40 pts on Dropout)
    const consecAbs = student.consecutiveAbsenceDays || 0;
    const totalAbs = student.totalAbsenceDays || 0;

    if (consecAbs >= 12 || totalAbs >= 25) {
      dropoutScore += 40;
      riskReasons.push(`اقتراب حرج جداً من حد الفصل القانوني (${consecAbs} يوم متصل / ${totalAbs} منفصل)`);
    } else if (consecAbs >= 8 || totalAbs >= 18) {
      dropoutScore += 28;
      riskReasons.push(`تجاوز حد الإنذار الثاني (${consecAbs} متصل / ${totalAbs} منفصل)`);
    } else if (consecAbs >= 4 || totalAbs >= 8) {
      dropoutScore += 15;
      riskReasons.push(`مستحق للإنذار الأول (${consecAbs} متصل / ${totalAbs} منفصل)`);
    }

    // Factor B: Workshop Practical Attendance Rate vs 85% Mandate (Max 35 pts Failure, 20 pts Dropout)
    const workshopAbsHours = student.workshopAbsenceHours || 0;
    if (workshopRate < pracMinRate - 10 || workshopAbsHours > 30) {
      failureScore += 40;
      dropoutScore += 20;
      riskReasons.push(`نسبة حضور الورش (${workshopRate}%) أقل بكثير من الحد القانوني الإلزامي (${pracMinRate}%)`);
    } else if (workshopRate < pracMinRate || workshopAbsHours > 18) {
      failureScore += 25;
      dropoutScore += 10;
      riskReasons.push(`نسبة حضور الورش (${workshopRate}%) دون حد التأهيل لجدارات التخصص (${pracMinRate}%)`);
    } else if (workshopRate < pracMinRate + 4) {
      failureScore += 12;
      riskReasons.push(`نسبة حضور الورش (${workshopRate}%) قريبة من حافة الخطر`);
    }

    // Factor C: Workshop Escape & Safety Violations (Max 25 pts Dropout)
    if (escapeCount >= 3) {
      dropoutScore += 25;
      failureScore += 15;
      riskReasons.push(`تكرار الهروب والتزويغ من الورشة (${escapeCount} مرات مسجلة)`);
    } else if (escapeCount >= 1) {
      dropoutScore += 12;
      failureScore += 8;
      riskReasons.push(`تسجيل واقعة هروب وتزويغ من ورشة التدريب`);
    }

    if (studentViolations.length >= 3) {
      dropoutScore += 10;
      riskReasons.push(`تعدد مخالفات قواعد السلامة ومهمات الوقاية (${studentViolations.length} مخالفات)`);
    }

    // Factor D: Competency Remedial & Non-Competent Outcomes (Max 35 pts Failure)
    if (remedialCount >= 3) {
      failureScore += 35;
      riskReasons.push(`تعثر في ${remedialCount} مخرجات تعلم تحتاج برامج علاجية عاجلة`);
    } else if (remedialCount >= 1) {
      failureScore += 18;
      riskReasons.push(`تسجيل ${remedialCount} مخرج تعلم ببرنامج علاجي`);
    }

    // Factor E: Recent Absence Acceleration Trend
    let recentTrend: 'accelerating' | 'steady' | 'improving' = 'steady';
    if (recentAbsences >= 4) {
      recentTrend = 'accelerating';
      dropoutScore += 10;
      failureScore += 10;
      riskReasons.push(`تسارع ملحوظ في الغياب خلال آخر أسبوعين (${recentAbsences} أيام)`);
    } else if (recentAbsences === 0 && totalAbs > 3) {
      recentTrend = 'improving';
      dropoutScore = Math.max(0, dropoutScore - 8);
      failureScore = Math.max(0, failureScore - 8);
    }

    // Normalize Scores (0 to 100)
    const finalDropoutScore = Math.min(100, Math.round(dropoutScore));
    const finalFailureScore = Math.min(100, Math.round(failureScore));
    const overallScore = Math.round(finalDropoutScore * 0.55 + finalFailureScore * 0.45);

    // Determine Risk Category
    let riskLevel: RiskLevel = 'safe';
    if (overallScore >= 65 || finalDropoutScore >= 70 || finalFailureScore >= 75) {
      riskLevel = 'critical';
    } else if (overallScore >= 45 || finalDropoutScore >= 50 || finalFailureScore >= 50) {
      riskLevel = 'high';
    } else if (overallScore >= 25 || finalDropoutScore >= 30 || finalFailureScore >= 30) {
      riskLevel = 'medium';
    }

    // Generate Tailored AI Recommendations
    const aiRecommendations: StudentRiskAnalysis['aiRecommendations'] = [];

    if (finalDropoutScore >= 65 || consecAbs >= 10 || totalAbs >= 20) {
      aiRecommendations.push({
        id: 'rec_notice_urgent',
        title: 'إصدار وتوثيق إنذار رسمي فوري بالبريد المسجل',
        description: `توجيه إنذار رسمي مسجل بعلم الوصول لولي الأمر برقم صادر رسمي لتفادي الفصل المفاجئ.`,
        urgency: 'immediate',
        actionType: 'notice',
        actionLabel: 'إصدار إنذار غياب',
      });
    }

    if (escapeCount > 0 || studentViolations.length > 0 || recentTrend === 'accelerating') {
      aiRecommendations.push({
        id: 'rec_social_specialist',
        title: 'إحالة عاجلة للأخصائي الاجتماعي والتربوي',
        description: `جلسة إرشاد نفسي وسلوكي للوقوف على أسباب الغياب المتكرر والهروب من الورشة.`,
        urgency: 'high',
        actionType: 'social_specialist',
        actionLabel: 'إحالة للأخصائي الاجتماعي',
      });
    }

    if (finalFailureScore >= 40 || remedialCount > 0 || workshopRate < pracMinRate) {
      aiRecommendations.push({
        id: 'rec_remedial_workshop',
        title: `إلحاق الطالب ببرنامج علاجي عملي بورشة ${studentDept?.name || 'التخصص'}`,
        description: `تعويض ساعات الورش المفقودة وتدريب الطالب عملياً على مخرجات التعلم قبل لجان التحقق الخارجي.`,
        urgency: 'high',
        actionType: 'remedial_workshop',
        actionLabel: 'جدولة برنامج علاجي بالورشة',
      });
    }

    if (finalDropoutScore >= 35 || finalFailureScore >= 35) {
      aiRecommendations.push({
        id: 'rec_guardian_call',
        title: 'استدعاء ولي الأمر وتوقيع إقرار متابعة',
        description: `التواصل المباشر مع ولي الأمر (${student.guardianPhone || 'الهاتف غير مسجل'}) لإحاطته بالموقف.`,
        urgency: 'medium',
        actionType: 'guardian_call',
        actionLabel: 'استدعاء ولي الأمر',
      });
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      nationalId: student.nationalId,
      studentCode: student.studentCode,
      className: studentClass?.name || 'غير محدد',
      departmentName: studentDept?.name || 'عام',
      departmentId: student.departmentId,
      gradeLevel: student.gradeLevel,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      dropoutRiskScore: finalDropoutScore,
      failureRiskScore: finalFailureScore,
      overallRiskScore: overallScore,
      riskLevel,
      factors: {
        totalAbsenceFactor: totalAbs,
        consecutiveAbsenceFactor: consecAbs,
        workshopAttendanceFactor: workshopRate,
        workshopAbsenceHours: workshopAbsHours,
        competencyRemedialFactor: remedialCount,
        violationsFactor: studentViolations.length + escapeCount,
        recentAbsenceTrend: recentTrend,
      },
      riskReasons: riskReasons.length > 0 ? riskReasons : ['سجل الحضور والتقييم منتظم ومستوفٍ للمعايير'],
      aiRecommendations,
    };
  });

  // Calculate Aggregates
  const totalStudentsAnalyzed = studentAnalyses.length;
  const criticalRiskCount = studentAnalyses.filter((a) => a.riskLevel === 'critical').length;
  const highRiskCount = studentAnalyses.filter((a) => a.riskLevel === 'high').length;
  const mediumRiskCount = studentAnalyses.filter((a) => a.riskLevel === 'medium').length;
  const safeCount = studentAnalyses.filter((a) => a.riskLevel === 'safe').length;

  const projectedDropoutsCount = studentAnalyses.filter((a) => a.dropoutRiskScore >= 60).length;
  const projectedCompetencyFailuresCount = studentAnalyses.filter((a) => a.failureRiskScore >= 60).length;

  // Department Risk Rankings
  const topAtRiskDepartments = departments.map((dept) => {
    const deptAnalyses = studentAnalyses.filter((a) => a.departmentId === dept.id);
    const atRisk = deptAnalyses.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high').length;
    const rate = deptAnalyses.length > 0 ? Math.round((atRisk / deptAnalyses.length) * 100) : 0;
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      atRiskStudentsCount: atRisk,
      riskRate: rate,
    };
  }).sort((a, b) => b.riskRate - a.riskRate);

  // Class Risk Rankings
  const topAtRiskClasses = classes.map((c) => {
    const classAnalyses = studentAnalyses.filter((a) => a.className === c.name);
    const atRisk = classAnalyses.filter((a) => a.riskLevel === 'critical' || a.riskLevel === 'high').length;
    const rate = classAnalyses.length > 0 ? Math.round((atRisk / classAnalyses.length) * 100) : 0;
    return {
      classId: c.id,
      className: c.name,
      atRiskStudentsCount: atRisk,
      riskRate: rate,
    };
  }).sort((a, b) => b.riskRate - a.riskRate);

  // Common Root Causes Tally
  const causeCounts: Record<string, number> = {};
  studentAnalyses.forEach((a) => {
    if (a.riskLevel !== 'safe') {
      a.riskReasons.forEach((r) => {
        causeCounts[r] = (causeCounts[r] || 0) + 1;
      });
    }
  });

  const commonRootCauses = Object.entries(causeCounts)
    .map(([cause, count]) => ({
      cause,
      count,
      percentage: totalStudentsAnalyzed > 0 ? Math.round((count / totalStudentsAnalyzed) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    totalStudentsAnalyzed,
    safeCount,
    mediumRiskCount,
    highRiskCount,
    criticalRiskCount,
    projectedDropoutsCount,
    projectedCompetencyFailuresCount,
    topAtRiskDepartments,
    topAtRiskClasses,
    commonRootCauses,
    studentAnalyses,
  };
};
