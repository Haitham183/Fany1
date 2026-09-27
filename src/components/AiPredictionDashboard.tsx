'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  WorkshopViolationRecord,
  StudentCompetencyAssessment,
  CompetencyUnit,
} from '@/types';
import {
  runAiRiskAnalysis,
  StudentRiskAnalysis,
  RiskLevel,
  SchoolAiPredictionsSummary,
} from '@/lib/aiPredictor';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Filter,
  Search,
  Download,
  Printer,
  ChevronRight,
  ChevronDown,
  UserCheck,
  PhoneCall,
  Mail,
  Wrench,
  GraduationCap,
  Info,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  Zap,
  Users,
  HeartHandshake,
} from 'lucide-react';
import {
  referStudentToSocialSpecialist,
  getSocialCases,
} from '@/lib/storage';

interface AiPredictionDashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig | null;
  currentUser: User;
  onNavigateToNotices?: (studentId?: string) => void;
  onNavigateToStudentReport?: (studentId: string) => void;
  onNavigateToSocialPortal?: (studentId?: string) => void;
}

export const AiPredictionDashboard: React.FC<AiPredictionDashboardProps> = ({
  students,
  attendance,
  classes,
  departments,
  schoolConfig,
  currentUser,
  onNavigateToNotices,
  onNavigateToStudentReport,
  onNavigateToSocialPortal,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<StudentRiskAnalysis | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [activeTabSubView, setActiveTabSubView] = useState<'matrix' | 'departments' | 'causes'>('matrix');

  const config: SchoolConfig = schoolConfig || {
    name: 'المدرسة الثانوية الصناعية الفنية',
    directorate: 'مديرية التربية والتعليم',
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
    studentAffairsHead: '',
    practicalMinAttendanceRate: 85,
    theoreticalMinAttendanceRate: 75,
  };

  // Run AI Analysis Engine
  const aiSummary: SchoolAiPredictionsSummary = useMemo(() => {
    return runAiRiskAnalysis({
      students,
      attendance,
      classes,
      departments,
      schoolConfig: config,
    });
  }, [students, attendance, classes, departments, config]);

  // Filtered Students List
  const filteredStudentAnalyses = useMemo(() => {
    return aiSummary.studentAnalyses.filter((analysis) => {
      // Department Filter
      if (selectedDept !== 'all' && analysis.departmentId !== selectedDept) {
        return false;
      }
      // Class Filter
      if (selectedClass !== 'all') {
        const cls = classes.find((c) => c.id === selectedClass);
        if (cls && analysis.className !== cls.name) return false;
      }
      // Grade Filter
      if (selectedGrade !== 'all' && analysis.gradeLevel.toString() !== selectedGrade) {
        return false;
      }
      // Risk Level Filter
      if (selectedRiskLevel !== 'all' && analysis.riskLevel !== selectedRiskLevel) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          analysis.studentName.toLowerCase().includes(q) ||
          analysis.studentCode.toLowerCase().includes(q) ||
          analysis.nationalId.includes(q) ||
          analysis.className.toLowerCase().includes(q) ||
          analysis.departmentName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [aiSummary, selectedDept, selectedClass, selectedGrade, selectedRiskLevel, searchQuery, classes]);

  const socialCases = useMemo(() => {
    return getSocialCases();
  }, [students]);

  const activeSocialCaseStudentIds = useMemo(() => {
    return new Set(
      socialCases
        .filter((c) => c.status === 'pending' || c.status === 'in_progress')
        .map((c) => c.studentId)
    );
  }, [socialCases]);

  const criticalAndHighRiskCount = useMemo(() => {
    return aiSummary.studentAnalyses.filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'high').length;
  }, [aiSummary]);

  const handleTriggerIntervention = (
    student: StudentRiskAnalysis,
    actionType: string,
    actionTitle: string
  ) => {
    if (actionType === 'notice') {
      if (onNavigateToNotices) {
        onNavigateToNotices(student.studentId);
      } else {
        setActionSuccessMessage(`تم فتح نموذج إصدار إنذار غياب رسمي للطالب: ${student.studentName}`);
      }
    } else if (actionType === 'guardian_call') {
      setActionSuccessMessage(
        `تم تسجيل مهمة التواصل مع ولي أمر الطالب ${student.studentName} (${student.guardianPhone || 'لا يوجد هاتف'})`
      );
    } else if (actionType === 'social_specialist') {
      const targetStudent = students.find((s) => s.id === student.studentId);
      if (targetStudent) {
        const targetClass = classes.find((c) => c.id === targetStudent.classId);
        const targetDept = departments.find((d) => d.id === targetStudent.departmentId);
        referStudentToSocialSpecialist({
          student: targetStudent,
          studentClass: targetClass,
          department: targetDept,
          reason: student.riskReasons.join(' • '),
          priority: student.riskLevel === 'critical' ? 'urgent' : 'high',
          category: student.factors.violationsFactor > 0 ? 'workshop_escape_behavior' : 'absence_dropout_risk',
          aiRiskScore: student.overallRiskScore,
          aiRiskLevel: student.riskLevel,
          aiRootCauses: student.riskReasons,
          aiRecommendations: student.aiRecommendations.map((r) => r.title),
          source: 'ai_prediction',
        });
      }
      setActionSuccessMessage(
        `تمت إحالة الطالب ${student.studentName} وفتح ملف دراسة حالة رسمي لدى الأخصائي الاجتماعي 🟢`
      );
    } else if (actionType === 'remedial_workshop') {
      setActionSuccessMessage(
        `تم إدراج الطالب ${student.studentName} في قائمة البرنامج العلاجي لورشة ${student.departmentName}`
      );
    }

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 5000);
  };

  const handleBatchReferralToSocialWorker = () => {
    const highRiskStudents = aiSummary.studentAnalyses.filter(
      (s) => s.riskLevel === 'critical' || s.riskLevel === 'high'
    );

    if (highRiskStudents.length === 0) {
      alert('لا توجد حالات ذات خطورة حرجة أو مرتفعة حالياً.');
      return;
    }

    if (
      !window.confirm(
        `تأكيد إحالة جميع الحالات ذات الخطورة الحرجة والمرتفعة (${highRiskStudents.length} طالب) إلى الأخصائي الاجتماعي وفتح ملفات متابعة؟`
      )
    ) {
      return;
    }

    let count = 0;
    highRiskStudents.forEach((studentAnalysis) => {
      const targetStudent = students.find((s) => s.id === studentAnalysis.studentId);
      if (!targetStudent) return;
      const targetClass = classes.find((c) => c.id === targetStudent.classId);
      const targetDept = departments.find((d) => d.id === targetStudent.departmentId);

      referStudentToSocialSpecialist({
        student: targetStudent,
        studentClass: targetClass,
        department: targetDept,
        reason: studentAnalysis.riskReasons.join(' • '),
        priority: studentAnalysis.riskLevel === 'critical' ? 'urgent' : 'high',
        category: studentAnalysis.factors.violationsFactor > 0 ? 'workshop_escape_behavior' : 'absence_dropout_risk',
        aiRiskScore: studentAnalysis.overallRiskScore,
        aiRiskLevel: studentAnalysis.riskLevel,
        aiRootCauses: studentAnalysis.riskReasons,
        aiRecommendations: studentAnalysis.aiRecommendations.map((r) => r.title),
        source: 'ai_prediction',
      });
      count++;
    });

    setActionSuccessMessage(`تمت إحالة ${count} طالب إلى بوابة الأخصائي الاجتماعي بنجاح`);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 5000);
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return {
          label: 'حرج جداً (فصل / حرمان وشيك)',
          badgeClass: 'bg-red-600 text-white border-red-700 animate-pulse',
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200',
        };
      case 'high':
        return {
          label: 'مرتفع (إنذار ثانٍ / خطر ورش)',
          badgeClass: 'bg-orange-500 text-white border-orange-600',
          color: 'text-orange-600',
          bg: 'bg-orange-50 border-orange-200',
        };
      case 'medium':
        return {
          label: 'متوسط (إنذار أول / مراقبة)',
          badgeClass: 'bg-amber-500 text-white border-amber-600',
          color: 'text-amber-600',
          bg: 'bg-amber-50 border-amber-200',
        };
      case 'safe':
        return {
          label: 'آمن ومستقر',
          badgeClass: 'bg-emerald-600 text-white border-emerald-700',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50 border-emerald-200',
        };
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-800/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
              <BrainCircuit className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              منظومة الذكاء الاصطناعي للتنبؤ المبكر بالتسرب والرسوب المهني
            </h1>
            <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-1 rounded-full border border-cyan-400/30 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              AI TVET Early Warning v2.5
            </span>
          </div>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            محرك خوارزمي تنبؤي ذكي يحلل وتيرة الغياب، وساعات غياب الورش العملية (حد الـ 85%)، وتكرار الهروب ومخالفات السلامة، ومخرجات تقييم الجدارات لاكتشاف الطلاب المعرضين للتسرب أو الحرمان من التقييم قبل وقوعه بـ 15 يوماً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto no-print">
          <button
            onClick={handleBatchReferralToSocialWorker}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
            title="إحالة جميع الطلاب ذوي الخطورة الحرجة والمرتفعة إلى الأخصائي الاجتماعي"
          >
            <HeartHandshake className="w-4 h-4 text-teal-200" />
            <span>إحالة الحالات الحرجة للأخصائي ({criticalAndHighRiskCount})</span>
          </button>

          {onNavigateToSocialPortal && (
            <button
              onClick={() => onNavigateToSocialPortal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl border border-teal-600/50 transition cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              <span>بوابة الأخصائي الاجتماعي</span>
            </button>
          )}

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>طباعة تقرير المخاطر</span>
          </button>
        </div>
      </div>

      {/* Top Executive Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Analyzed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>إجمالي المفحوصين</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{aiSummary.totalStudentsAnalyzed}</div>
          <div className="text-[11px] text-slate-500 mt-1">طالب مسجل بالمنظومة</div>
        </div>

        {/* Critical Risk */}
        <div className="bg-red-50/80 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-700 text-xs font-bold mb-1">
            <span>مستوى حرج جداً</span>
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-700">{aiSummary.criticalRiskCount}</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">تدخل طارئ خلال 24 ساعة</div>
        </div>

        {/* High Risk */}
        <div className="bg-orange-50/80 p-4 rounded-xl border border-orange-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-700 text-xs font-bold mb-1">
            <span>مستوى خطر مرتفع</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700">{aiSummary.highRiskCount}</div>
          <div className="text-[11px] text-orange-600 font-semibold mt-1">تجاوز الإنذار الثاني / الورش</div>
        </div>

        {/* Medium Risk */}
        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
            <span>مستوى خطر متوسط</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{aiSummary.mediumRiskCount}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">مرحلة الإنذار الأول والمتابعة</div>
        </div>

        {/* Projected Dropouts */}
        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold mb-1">
            <span>توقع الفصل والتسرب</span>
            <TrendingDown className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{aiSummary.projectedDropoutsCount}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">توقع تجاوز 15 متصل / 30 منفصل</div>
        </div>

        {/* Projected Competency Failures */}
        <div className="bg-cyan-50/80 p-4 rounded-xl border border-cyan-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-800 text-xs font-bold mb-1">
            <span>توقع حرمان الجدارات</span>
            <Wrench className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-800">{aiSummary.projectedCompetencyFailuresCount}</div>
          <div className="text-[11px] text-cyan-700 font-semibold mt-1">دون نسبة 85% للورش العملية</div>
        </div>
      </div>

      {/* Subviews Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 no-print">
        <button
          onClick={() => setActiveTabSubView('matrix')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTabSubView === 'matrix'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>مصفوفة الطلاب والتدخلات العاجلة</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {filteredStudentAnalyses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubView('departments')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTabSubView === 'departments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>رادار مخاطر الأقسام والورش</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-extrabold">
            {aiSummary.topAtRiskDepartments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSubView('causes')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
            activeTabSubView === 'causes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>الأسباب الجذرية الأكثر شيوعاً</span>
        </button>
      </div>

      {/* VIEW 1: MATRIX & STUDENT INTERVENTIONS */}
      {activeTabSubView === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 no-print">
            {/* Search */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">بحث بالطالب أو الكود</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="الاسم / الرقم القومي / الكود..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-3 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">القسم الصناعي</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع الأقسام والتخصصات</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الفصل الدراسي</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع الفصول</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">الصف الدراسي</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع الصفوف (1-2-3)</option>
                <option value="1">الصف الأول</option>
                <option value="2">الصف الثاني</option>
                <option value="3">الصف الثالث</option>
              </select>
            </div>

            {/* Risk Level */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">مستوى الخطورة</label>
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع المستويات</option>
                <option value="critical">🔴 حرج جداً (فصل / حرمان وشيك)</option>
                <option value="high">🟠 مرتفع (إنذار ثانٍ / تدني ورش)</option>
                <option value="medium">🟡 متوسط (إنذار أول / مراقبة)</option>
                <option value="safe">🟢 آمن ومستقر</option>
              </select>
            </div>
          </div>

          {/* Students Risk Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">بيانات الطالب</th>
                    <th className="py-3 px-3">الفصل والتخصص</th>
                    <th className="py-3 px-3 text-center">مؤشر خطر التسرب</th>
                    <th className="py-3 px-3 text-center">مؤشر حرمان الورش (85%)</th>
                    <th className="py-3 px-3 text-center">المستوى الإجمالي</th>
                    <th className="py-3 px-3">الأسباب التشخيصية المباشرة</th>
                    <th className="py-3 px-3 text-center no-print">التدخلات المقترحة والتحليل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudentAnalyses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="font-bold text-slate-600">لا يوجد طلاب مطابقين لمعايير الفلترة المحددة</p>
                        <p className="text-xs text-slate-400 mt-1">جميع المؤشرات في هذا النطاق طبيعية ومستقرة</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudentAnalyses.map((student, idx) => {
                      const badgeInfo = getRiskBadge(student.riskLevel);
                      return (
                        <tr
                          key={student.studentId}
                          className={`hover:bg-slate-50/80 transition ${
                            student.riskLevel === 'critical'
                              ? 'bg-red-50/20'
                              : student.riskLevel === 'high'
                              ? 'bg-orange-50/20'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm">{student.studentName}</span>
                              {activeSocialCaseStudentIds.has(student.studentId) && (
                                <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold border border-teal-300 flex items-center gap-0.5">
                                  <HeartHandshake className="w-2.5 h-2.5" />
                                  <span>مُحال للأخصائي</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                              <span>كود: {student.studentCode}</span>
                              <span>•</span>
                              <span>القومي: {student.nationalId}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                              {student.className}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">{student.departmentName}</div>
                          </td>
                          {/* Dropout Risk Meter */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs font-black ${
                                  student.dropoutRiskScore >= 60
                                    ? 'text-red-600'
                                    : student.dropoutRiskScore >= 35
                                    ? 'text-orange-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {student.dropoutRiskScore}%
                              </span>
                              <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    student.dropoutRiskScore >= 60
                                      ? 'bg-red-600'
                                      : student.dropoutRiskScore >= 35
                                      ? 'bg-orange-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${student.dropoutRiskScore}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {student.factors.consecutiveAbsenceFactor} متصل / {student.factors.totalAbsenceFactor} منفصل
                              </span>
                            </div>
                          </td>
                          {/* Failure / Workshop Risk Meter */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs font-black ${
                                  student.failureRiskScore >= 60
                                    ? 'text-red-600'
                                    : student.failureRiskScore >= 35
                                    ? 'text-orange-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {student.failureRiskScore}%
                              </span>
                              <div className="w-16 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    student.failureRiskScore >= 60
                                      ? 'bg-red-600'
                                      : student.failureRiskScore >= 35
                                      ? 'bg-orange-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${student.failureRiskScore}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                ورش: {student.factors.workshopAttendanceFactor}%
                              </span>
                            </div>
                          </td>
                          {/* Overall Badge */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeInfo.badgeClass}`}
                            >
                              {badgeInfo.label}
                            </span>
                          </td>
                          {/* Root Causes */}
                          <td className="py-3 px-3 max-w-xs">
                            <ul className="space-y-1">
                              {student.riskReasons.slice(0, 2).map((r, i) => (
                                <li
                                  key={i}
                                  className="text-[11px] text-slate-700 flex items-start gap-1 leading-tight"
                                >
                                  <span className="text-red-500 font-bold">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                              {student.riskReasons.length > 2 && (
                                <li className="text-[10px] text-indigo-600 font-semibold">
                                  + {student.riskReasons.length - 2} أسباب إضافية
                                </li>
                              )}
                            </ul>
                          </td>
                          {/* Interventions & Actions */}
                          <td className="py-3 px-3 text-center no-print">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedStudentForDossier(student)}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition flex items-center gap-1"
                                title="عرض الملف والتحليل الذكي الشامل"
                              >
                                <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                                <span>التقرير الذكي</span>
                              </button>

                              {student.aiRecommendations.length > 0 && (
                                <button
                                  onClick={() => {
                                    const topAction = student.aiRecommendations[0];
                                    handleTriggerIntervention(
                                      student,
                                      topAction.actionType,
                                      topAction.title
                                    );
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                    student.riskLevel === 'critical'
                                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                                  }`}
                                  title={student.aiRecommendations[0]?.title}
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{student.aiRecommendations[0]?.actionLabel}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT WORKSHOPS RISK RADAR */}
      {activeTabSubView === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiSummary.topAtRiskDepartments.map((dept) => {
            const deptObj = departments.find((d) => d.id === dept.departmentId);
            const totalInDept = aiSummary.studentAnalyses.filter((s) => s.departmentId === dept.departmentId).length;
            const criticalInDept = aiSummary.studentAnalyses.filter(
              (s) => s.departmentId === dept.departmentId && s.riskLevel === 'critical'
            ).length;

            return (
              <div
                key={dept.departmentId}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Wrench className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{dept.departmentName}</h3>
                        <span className="text-[11px] text-slate-500 font-mono">
                          كود التخصص: {deptObj?.code || 'DEP'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                        dept.riskRate >= 40
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : dept.riskRate >= 20
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      معدل الخطورة {dept.riskRate}%
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>الطلاب تحت الخطر (حرج + مرتفع):</span>
                      <span className="font-bold text-red-600">
                        {dept.atRiskStudentsCount} من إجمالي {totalInDept}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          dept.riskRate >= 40
                            ? 'bg-red-500'
                            : dept.riskRate >= 20
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, dept.riskRate)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span>الحالات الحرجة جداً:</span>
                      <span className="font-black text-red-700">{criticalInDept} طلاب</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end no-print">
                  <button
                    onClick={() => {
                      setSelectedDept(dept.departmentId);
                      setActiveTabSubView('matrix');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <span>عرض طلاب التخصص</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: COMMON ROOT CAUSES */}
      {activeTabSubView === 'causes' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-600" />
              <span>تحليل الأسباب الجذرية الأكثر تأثيراً في مخاطر التسرب والرسوب</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              إحصائية ذكية لأكثر العوامل تكراراً لدى الطلاب ذوي الخطورة (الحرجة، المرتفعة، والمتوسطة).
            </p>
          </div>

          <div className="space-y-4">
            {aiSummary.commonRootCauses.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap justify-between items-center text-xs gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{item.cause}</span>
                  </span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                    {item.count} حالة ({item.percentage}% من الطلاب)
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED STUDENT AI DIAGNOSTIC DOSSIER MODAL */}
      {selectedStudentForDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                  <BrainCircuit className="w-7 h-7 text-cyan-400" />
                </span>
                <div>
                  <h3 className="text-lg font-black">{selectedStudentForDossier.studentName}</h3>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1 font-mono">
                    <span>كود: {selectedStudentForDossier.studentCode}</span>
                    <span>•</span>
                    <span>{selectedStudentForDossier.className}</span>
                    <span>•</span>
                    <span>قسم: {selectedStudentForDossier.departmentName}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDossier(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Risk Scores Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-bold mb-1">احتمالية التسرب والفصل</div>
                  <div className="text-2xl font-black text-purple-700">
                    {selectedStudentForDossier.dropoutRiskScore}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">مبني على الغياب المتصل والمنفصل</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-bold mb-1">احتمالية حرمان الجدارات</div>
                  <div className="text-2xl font-black text-cyan-700">
                    {selectedStudentForDossier.failureRiskScore}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">مبني على حضور الورش والمخرجات</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-bold mb-1">المستوى التراكمي الشامل</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-1 ${
                      getRiskBadge(selectedStudentForDossier.riskLevel).badgeClass
                    }`}
                  >
                    {getRiskBadge(selectedStudentForDossier.riskLevel).label}
                  </span>
                </div>
              </div>

              {/* 5-Factor Analytical Breakdown */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>تحليل العوامل الـ 5 المرجحة (Diagnostic Breakdown)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">أيام الغياب المنفصل:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedStudentForDossier.factors.totalAbsenceFactor} يوم (الحد 30)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">أيام الغياب المتصل:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedStudentForDossier.factors.consecutiveAbsenceFactor} يوم (الحد 15)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">نسبة حضور الورش العملية:</span>
                    <span
                      className={`font-extrabold text-sm ${
                        selectedStudentForDossier.factors.workshopAttendanceFactor < 85
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {selectedStudentForDossier.factors.workshopAttendanceFactor}% (الحد 85%)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">مخرجات البرامج العلاجية:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedStudentForDossier.factors.competencyRemedialFactor} مخرج متعثر
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">مخالفات الورش والهروب:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {selectedStudentForDossier.factors.violationsFactor} واقعة مسجلة
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-slate-500 block text-[11px]">وتيرة الغياب الأخيرة (14 يوم):</span>
                    <span
                      className={`font-extrabold text-sm ${
                        selectedStudentForDossier.factors.recentAbsenceTrend === 'accelerating'
                          ? 'text-red-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {selectedStudentForDossier.factors.recentAbsenceTrend === 'accelerating'
                        ? 'متسارعة ومقلقة ⚠️'
                        : 'مستقرة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specific Risk Causes */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>الأسباب المشخصة بدقة</span>
                </h4>
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                  {selectedStudentForDossier.riskReasons.map((reason, i) => (
                    <div key={i} className="text-xs text-amber-900 flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Recommended AI Interventions */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>التدخلات والإجراءات الذكية المقترحة (Action Plan)</span>
                </h4>
                <div className="space-y-2.5">
                  {selectedStudentForDossier.aiRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-indigo-950">{rec.title}</div>
                        <div className="text-[11px] text-slate-600">{rec.description}</div>
                      </div>
                      <button
                        onClick={() => {
                          handleTriggerIntervention(
                            selectedStudentForDossier,
                            rec.actionType,
                            rec.title
                          );
                          setSelectedStudentForDossier(null);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>تنفيذ: {rec.actionLabel}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              {onNavigateToStudentReport && (
                <button
                  onClick={() => {
                    const sId = selectedStudentForDossier.studentId;
                    setSelectedStudentForDossier(null);
                    onNavigateToStudentReport(sId);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>فتح السجل الشامل للطالب</span>
                </button>
              )}

              <button
                onClick={() => setSelectedStudentForDossier(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
