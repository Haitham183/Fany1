'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  SocialCaseRecord,
  SocialSessionRecord,
  SocialCaseStatus,
  SocialCasePriority,
  SocialCaseCategory,
  SocialSessionType,
  WorkshopViolationRecord,
} from '@/types';
import {
  runAiRiskAnalysis,
  StudentRiskAnalysis,
} from '@/lib/aiPredictor';
import {
  saveSocialCase,
  deleteSocialCase,
  addSocialCaseSession,
  referStudentToSocialSpecialist,
  getSocialCases,
} from '@/lib/storage';
import {
  HeartHandshake,
  BrainCircuit,
  Search,
  Filter,
  Plus,
  Phone,
  MessageSquare,
  Calendar,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  FileText,
  Building2,
  GraduationCap,
  Wrench,
  BookOpen,
  Sparkles,
  Zap,
  Layers,
  X,
  Edit3,
  Trash2,
  Send,
  Eye,
  ArrowUpRight,
  Users,
  Activity,
  Award,
} from 'lucide-react';

interface SocialWorkerPortalViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  attendance: AttendanceRecord[];
  socialCases: SocialCaseRecord[];
  schoolConfig: SchoolConfig | null;
  currentUser: User;
  violations?: WorkshopViolationRecord[];
  onDataChanged: () => void;
  onNavigateToStudentReport?: (studentId: string) => void;
  onNavigateToAiPredictions?: () => void;
}

export const SocialWorkerPortalView: React.FC<SocialWorkerPortalViewProps> = ({
  students,
  classes,
  departments,
  attendance,
  socialCases,
  schoolConfig,
  currentUser,
  violations = [],
  onDataChanged,
  onNavigateToStudentReport,
  onNavigateToAiPredictions,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modals state
  const [selectedCaseForDossier, setSelectedCaseForDossier] = useState<SocialCaseRecord | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<'diagnosis' | 'sessions' | 'guardian' | 'outcome'>('diagnosis');
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<'case_study' | 'guardian_summon' | 'protection_report' | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // New Session form state inside Dossier
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    sessionType: 'individual_counseling' as SocialSessionType,
    sessionTitle: 'جلسة إرشاد فردي وتعديل سلوك',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    studentCommitments: '',
    guardianCommitments: '',
    recommendations: '',
    outcome: 'stable' as 'improved' | 'stable' | 'needs_followup' | 'no_response',
  });

  // New Manual Case Form State
  const [newCaseStudentId, setNewCaseStudentId] = useState('');
  const [newCaseCategory, setNewCaseCategory] = useState<SocialCaseCategory>('absence_dropout_risk');
  const [newCasePriority, setNewCasePriority] = useState<SocialCasePriority>('high');
  const [newCaseReason, setNewCaseReason] = useState('');
  const [newCaseInitialDiagnosis, setNewCaseInitialDiagnosis] = useState('');

  const config: SchoolConfig = schoolConfig || {
    name: 'المدرسة الثانوية الفنية الصناعية',
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
    managerTitle: 'مدير عام المدرسة',
    studentAffairsHead: '',
    practicalMinAttendanceRate: 85,
    theoreticalMinAttendanceRate: 75,
  };

  // Run AI Engine to discover high risk students not yet in social cases or requiring updates
  const aiSummary = useMemo(() => {
    return runAiRiskAnalysis({
      students,
      attendance,
      classes,
      departments,
      schoolConfig: config,
      violations,
    });
  }, [students, attendance, classes, departments, config, violations]);

  // AI High-Risk Students that are recommended for social specialist
  const unreferredAiCriticalStudents = useMemo(() => {
    const existingStudentIds = new Set(
      socialCases
        .filter((c) => c.status === 'pending' || c.status === 'in_progress')
        .map((c) => c.studentId)
    );

    return aiSummary.studentAnalyses.filter(
      (analysis) =>
        (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') &&
        !existingStudentIds.has(analysis.studentId)
    );
  }, [aiSummary, socialCases]);

  // Filtered Cases List
  const filteredCases = useMemo(() => {
    return socialCases.filter((c) => {
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      if (selectedDept !== 'all' && c.departmentId !== selectedDept) return false;
      if (selectedClass !== 'all' && c.classId !== selectedClass) return false;
      if (sourceFilter !== 'all') {
        if (sourceFilter === 'ai' && c.referralSource !== 'ai_prediction') return false;
        if (sourceFilter === 'manual' && c.referralSource === 'ai_prediction') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          c.studentName.toLowerCase().includes(q) ||
          c.studentCode.toLowerCase().includes(q) ||
          c.nationalId.includes(q) ||
          c.className.toLowerCase().includes(q) ||
          c.departmentName.toLowerCase().includes(q) ||
          c.referralReason.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [socialCases, selectedStatus, selectedPriority, selectedCategory, selectedDept, selectedClass, sourceFilter, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = socialCases.length;
    const pending = socialCases.filter((c) => c.status === 'pending').length;
    const inProgress = socialCases.filter((c) => c.status === 'in_progress').length;
    const resolved = socialCases.filter((c) => c.status === 'resolved').length;
    const urgent = socialCases.filter((c) => c.priority === 'urgent' && c.status !== 'closed' && c.status !== 'resolved').length;
    const aiReferred = socialCases.filter((c) => c.referralSource === 'ai_prediction').length;
    const totalSessions = socialCases.reduce((acc, c) => acc + (c.sessions?.length || 0), 0);
    return { total, pending, inProgress, resolved, urgent, aiReferred, totalSessions };
  }, [socialCases]);

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4500);
  };

  // Quick single intake from AI recommendation
  const handleIntakeAiStudent = (analysis: StudentRiskAnalysis) => {
    const student = students.find((s) => s.id === analysis.studentId);
    if (!student) return;

    const studentClass = classes.find((c) => c.id === student.classId);
    const studentDept = departments.find((d) => d.id === student.departmentId);

    const created = referStudentToSocialSpecialist({
      student,
      studentClass,
      department: studentDept,
      reason: analysis.riskReasons.join(' • '),
      priority: analysis.riskLevel === 'critical' ? 'urgent' : 'high',
      category: analysis.factors.violationsFactor > 0 ? 'workshop_escape_behavior' : 'absence_dropout_risk',
      aiRiskScore: analysis.overallRiskScore,
      aiRiskLevel: analysis.riskLevel,
      aiRootCauses: analysis.riskReasons,
      aiRecommendations: analysis.aiRecommendations.map((r) => r.title),
      source: 'ai_prediction',
    });

    onDataChanged();
    showToast(`تم استقبال وقيد ملف إرشاد للطالب: ${student.fullName} بنجاح`);
    setSelectedCaseForDossier(created);
  };

  // Batch intake of all critical AI predictions
  const handleBatchIntakeAllCritical = () => {
    if (unreferredAiCriticalStudents.length === 0) return;
    if (
      !window.confirm(
        `تأكيد إدراج جميع الحالات الحرجة (${unreferredAiCriticalStudents.length} طلاب) المكتشفة بالذكاء الاصطناعي في سجل المتابعة الاجتماعية؟`
      )
    ) {
      return;
    }

    let count = 0;
    unreferredAiCriticalStudents.forEach((analysis) => {
      const student = students.find((s) => s.id === analysis.studentId);
      if (!student) return;
      const studentClass = classes.find((c) => c.id === student.classId);
      const studentDept = departments.find((d) => d.id === student.departmentId);

      referStudentToSocialSpecialist({
        student,
        studentClass,
        department: studentDept,
        reason: analysis.riskReasons.join(' • '),
        priority: analysis.riskLevel === 'critical' ? 'urgent' : 'high',
        category: analysis.factors.violationsFactor > 0 ? 'workshop_escape_behavior' : 'absence_dropout_risk',
        aiRiskScore: analysis.overallRiskScore,
        aiRiskLevel: analysis.riskLevel,
        aiRootCauses: analysis.riskReasons,
        aiRecommendations: analysis.aiRecommendations.map((r) => r.title),
        source: 'ai_prediction',
      });
      count++;
    });

    onDataChanged();
    showToast(`تم إدراج ${count} حالات حرجة محالة من الذكاء الاصطناعي بنجاح`);
  };

  // Manual new case submission
  const handleCreateManualCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseStudentId) {
      alert('يرجى اختيار الطالب');
      return;
    }

    const student = students.find((s) => s.id === newCaseStudentId);
    if (!student) return;
    const studentClass = classes.find((c) => c.id === student.classId);
    const studentDept = departments.find((d) => d.id === student.departmentId);

    const created = saveSocialCase({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      nationalId: student.nationalId,
      classId: student.classId,
      className: studentClass?.name || '',
      departmentId: student.departmentId,
      departmentName: studentDept?.name || '',
      gradeLevel: student.gradeLevel,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      address: student.address,
      referralSource: 'self',
      referralReason: newCaseReason || 'إحالة وبحث حالة من الأخصائي الاجتماعي',
      status: 'in_progress',
      priority: newCasePriority,
      category: newCaseCategory,
      initialDiagnosis: newCaseInitialDiagnosis,
      sessions: [],
    });

    onDataChanged();
    setIsNewCaseModalOpen(false);
    setNewCaseStudentId('');
    setNewCaseReason('');
    setNewCaseInitialDiagnosis('');
    showToast(`تم فتح وتوثيق ملف دراسة حالة للطالب: ${student.fullName}`);
    if (created) {
      setSelectedCaseForDossier(created);
    }
  };

  // Add session to current case
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseForDossier) return;
    if (!sessionForm.summary.trim()) {
      alert('يرجى كتابة ملخص الجلسة الإرشادية');
      return;
    }

    const nextSessionNum = (selectedCaseForDossier.sessions?.length || 0) + 1;
    const updated = addSocialCaseSession(selectedCaseForDossier.id, {
      sessionNumber: nextSessionNum,
      sessionType: sessionForm.sessionType,
      sessionTitle: sessionForm.sessionTitle,
      date: sessionForm.date,
      summary: sessionForm.summary,
      studentCommitments: sessionForm.studentCommitments,
      guardianCommitments: sessionForm.guardianCommitments,
      recommendations: sessionForm.recommendations,
      specialistName: currentUser.name,
      outcome: sessionForm.outcome,
    });

    onDataChanged();
    setIsAddingSession(false);
    setSessionForm({
      sessionType: 'individual_counseling',
      sessionTitle: 'جلسة إرشاد فردي وتعديل سلوك',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      studentCommitments: '',
      guardianCommitments: '',
      recommendations: '',
      outcome: 'stable',
    });

    if (updated) {
      setSelectedCaseForDossier(updated);
    }
    showToast(`تم توثيق الجلسة الإرشادية رقم (${nextSessionNum}) بنجاح`);
  };

  // Update Case Diagnostics or Status
  const handleUpdateCaseField = (fields: Partial<SocialCaseRecord>) => {
    if (!selectedCaseForDossier) return;
    const updated = saveSocialCase({
      ...selectedCaseForDossier,
      ...fields,
    });
    onDataChanged();
    if (updated) {
      setSelectedCaseForDossier(updated);
    }
    showToast('تم تحديث بيانات الملف الإرشادي بنجاح');
  };

  const getStatusBadge = (status: SocialCaseStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'قيد الانتظار (جديدة)', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'in_progress':
        return { label: 'جاري المتابعة والجلسات', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'resolved':
        return { label: 'تم التحسن والعلاج 🟢', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
      case 'escalated':
        return { label: 'تم التصعيد للجنة الحماية', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'closed':
        return { label: 'مغلقة ومحفوظة', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const getPriorityBadge = (p: SocialCasePriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'عاجل جداً 🔴', bg: 'bg-red-600 text-white animate-pulse' };
      case 'high':
        return { label: 'مرتفع 🟠', bg: 'bg-orange-500 text-white' };
      case 'medium':
        return { label: 'متوسط 🟡', bg: 'bg-amber-500 text-slate-950' };
      case 'routine':
        return { label: 'عادي 🟢', bg: 'bg-emerald-600 text-white' };
    }
  };

  const getCategoryTitle = (cat: SocialCaseCategory) => {
    switch (cat) {
      case 'absence_dropout_risk':
        return 'خطر الغياب المتكرر والتسرب';
      case 'workshop_escape_behavior':
        return 'الهروب والتزويغ من الورش';
      case 'academic_competency_struggle':
        return 'تعثر الجدارات والبرامج العلاجية';
      case 'economic_social_circumstances':
        return 'ظروف اجتماعية واقتصادية';
      case 'safety_violation_repetition':
        return 'مخالفات السلامة والسلوك';
      case 'psychological_counseling':
        return 'إرشاد وتكيف نفسي ومهني';
      default:
        return 'إرشاد عام';
    }
  };

  return (
    <div className="space-y-6 font-['Cairo']">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-teal-800/40 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30">
              <HeartHandshake className="w-7 h-7 text-teal-400" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <span>بوابة الأخصائي الاجتماعي والإرشاد التربوي</span>
                <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-400/30 font-mono font-bold">
                  سجل لائحة الانضباط والتحفيز
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                متابعة الحالات الإرشادية والسلوكية المحالة من محرك التنبؤ الذكي • دراسة الحالات الفردية • مواثيق الانضباط المدرسي • التواصل مع أولياء الأمور
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto no-print">
          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl transition shadow-lg shadow-teal-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>فتح ملف دراسة حالة جديد</span>
          </button>

          {onNavigateToAiPredictions && (
            <button
              onClick={onNavigateToAiPredictions}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-700/50 transition cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>رادار التنبؤ الذكي</span>
            </button>
          )}

          <button
            onClick={() => {
              setPrintDocType('protection_report');
              setTimeout(() => window.print(), 200);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            title="طباعة تقرير الحالات الشامل للجنة الحماية المدرسية"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>تقرير لجنة الحماية</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Widgets Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>إجمالي الحالات</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">ملف مسجل بالمنظومة</div>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
            <span>إحالات جديدة بالانتظار</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.pending}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">تتطلب دراسة ومقابلة</div>
        </div>

        <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
            <span>جاري المتابعة والجلسات</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.inProgress}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">خطة علاجية نشطة</div>
        </div>

        <div className="bg-red-50/80 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-800 text-xs font-bold mb-1">
            <span>حالات حرجة وعاجلة</span>
            <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-700">{stats.urgent}</div>
          <div className="text-[11px] text-red-600 font-semibold mt-1">تدخل فوري مع ولي الأمر</div>
        </div>

        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold mb-1">
            <span>إحالات الذكاء الاصطناعي</span>
            <BrainCircuit className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.aiReferred}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">رصد خوارزمي للتسرب</div>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
            <span>حالات تم علاجها وتحسنها</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.resolved}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">انتظام الحضور والورش</div>
        </div>
      </div>

      {/* AI Smart Referral Intake Alert Banner (When Unreferred Critical Students Exist) */}
      {unreferredAiCriticalStudents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-500/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/40 shrink-0">
              <Zap className="w-6 h-6 text-amber-400 animate-bounce" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-2">
                <span>تنبيه الذكاء الاصطناعي: يوجد ({unreferredAiCriticalStudents.length}) طلاب في نطاق الخطورة الحرجة بحاجة لإحالة عاجلة</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                اكتشف المحرك التنبؤي طلاباً يقتربون من حد الفصل القانوني أو تجاوزوا نسبة غياب الورش (85%) أو تكرر هروبهم. يمكنك إدراجهم في سجل الأخصائي بنقرة واحدة لدراسة حالاتهم فوراً.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={handleBatchIntakeAllCritical}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>إدراج جميع الحالات الحرجة ({unreferredAiCriticalStudents.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">بحث بالطالب أو الكود أو السبب</label>
            <div className="relative">
              <input
                type="text"
                placeholder="اسم الطالب / الكود / القومي..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold pl-3 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">موقف المتابعة</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">قيد الانتظار (جديدة)</option>
              <option value="in_progress">جاري المتابعة والجلسات</option>
              <option value="resolved">تم التحسن والعلاج 🟢</option>
              <option value="escalated">تم التصعيد للجنة الحماية</option>
              <option value="closed">مغلقة ومحفوظة</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">درجة الأولوية</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">جميع الأولويات</option>
              <option value="urgent">🔴 عاجل جداً</option>
              <option value="high">🟠 مرتفع</option>
              <option value="medium">🟡 متوسط</option>
              <option value="routine">🟢 عادي</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">تصنيف المشكلة</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="absence_dropout_risk">خطر الغياب والتسرب</option>
              <option value="workshop_escape_behavior">الهروب من الورش</option>
              <option value="academic_competency_struggle">تعثر الجدارات والورش</option>
              <option value="economic_social_circumstances">ظروف اجتماعية واقتصادية</option>
              <option value="safety_violation_repetition">مخالفات السلامة والسلوك</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">القسم والتخصص</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">جميع الأقسام</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">مصدر الإحالة</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">الكل (ذكي + يدوي)</option>
              <option value="ai">محرك الذكاء الاصطناعي ✨</option>
              <option value="manual">إحالة يدوية / شئون طلاب</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Cases Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              سجل الحالات والمتابعات الإرشادية ({filteredCases.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>فرز حسب الأحدث قيداً</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">بيانات الطالب</th>
                <th className="py-3 px-3">الفصل والتخصص</th>
                <th className="py-3 px-3">تصنيف المشكلة وسبب الإحالة</th>
                <th className="py-3 px-3 text-center">مؤشر الذكاء الاصطناعي</th>
                <th className="py-3 px-3 text-center">الأولوية</th>
                <th className="py-3 px-3 text-center">موقف المتابعة</th>
                <th className="py-3 px-3 text-center">الجلسات</th>
                <th className="py-3 px-3 text-center no-print">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <HeartHandshake className="w-12 h-12 text-teal-400 mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-slate-700 text-sm">لا توجد حالات مسجلة تطابق خيارات الفلترة المحددة</p>
                    <p className="text-xs text-slate-400 mt-1">يمكنك فتح دراسة حالة جديدة أو استيراد الحالات الحرجة من التنبؤ الذكي</p>
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem, idx) => {
                  const statusBadge = getStatusBadge(caseItem.status);
                  const priorityBadge = getPriorityBadge(caseItem.priority);
                  return (
                    <tr
                      key={caseItem.id}
                      className={`hover:bg-teal-50/30 transition ${
                        caseItem.priority === 'urgent' && caseItem.status !== 'resolved'
                          ? 'bg-red-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900 text-sm">{caseItem.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>كود: {caseItem.studentCode}</span>
                          <span>•</span>
                          <span>القومي: {caseItem.nationalId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {caseItem.className}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">{caseItem.departmentName}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-teal-800 text-[11.5px]">
                          {getCategoryTitle(caseItem.category)}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {caseItem.referralReason}
                        </p>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {caseItem.referralSource === 'ai_prediction' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="bg-indigo-100 text-indigo-800 text-[10.5px] px-2 py-0.5 rounded-full font-black border border-indigo-200 flex items-center gap-1">
                              <BrainCircuit className="w-3 h-3 text-indigo-600" />
                              {caseItem.aiRiskScore ? `${caseItem.aiRiskScore}% خطر` : 'رصد ذكي'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {caseItem.aiRiskLevel === 'critical'
                                ? '🔴 حرج جداً'
                                : caseItem.aiRiskLevel === 'high'
                                ? '🟠 مرتفع'
                                : '🟡 متوسط'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            تحويل يدوي
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full ${priorityBadge.bg}`}>
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-xs">
                          {caseItem.sessions?.length || 0} جلسة
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCaseForDossier(caseItem);
                              setActiveDossierTab('diagnosis');
                            }}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="فتح ملف دراسة الحالة الشامل"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>دراسة الحالة</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCaseForDossier(caseItem);
                              setPrintDocType('case_study');
                              setTimeout(() => window.print(), 200);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                            title="طباعة استمارة دراسة الحالة الرسمية A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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

      {/* COMPREHENSIVE CASE STUDY DOSSIER MODAL */}
      {selectedCaseForDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 text-white p-5 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-400/30">
                  <HeartHandshake className="w-7 h-7 text-teal-400" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">{selectedCaseForDossier.studentName}</h3>
                    <span className="text-xs bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/30 font-bold">
                      ملف حالة رقم: #{selectedCaseForDossier.id.substring(0, 10)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-1 font-mono">
                    <span>كود: {selectedCaseForDossier.studentCode}</span>
                    <span>•</span>
                    <span>{selectedCaseForDossier.className}</span>
                    <span>•</span>
                    <span>قسم: {selectedCaseForDossier.departmentName}</span>
                    <span>•</span>
                    <span>تاريخ الإحالة: {selectedCaseForDossier.referralDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrintDocType('case_study');
                    setTimeout(() => window.print(), 200);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الاستمارة الرسمية</span>
                </button>

                <button
                  onClick={() => setSelectedCaseForDossier(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quick Status & Guardian Bar */}
            <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600">ولي الأمر:</span>
                  <span className="font-black text-slate-900">{selectedCaseForDossier.guardianName || 'غير مسجل'}</span>
                </div>
                {selectedCaseForDossier.guardianPhone && (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${selectedCaseForDossier.guardianPhone}`}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>اتصال: {selectedCaseForDossier.guardianPhone}</span>
                    </a>
                    <a
                      href={`https://wa.me/2${selectedCaseForDossier.guardianPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-1 transition"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>واتساب</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700">تحديث موقف الحالة:</label>
                <select
                  value={selectedCaseForDossier.status}
                  onChange={(e) => handleUpdateCaseField({ status: e.target.value as SocialCaseStatus })}
                  className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pending">قيد الانتظار (جديدة)</option>
                  <option value="in_progress">جاري المتابعة والجلسات</option>
                  <option value="resolved">تم التحسن والعلاج 🟢</option>
                  <option value="escalated">تم التصعيد للجنة الحماية</option>
                  <option value="closed">مغلقة ومحفوظة</option>
                </select>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-2 shrink-0">
              <button
                onClick={() => setActiveDossierTab('diagnosis')}
                className={`px-4 py-2.5 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  activeDossierTab === 'diagnosis'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>التشخيص والخطة العلاجية</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('sessions')}
                className={`px-4 py-2.5 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  activeDossierTab === 'sessions'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span>سجل الجلسات الإرشادية ({selectedCaseForDossier.sessions?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('guardian')}
                className={`px-4 py-2.5 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  activeDossierTab === 'guardian'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>تواصل ومقابلات ولي الأمر</span>
              </button>

              <button
                onClick={() => setActiveDossierTab('outcome')}
                className={`px-4 py-2.5 text-xs font-black border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                  activeDossierTab === 'outcome'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>النتائج وخاتمة المتابعة</span>
              </button>
            </div>

            {/* Dossier Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              {/* TAB 1: DIAGNOSIS & AI INSIGHTS */}
              {activeDossierTab === 'diagnosis' && (
                <div className="space-y-4">
                  {/* AI Diagnosis Insights Callout */}
                  {selectedCaseForDossier.aiRiskScore && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-900 text-xs flex items-center gap-1.5">
                          <BrainCircuit className="w-4 h-4 text-indigo-600" />
                          <span>تحليل محرك الذكاء الاصطناعي التنبؤي للحالة:</span>
                        </span>
                        <span className="bg-indigo-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                          معدل الخطر: {selectedCaseForDossier.aiRiskScore}%
                        </span>
                      </div>

                      {selectedCaseForDossier.aiRootCauses && selectedCaseForDossier.aiRootCauses.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[11px] font-bold text-slate-600">الأسباب الجذرية المرصودة:</span>
                          <ul className="list-disc list-inside text-xs text-indigo-950 font-semibold space-y-0.5 pr-2">
                            {selectedCaseForDossier.aiRootCauses.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Initial Diagnosis */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        التشخيص المبدئي للمشكلة والظواهر السلوكية:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.initialDiagnosis || ''}
                        onChange={(e) => handleUpdateCaseField({ initialDiagnosis: e.target.value })}
                        placeholder="وصف المشكلة: غياب متكرر، نفور من التدريب العملي، تدني المستوى..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Family Circumstances */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الجانب الأسري والاجتماعي والاقتصادي:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.familyCircumstances || ''}
                        onChange={(e) => handleUpdateCaseField({ familyCircumstances: e.target.value })}
                        placeholder="الظروف الأسرية: استقرار الأسرة، عمل الطالب خارج أوقات الدراسة، الدخل..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Workshop Adaptation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        مدى التكيف والانتظام في ورشة التدريب العملي:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.workshopAdaptation || ''}
                        onChange={(e) => handleUpdateCaseField({ workshopAdaptation: e.target.value })}
                        placeholder="ملاحظات مدرب الورشة، ارتداء مهمات الوقاية، التفاعل مع الماكينات..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Action Plan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الخطة العلاجية والبرنامج الإرشادي المقترح:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.actionPlan || ''}
                        onChange={(e) => handleUpdateCaseField({ actionPlan: e.target.value })}
                        placeholder="الخطوات الإرشادية: جلسات فردية، إشراك في أنشطة المدرسة، تعويض الورش..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COUNSELING SESSIONS LOG */}
              {activeDossierTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-teal-600" />
                      <span>الجلسات والمقابلات الإرشادية الموثقة ({selectedCaseForDossier.sessions?.length || 0})</span>
                    </h4>
                    {!isAddingSession && (
                      <button
                        onClick={() => setIsAddingSession(true)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تسجيل جلسة إرشادية جديدة</span>
                      </button>
                    )}
                  </div>

                  {/* Add Session Form */}
                  {isAddingSession && (
                    <form onSubmit={handleSaveSession} className="bg-slate-50 p-4 rounded-xl border border-teal-300 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-xs text-teal-900">
                          توثيق جلسة إرشادية رقم ({(selectedCaseForDossier.sessions?.length || 0) + 1})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingSession(false)}
                          className="text-slate-400 hover:text-slate-700 text-xs"
                        >
                          إلغاء
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع الجلسة</label>
                          <select
                            value={sessionForm.sessionType}
                            onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value as any })}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                          >
                            <option value="individual_counseling">جلسة إرشاد فردي</option>
                            <option value="guardian_meeting">مقابلة ولي الأمر</option>
                            <option value="behavioral_contract">توقيع ميثاق وتعهد سلوكي</option>
                            <option value="workshop_visit">متابعة ميدانية بالورشة</option>
                            <option value="home_visit">بحث ميداني / زيارة منزلية</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ الجلسة</label>
                          <input
                            type="date"
                            value={sessionForm.date}
                            onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">نتيجة وتقييم الجلسة</label>
                          <select
                            value={sessionForm.outcome}
                            onChange={(e) => setSessionForm({ ...sessionForm, outcome: e.target.value as any })}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                          >
                            <option value="stable">مستقر / قيد المتابعة</option>
                            <option value="improved">تحسن ملحوظ واستجابة 🟢</option>
                            <option value="needs_followup">يحتاج جلسة متابعة لاحقة</option>
                            <option value="no_response">عدم استجابة / تكرار المخالفة</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">عنوان أو موضوع الجلسة</label>
                        <input
                          type="text"
                          required
                          value={sessionForm.sessionTitle}
                          onChange={(e) => setSessionForm({ ...sessionForm, sessionTitle: e.target.value })}
                          className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">ملخص وقائع الجلسة الإرشادية</label>
                        <textarea
                          rows={2}
                          required
                          placeholder="ما دار خلال المقابلة والنقاط التي تم بحثها مع الطالب..."
                          value={sessionForm.summary}
                          onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                          className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">تعهدات والتزامات الطالب (الميثاق السلوكي)</label>
                          <textarea
                            rows={2}
                            placeholder="تعهد الطالب بعدم تكرار الغياب أو الهروب والالتزام بالزي..."
                            value={sessionForm.studentCommitments}
                            onChange={(e) => setSessionForm({ ...sessionForm, studentCommitments: e.target.value })}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">التوجيهات والتوصيات الإجرائية</label>
                          <textarea
                            rows={2}
                            placeholder="توصيات الأخصائي لمعلمي القسم والورش وإدارة المدرسة..."
                            value={sessionForm.recommendations}
                            onChange={(e) => setSessionForm({ ...sessionForm, recommendations: e.target.value })}
                            className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingSession(false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-teal-600 text-white text-xs font-black rounded-lg hover:bg-teal-700 transition"
                        >
                          حفظ وتوثيق الجلسة
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Sessions Timeline List */}
                  <div className="space-y-3">
                    {(!selectedCaseForDossier.sessions || selectedCaseForDossier.sessions.length === 0) ? (
                      <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs">
                        لم يتم توثيق أي جلسات إرشادية لهذا الملف بعد. اضغط على الزر أعلاه لبدء الجلسة الأولى.
                      </div>
                    ) : (
                      selectedCaseForDossier.sessions.map((s) => (
                        <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                                {s.sessionNumber}
                              </span>
                              <span className="font-black text-slate-900 text-xs">{s.sessionTitle}</span>
                              <span className="bg-teal-50 text-teal-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-teal-200">
                                {s.sessionType === 'individual_counseling'
                                  ? 'إرشاد فردي'
                                  : s.sessionType === 'guardian_meeting'
                                  ? 'مقابلة ولي أمر'
                                  : s.sessionType === 'behavioral_contract'
                                  ? 'ميثاق سلوكي'
                                  : s.sessionType === 'workshop_visit'
                                  ? 'متابعة بالورشة'
                                  : 'زيارة منزلية'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 font-mono flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {s.date}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.outcome === 'improved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {s.outcome === 'improved' ? 'تحسن واستجابة 🟢' : 'مستقر'}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-medium">{s.summary}</p>

                          {s.studentCommitments && (
                            <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 text-xs text-amber-950">
                              <span className="font-bold block text-[11px] text-amber-800">تعهدات الطالب:</span>
                              <span>{s.studentCommitments}</span>
                            </div>
                          )}

                          {s.recommendations && (
                            <div className="text-[11.5px] text-slate-600 flex items-start gap-1">
                              <span className="font-bold text-teal-800">التوجيهات:</span>
                              <span>{s.recommendations}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: GUARDIAN ENGAGEMENT */}
              {activeDossierTab === 'guardian' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-teal-600" />
                        <span>سجل التواصل والاستدعاءات الرسمية لولي الأمر</span>
                      </h4>

                      <button
                        onClick={() => {
                          setPrintDocType('guardian_summon');
                          setTimeout(() => window.print(), 200);
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة خطاب استدعاء رسمي A4</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="guardianContactedCheck"
                          checked={selectedCaseForDossier.guardianContacted || false}
                          onChange={(e) => handleUpdateCaseField({ guardianContacted: e.target.checked })}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <label htmlFor="guardianContactedCheck" className="text-xs font-bold text-slate-800">
                          تم التواصل الفعلي مع ولي الأمر هاتفياً / حضورياً
                        </label>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">تاريخ المقابلة / التواصل</label>
                        <input
                          type="date"
                          value={selectedCaseForDossier.guardianContactDate || ''}
                          onChange={(e) => handleUpdateCaseField({ guardianContactDate: e.target.value })}
                          className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ملاحظات وإقرار ولي الأمر خلال المقابلة:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.guardianNotes || ''}
                        onChange={(e) => handleUpdateCaseField({ guardianNotes: e.target.value })}
                        placeholder="ما تم الاتفاق عليه مع ولي الأمر وتعهده بمتابعة ابنه بالورشة والمدرسة..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: OUTCOME & CLOSURE */}
              {activeDossierTab === 'outcome' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>التقرير الختامي للأخصائي الاجتماعي وقرار الإغلاق / التصعيد</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        التقرير النهائي للأخصائي الاجتماعي:
                      </label>
                      <textarea
                        rows={3}
                        value={selectedCaseForDossier.specialistNotes || ''}
                        onChange={(e) => handleUpdateCaseField({ specialistNotes: e.target.value })}
                        placeholder="تقييم مدى استجابة الطالب، انتظام الحضور بالورش، وتوصيات الفصل القادم..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateCaseField({ status: 'resolved', resolvedDate: new Date().toISOString().split('T')[0] })}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>اعتماد التحسن وإغلاق الحالة بنجاح</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateCaseField({ status: 'escalated' })}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>تصعيد للجنة الحماية المدرسية</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('هل ترغب بالتأكيد في حذف هذا الملف؟')) {
                            deleteSocialCase(selectedCaseForDossier.id);
                            setSelectedCaseForDossier(null);
                            onDataChanged();
                            showToast('تم حذف الملف بنجاح');
                          }
                        }}
                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف الملف</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW MANUAL CASE MODAL */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="text-base font-black flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <span>فتح ملف دراسة حالة وبحث اجتماعي جديد</span>
              </h3>
              <button
                onClick={() => setIsNewCaseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualCase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر الطالب المستهدف *</label>
                <select
                  required
                  value={newCaseStudentId}
                  onChange={(e) => setNewCaseStudentId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- اختر الطالب من السجل --</option>
                  {students.map((s) => {
                    const c = classes.find((cl) => cl.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({c?.name || 'فصل'} - {s.studentCode})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف المشكلة</label>
                  <select
                    value={newCaseCategory}
                    onChange={(e) => setNewCaseCategory(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300"
                  >
                    <option value="absence_dropout_risk">خطر الغياب والتسرب</option>
                    <option value="workshop_escape_behavior">الهروب من الورش</option>
                    <option value="academic_competency_struggle">تعثر الجدارات والورش</option>
                    <option value="economic_social_circumstances">ظروف اجتماعية واقتصادية</option>
                    <option value="safety_violation_repetition">مخالفات السلامة والسلوك</option>
                    <option value="psychological_counseling">إرشاد وتكيف نفسي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درجة الأولوية</label>
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300"
                  >
                    <option value="urgent">🔴 عاجل جداً</option>
                    <option value="high">🟠 مرتفع</option>
                    <option value="medium">🟡 متوسط</option>
                    <option value="routine">🟢 عادي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الإحالة والملاحظة الميدانية *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="سبب فتح الملف: ملاحظة هروب من طابور الصباح، تعثر بالورشة..."
                  value={newCaseReason}
                  onChange={(e) => setNewCaseReason(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التشخيص المبدئي للأخصائي</label>
                <textarea
                  rows={2}
                  placeholder="الملاحظات الأولية..."
                  value={newCaseInitialDiagnosis}
                  onChange={(e) => setNewCaseInitialDiagnosis(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition shadow-md"
                >
                  فتح وتوثيق الملف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL EGYPTIAN MINISTRY PRINTABLE TEMPLATES (A4 PRINT VIEW ONLY)       */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-black bg-white p-6 leading-normal font-['Cairo']">
        {/* PRINT TEMPLATE 1: OFFICIAL INDIVIDUAL CASE STUDY SHEET */}
        {printDocType === 'case_study' && selectedCaseForDossier && (
          <div className="space-y-4">
            {/* Ministry Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div className="text-xs font-bold space-y-1">
                <div>جمهورية مصر العربية</div>
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{config.directorate}</div>
                <div>{config.administration}</div>
                <div>{config.name}</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-base font-black border-2 border-black px-4 py-1 rounded-md">
                  استمارة دراسة حالة فردية للتعليم الفني
                </div>
                <div className="text-xs font-bold">
                  (طبقاً للقرار الوزاري ولائحة التحفيز التربوي والانضباط المدرسي)
                </div>
                <div className="text-[11px] font-mono">العام الدراسي: {config.academicYear}</div>
              </div>
              <div className="text-xs font-bold space-y-1 text-left">
                <div>مكتب التربية الاجتماعية</div>
                <div>رقم الملف: #{selectedCaseForDossier.id.substring(0, 8)}</div>
                <div>التاريخ: {selectedCaseForDossier.referralDate}</div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="border border-black p-3 rounded-md space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div><b>اسم الطالب:</b> {selectedCaseForDossier.studentName}</div>
                <div><b>كود الطالب:</b> {selectedCaseForDossier.studentCode}</div>
                <div><b>الرقم القومي:</b> {selectedCaseForDossier.nationalId}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><b>الصف والفصل:</b> {selectedCaseForDossier.className}</div>
                <div><b>القسم والتخصص:</b> {selectedCaseForDossier.departmentName}</div>
                <div><b>مصدر الإحالة:</b> {selectedCaseForDossier.referralSource === 'ai_prediction' ? 'محرك التنبؤ الذكي بالذكاء الاصطناعي' : 'إحالة مدرسية'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><b>اسم ولي الأمر:</b> {selectedCaseForDossier.guardianName || 'غير مسجل'}</div>
                <div><b>رقم الهاتف:</b> {selectedCaseForDossier.guardianPhone || 'غير مسجل'}</div>
              </div>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="border border-black p-2.5 rounded-md">
                <div className="font-bold mb-1 border-b border-black pb-0.5">أولاً: سبب الإحالة والتشخيص الأولي للمشكلة:</div>
                <p className="leading-relaxed">{selectedCaseForDossier.referralReason} {selectedCaseForDossier.initialDiagnosis ? `| ${selectedCaseForDossier.initialDiagnosis}` : ''}</p>
              </div>

              <div className="border border-black p-2.5 rounded-md">
                <div className="font-bold mb-1 border-b border-black pb-0.5">ثانياً: الجانب الأسري والاجتماعي والتكيف بالورشة:</div>
                <p className="leading-relaxed">{selectedCaseForDossier.familyCircumstances || 'تمت دراسة الظروف الأسرية للطالب وتبين حاجته لتعزيز المتابعة المنزلية.'}</p>
              </div>

              <div className="border border-black p-2.5 rounded-md">
                <div className="font-bold mb-1 border-b border-black pb-0.5">ثالثاً: الخطة العلاجية والبرنامج الإرشادي:</div>
                <p className="leading-relaxed">{selectedCaseForDossier.actionPlan || 'عقد جلسات إرشادية دورية، تعويض الساعات العملية بورشة التخصص، وتوقيع ميثاق الانضباط السلوكي.'}</p>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="border border-black rounded-md overflow-hidden text-xs">
              <div className="font-bold p-1.5 bg-gray-100 border-b border-black">رابعاً: سجل الجلسات الإرشادية والمقابلات المنفذة:</div>
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-black bg-gray-50 font-bold">
                    <th className="p-1 border-l border-black text-center">م</th>
                    <th className="p-1 border-l border-black">التاريخ</th>
                    <th className="p-1 border-l border-black">نوع المقابلة</th>
                    <th className="p-1 border-l border-black">ملخص الجلسة وتعهدات الطالب</th>
                    <th className="p-1">النتيجة والتوصيات</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCaseForDossier.sessions && selectedCaseForDossier.sessions.length > 0 ? (
                    selectedCaseForDossier.sessions.map((s, idx) => (
                      <tr key={s.id} className="border-b border-black">
                        <td className="p-1 border-l border-black text-center">{idx + 1}</td>
                        <td className="p-1 border-l border-black font-mono">{s.date}</td>
                        <td className="p-1 border-l border-black">{s.sessionTitle}</td>
                        <td className="p-1 border-l border-black">{s.summary} {s.studentCommitments ? `(تعهد: ${s.studentCommitments})` : ''}</td>
                        <td className="p-1">{s.recommendations || (s.outcome === 'improved' ? 'تحسن ملحوظ' : 'متابعة مستمرة')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-2 text-center text-gray-500">تم فتح الملف وجارٍ تنفيذ الجلسات الإرشادية.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Signatures */}
            <div className="pt-6 grid grid-cols-3 text-center text-xs font-bold gap-4">
              <div>
                <div>الأخصائي الاجتماعي القائم بالدراسة</div>
                <div className="mt-8">{currentUser.name}</div>
              </div>
              <div>
                <div>وكيل شئون الطلاب</div>
                <div className="mt-8">{config.studentAffairsHead || '........................'}</div>
              </div>
              <div>
                <div>يعتمد، مدير عام المدرسة</div>
                <div className="mt-8">{config.managerName || '........................'}</div>
              </div>
            </div>
          </div>
        )}

        {/* PRINT TEMPLATE 2: OFFICIAL GUARDIAN SUMMON LETTER */}
        {printDocType === 'guardian_summon' && selectedCaseForDossier && (
          <div className="space-y-6 max-w-2xl mx-auto border-2 border-black p-8 rounded-lg">
            <div className="flex justify-between items-start border-b-2 border-black pb-3 text-xs font-bold">
              <div>
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{config.directorate}</div>
                <div>{config.name}</div>
              </div>
              <div className="text-center">
                <div className="text-base font-black border-2 border-black px-4 py-1 rounded">خطاب استدعاء ولي أمر رسمي</div>
                <div className="text-[11px] font-mono mt-1">العام الدراسي: {config.academicYear}</div>
              </div>
              <div className="text-left">
                <div>التاريخ: {new Date().toISOString().split('T')[0]}</div>
                <div>مكتب الخدمة الاجتماعية</div>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              <div className="font-bold">
                السيد ولي أمر الطالب / <u>{selectedCaseForDossier.studentName}</u> المقيد بالصف <u>{selectedCaseForDossier.className}</u> (قسم: <u>{selectedCaseForDossier.departmentName}</u>)
              </div>

              <p>تحية طيبة وبعد ،،،</p>

              <p className="text-justify">
                نظراً لحرص إدارة المدرسة ومكتب التربية الاجتماعية على مصلحة نجلكم ومستقبله التعليمي والمهني، وتفادياً لتعرضه للمساءلة القانونية أو الحرمان من تقييم الجدارات المهنية أو صدور قرارات فصل لتجاوز نسب الغياب القانونية،
              </p>

              <div className="bg-gray-100 p-3 rounded border border-black font-bold text-xs">
                يرجى من سيادتكم الحضور شخصياً لمكتب الأخصائي الاجتماعي بالمدرسة يوم ..................... الموافق .... / .... / 2026 الساعة ............ صباحاً وذلك لبحث الموقف الإرشادي والتعليمي لنجلكم.
              </div>

              <p className="text-xs text-gray-700">
                * يرجى إحضار بطاقة الرقم القومي لولي الأمر.
              </p>
            </div>

            <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold">
              <div>
                <div>الأخصائي الاجتماعي</div>
                <div className="mt-8">{currentUser.name}</div>
              </div>
              <div>
                <div>يعتمد، مدير عام المدرسة</div>
                <div className="mt-8">{config.managerName || '........................'}</div>
              </div>
            </div>
          </div>
        )}

        {/* PRINT TEMPLATE 3: PROTECTION COMMITTEE COMPREHENSIVE REPORT */}
        {printDocType === 'protection_report' && (
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b-2 border-black pb-3">
              <div className="text-xs font-bold space-y-1">
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{config.directorate}</div>
                <div>{config.name}</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-base font-black border-2 border-black px-4 py-1 rounded">
                  تقرير الحالات الإرشادية المعروضة على لجنة الحماية المدرسية
                </div>
                <div className="text-xs font-bold font-mono">العام الدراسي: {config.academicYear}</div>
              </div>
              <div className="text-xs font-bold text-left">
                <div>إجمالي الحالات: {filteredCases.length}</div>
                <div>التاريخ: {new Date().toISOString().split('T')[0]}</div>
              </div>
            </div>

            <table className="w-full text-right text-xs border border-black">
              <thead>
                <tr className="border-b border-black bg-gray-100 font-bold">
                  <th className="p-1 border-l border-black text-center">م</th>
                  <th className="p-1 border-l border-black">اسم الطالب</th>
                  <th className="p-1 border-l border-black">الفصل والتخصص</th>
                  <th className="p-1 border-l border-black">تصنيف المشكلة وسبب الإحالة</th>
                  <th className="p-1 border-l border-black text-center">مصدر الإحالة</th>
                  <th className="p-1 border-l border-black text-center">الأولوية</th>
                  <th className="p-1 text-center">الموقف الحالي والتوصية</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c, idx) => (
                  <tr key={c.id} className="border-b border-black">
                    <td className="p-1 border-l border-black text-center">{idx + 1}</td>
                    <td className="p-1 border-l border-black font-bold">{c.studentName}</td>
                    <td className="p-1 border-l border-black">{c.className} - {c.departmentName}</td>
                    <td className="p-1 border-l border-black">{c.referralReason}</td>
                    <td className="p-1 border-l border-black text-center">{c.referralSource === 'ai_prediction' ? 'تنبؤ ذكي' : 'مدرسي'}</td>
                    <td className="p-1 border-l border-black text-center">{c.priority === 'urgent' ? 'عاجل' : 'مرتفع'}</td>
                    <td className="p-1 text-center">{c.status === 'resolved' ? 'تم التحسن والعلاج' : c.status === 'in_progress' ? 'جاري المتابعة' : 'قيد الانتظار'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 grid grid-cols-3 text-center text-xs font-bold">
              <div>
                <div>أمين سر لجنة الحماية (الأخصائي)</div>
                <div className="mt-8">{currentUser.name}</div>
              </div>
              <div>
                <div>وكيل شئون الطلاب</div>
                <div className="mt-8">{config.studentAffairsHead || '........................'}</div>
              </div>
              <div>
                <div>رئيس لجنة الحماية (مدير المدرسة)</div>
                <div className="mt-8">{config.managerName || '........................'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
