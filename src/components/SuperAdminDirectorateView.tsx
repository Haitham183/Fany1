'use client';

import React, { useState, useMemo } from 'react';
import {
  SchoolTenant,
  User,
  Student,
  Department,
  SchoolClass,
  AttendanceRecord,
  SchoolSystemType,
  SchoolShiftType,
  WorkDaysScheme,
  DirectorateCircular,
  SchoolInspectionReport,
} from '@/types';
import {
  getSchools,
  getActiveSchoolId,
  setActiveSchoolId,
  saveSchool,
  deleteSchool,
  getDirectorateCirculars,
  saveDirectorateCircular,
  deleteDirectorateCircular,
  getInspectionReports,
  saveInspectionReport,
  deleteInspectionReport,
} from '@/lib/storage';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  Clock,
  MapPin,
  Phone,
  Settings,
  Trash2,
  Sparkles,
  TrendingUp,
  School,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Send,
  Check,
  RefreshCw,
  Filter,
  Layers,
  HardHat,
  CalendarCheck,
  X,
  Edit3,
  KeyRound,
  Copy,
  Printer,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export type DirectorateSubWindow =
  | 'overview'
  | 'schools_control'
  | 'competency_audit'
  | 'attendance_observatory'
  | 'circulars_directives'
  | 'inspection_logs';

interface SuperAdminDirectorateViewProps {
  currentUser: User;
  students?: Student[];
  departments?: Department[];
  classes?: SchoolClass[];
  attendance?: AttendanceRecord[];
  initialSubTab?: DirectorateSubWindow | string;
  onSelectSchool?: (schoolId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateToSchool?: (schoolId: string) => void;
}

export const SuperAdminDirectorateView: React.FC<SuperAdminDirectorateViewProps> = ({
  currentUser,
  students = [],
  departments = [],
  classes = [],
  attendance = [],
  initialSubTab = 'overview',
  onSelectSchool,
  onNavigateTab,
  onNavigateToSchool,
}) => {
  // Normalize initial sub-window
  const resolveSubTab = (tab?: string): DirectorateSubWindow => {
    if (!tab) return 'overview';
    if (tab === 'directorate_schools' || tab === 'schools_control') return 'schools_control';
    if (tab === 'directorate_competencies' || tab === 'competency_audit') return 'competency_audit';
    if (tab === 'directorate_attendance' || tab === 'attendance_observatory') return 'attendance_observatory';
    if (tab === 'directorate_circulars' || tab === 'circulars_directives') return 'circulars_directives';
    if (tab === 'directorate_inspection' || tab === 'inspection_logs') return 'inspection_logs';
    return 'overview';
  };

  const [activeWindow, setActiveWindow] = useState<DirectorateSubWindow>(() => resolveSubTab(initialSubTab));

  // Sync state if initialSubTab changes from external navigation
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveWindow(resolveSubTab(initialSubTab));
    }
  }, [initialSubTab]);

  // Data states
  const [schools, setSchools] = useState<SchoolTenant[]>(() => getSchools());
  const [activeSchoolId, setActiveSchoolIdState] = useState<string>(() => getActiveSchoolId());
  const [circulars, setCirculars] = useState<DirectorateCircular[]>(() => getDirectorateCirculars());
  const [inspectionReports, setInspectionReports] = useState<SchoolInspectionReport[]>(() => getInspectionReports());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirectorate, setFilterDirectorate] = useState('all');
  const [filterSystemType, setFilterSystemType] = useState('all');

  // Add / Edit School Modal
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolFormName, setSchoolFormName] = useState('');
  const [schoolFormCode, setSchoolFormCode] = useState('');
  const [schoolFormAccessPin, setSchoolFormAccessPin] = useState('');
  const [schoolFormUsername, setSchoolFormUsername] = useState('');
  const [showPinInForm, setShowPinInForm] = useState(false);
  const [schoolFormDirectorate, setSchoolFormDirectorate] = useState('مديرية التربية والتعليم بالقاهرة');
  const [schoolFormAdmin, setSchoolFormAdmin] = useState('إدارة الوايلي التعليمية');
  const [schoolFormSystem, setSchoolFormSystem] = useState<SchoolSystemType>('3_years');
  const [schoolFormShift, setSchoolFormShift] = useState<SchoolShiftType>('single_morning');
  const [schoolFormDays, setSchoolFormDays] = useState<WorkDaysScheme>('sun_to_thu');
  const [schoolFormPrincipal, setSchoolFormPrincipal] = useState('');
  const [schoolFormPhone, setSchoolFormPhone] = useState('');
  const [schoolFormAddress, setSchoolFormAddress] = useState('');

  // School PIN Security & Credential Slip States
  const [revealedPinSchoolId, setRevealedPinSchoolId] = useState<string | null>(null);
  const [credentialSlipSchool, setCredentialSlipSchool] = useState<SchoolTenant | null>(null);
  const [isCredentialSlipModalOpen, setIsCredentialSlipModalOpen] = useState(false);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string | null>(null);

  const generateRandomPin = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setSchoolFormAccessPin(pin);
  };

  const toggleRevealPin = (schoolId: string) => {
    setRevealedPinSchoolId((prev) => (prev === schoolId ? null : schoolId));
  };

  const copySchoolCredentials = (s: SchoolTenant) => {
    const text = `بيانات تسجيل الدخول لحساب المدرسة:
المدرسة: ${s.name}
كود المدرسة الوزاري: ${s.code}
اسم المستخدم: ${s.schoolUsername || s.code}
الرقم السري للمدرسة (PIN): ${s.accessPin || s.code}
رابط البوابة: بوابة التعليم الفني المركزية`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopyFeedbackText(`تم نسخ بيانات حساب (${s.name}) بنجاح!`);
    setTimeout(() => setCopyFeedbackText(null), 3000);
  };

  const openCredentialSlip = (s: SchoolTenant) => {
    setCredentialSlipSchool(s);
    setIsCredentialSlipModalOpen(true);
  };

  // Add Circular Modal
  const [isCircularModalOpen, setIsCircularModalOpen] = useState(false);
  const [circTitle, setCircTitle] = useState('');
  const [circSubject, setCircSubject] = useState<'cbe' | 'safety' | 'attendance' | 'general' | 'exams'>('cbe');
  const [circContent, setCircContent] = useState('');
  const [circPriority, setCircPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [circScope, setCircScope] = useState<'all' | 'specific_school' | '5_years_only' | 'applied_tech_only'>('all');

  // Add Inspection Modal
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspSchoolId, setInspSchoolId] = useState('');
  const [inspInspectorName, setInspInspectorName] = useState('م. أحمد كمال الدين (موجه عام مركزي بالمديرية)');
  const [inspDept, setInspDept] = useState('قسم الميكانيكا والتشغيل');
  const [inspDiscipline, setInspDiscipline] = useState<'excellent' | 'good' | 'needs_improvement' | 'critical'>('good');
  const [inspPPE, setInspPPE] = useState<'compliant' | 'partial' | 'non_compliant'>('compliant');
  const [inspRate, setInspRate] = useState(88);
  const [inspNotes, setInspNotes] = useState('');
  const [inspRecommendations, setInspRecommendations] = useState('');

  const refreshAll = () => {
    setSchools(getSchools());
    setActiveSchoolIdState(getActiveSchoolId());
    setCirculars(getDirectorateCirculars());
    setInspectionReports(getInspectionReports());
  };

  const handleSwitchSchool = (schoolId: string) => {
    setActiveSchoolId(schoolId);
    setActiveSchoolIdState(schoolId);
    if (onSelectSchool) onSelectSchool(schoolId);
    if (onNavigateToSchool) onNavigateToSchool(schoolId);
  };

  // Open Add School
  const handleOpenAddSchool = () => {
    setEditingSchoolId(null);
    setSchoolFormName('');
    setSchoolFormCode('');
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setSchoolFormAccessPin(randomPin);
    setSchoolFormUsername('');
    setShowPinInForm(true);
    setSchoolFormDirectorate('مديرية التربية والتعليم بالقاهرة');
    setSchoolFormAdmin('إدارة الوايلي التعليمية');
    setSchoolFormSystem('3_years');
    setSchoolFormShift('single_morning');
    setSchoolFormDays('sun_to_thu');
    setSchoolFormPrincipal('');
    setSchoolFormPhone('');
    setSchoolFormAddress('');
    setIsSchoolModalOpen(true);
  };

  // Open Edit School
  const handleOpenEditSchool = (s: SchoolTenant) => {
    setEditingSchoolId(s.id);
    setSchoolFormName(s.name);
    setSchoolFormCode(s.code);
    setSchoolFormAccessPin(s.accessPin || s.code);
    setSchoolFormUsername(s.schoolUsername || s.code);
    setShowPinInForm(false);
    setSchoolFormDirectorate(s.directorate);
    setSchoolFormAdmin(s.administration);
    setSchoolFormSystem(s.systemType);
    setSchoolFormShift(s.shiftType);
    setSchoolFormDays(s.workDaysScheme);
    setSchoolFormPrincipal(s.principalName || '');
    setSchoolFormPhone(s.phone || '');
    setSchoolFormAddress(s.address || '');
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolFormName.trim() || !schoolFormCode.trim()) return;

    const saved = saveSchool({
      id: editingSchoolId || undefined,
      name: schoolFormName.trim(),
      code: schoolFormCode.trim(),
      accessPin: schoolFormAccessPin.trim() || undefined,
      schoolUsername: schoolFormUsername.trim() || schoolFormCode.trim(),
      directorate: schoolFormDirectorate.trim(),
      administration: schoolFormAdmin.trim(),
      systemType: schoolFormSystem,
      shiftType: schoolFormShift,
      workDaysScheme: schoolFormDays,
      principalName: schoolFormPrincipal.trim(),
      phone: schoolFormPhone.trim(),
      address: schoolFormAddress.trim(),
      isActive: true,
    });

    setIsSchoolModalOpen(false);
    refreshAll();

    // Automatically present the official credential slip modal for confirmation & printing
    setCredentialSlipSchool(saved);
    setIsCredentialSlipModalOpen(true);
  };

  const handleDeleteSchool = (schoolId: string, schoolName: string) => {
    if (schools.length <= 1) {
      alert('لا يمكن حذف المدرسة الأخيرة في المنظومة.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف مدرسة (${schoolName}) وجميع بياناتها؟`)) {
      deleteSchool(schoolId);
      refreshAll();
    }
  };

  // Save Circular
  const handleSaveCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circTitle.trim() || !circContent.trim()) return;

    saveDirectorateCircular({
      title: circTitle.trim(),
      subject: circSubject,
      content: circContent.trim(),
      priority: circPriority,
      targetScope: circScope,
      issuedBy: currentUser.name || 'د. حسام الدين عبد القادر - مدير عام التعليم الفني',
    });

    setCircTitle('');
    setCircContent('');
    setIsCircularModalOpen(false);
    refreshAll();
  };

  // Save Inspection
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSchool = schools.find((s) => s.id === inspSchoolId) || schools[0];
    if (!targetSchool) return;

    saveInspectionReport({
      schoolId: targetSchool.id,
      schoolName: targetSchool.name,
      inspectorName: inspInspectorName.trim(),
      departmentInspected: inspDept.trim(),
      disciplineRating: inspDiscipline,
      ppeComplianceRating: inspPPE,
      workshopAttendanceRate: Number(inspRate) || 85,
      notes: inspNotes.trim(),
      recommendations: inspRecommendations.trim(),
      status: 'pending_school_action',
    });

    setInspNotes('');
    setInspRecommendations('');
    setIsInspectionModalOpen(false);
    refreshAll();
  };

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch =
        s.name.includes(searchQuery.trim()) ||
        s.code.includes(searchQuery.trim()) ||
        s.administration.includes(searchQuery.trim()) ||
        s.directorate.includes(searchQuery.trim());
      const matchDir = filterDirectorate === 'all' || s.directorate.includes(filterDirectorate);
      const matchSys = filterSystemType === 'all' || s.systemType === filterSystemType;
      return matchSearch && matchDir && matchSys;
    });
  }, [schools, searchQuery, filterDirectorate, filterSystemType]);

  // Aggregate Metrics Calculations
  const totalSchoolsCount = schools.length;
  const activeSchoolsCount = schools.filter((s) => s.isActive).length;
  const totalStudentsOverall = students.length;
  const totalDeptsOverall = departments.length;

  // Mock computed governorate benchmarks for realistic oversight
  const governorateAttendanceAvg = 91.8;
  const governorateWorkshop85ComplianceRate = 87.5;
  const compliantSchoolsCount = Math.max(1, Math.round(totalSchoolsCount * 0.85));

  const windowsMeta: { id: DirectorateSubWindow; label: string; icon: any; badge?: string }[] = [
    { id: 'overview', label: 'لوحة متابعة ورصد المدارس الفنية بالمحافظة', icon: LayoutDashboardIcon },
    { id: 'schools_control', label: 'إنشاء بيانات المدارس الفنية وكلمات المرور', icon: Building2, badge: `${schools.length}` },
    { id: 'attendance_observatory', label: 'مرصد الحضور والغياب الميداني', icon: TrendingUp },
    { id: 'competency_audit', label: 'رقابة الجدارات ونسب حضور الورش (85%)', icon: Award },
    { id: 'circulars_directives', label: 'الكتب الدورية والتعليمات الوزارية', icon: FileText, badge: `${circulars.length}` },
    { id: 'inspection_logs', label: 'سجلات لجان التفتيش الفني', icon: ShieldAlert, badge: `${inspectionReports.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Official Ministry Directorate Command Header */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950/70 to-slate-950 text-white p-6 rounded-3xl shadow-xl border-2 border-amber-500/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500 text-slate-950 text-xs px-3 py-0.5 rounded-full font-black flex items-center gap-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4 fill-current" />
                <span>جمهورية مصر العربية • قطاع التعليم الفني</span>
              </span>
              <span className="bg-slate-900/90 text-amber-300 border border-amber-500/30 text-xs px-3 py-0.5 rounded-full font-bold">
                🏛️ كابينة قيادة المديرية والمتابعة المركزية
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {activeSchoolsCount} مدارس معتمدة
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <span>الإدارة المركزية لمدارس التعليم الفني والتدريب المهني</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-medium">
              الرقابة الشاملة على المدارس الصناعية بالمحافظة، التحقق من تطبيق لائحة الجدارات وشرط الـ 85% لحضور الورش، إصدار القرارات الوزارية، وتدقيق سجلات التفتيش.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-lg shadow-amber-500/20"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddSchool}
            >
              إضافة مدرسة فنية جديدة
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Directorate Specialized Windows Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-1.5 overflow-x-auto">
        {windowsMeta.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWindow === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveWindow(tab.id);
                if (onNavigateTab) {
                  const mapped =
                    tab.id === 'schools_control'
                      ? 'directorate_schools'
                      : tab.id === 'competency_audit'
                      ? 'directorate_competencies'
                      : tab.id === 'attendance_observatory'
                      ? 'directorate_attendance'
                      : tab.id === 'circulars_directives'
                      ? 'directorate_circulars'
                      : tab.id === 'inspection_logs'
                      ? 'directorate_inspection'
                      : 'directorate';
                  onNavigateTab(mapped);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* WINDOW 1: OVERVIEW & CENTRAL COCKPIT */}
      {/* ========================================================================= */}
      {activeWindow === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 6 Key Directorate Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">المدارس الفنية</span>
                <Building2 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{totalSchoolsCount}</div>
              <div className="text-[10.5px] text-emerald-600 font-bold">100% أنظمة معزولة</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">إجمالي الطلاب</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{totalStudentsOverall}</div>
              <div className="text-[10.5px] text-blue-600 font-bold">بالمحافظة</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">نسبة الحضور العامة</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{governorateAttendanceAvg}%</div>
              <div className="text-[10.5px] text-slate-500">معدل الإحصاء الصباحي</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">استيفاء ورش 85%</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-600">{governorateWorkshop85ComplianceRate}%</div>
              <div className="text-[10.5px] text-purple-500 font-bold">{compliantSchoolsCount} من {totalSchoolsCount} مدارس مستوفية</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">الأقسام والورش</span>
                <Layers className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{totalDeptsOverall}</div>
              <div className="text-[10.5px] text-orange-500 font-bold">تخصصات صناعية</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold">تقارير التفتيش</span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{inspectionReports.length}</div>
              <div className="text-[10.5px] text-slate-500 font-bold">زيارات ميدانية موثقة</div>
            </div>
          </div>

          {/* School Performance Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-amber-500" />
                  <span>مصفوفة المقارنة الميدانية لمدارس المحافظة</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  المتابعة اللحظية لنسب الحضور، انضباط الورش، وحالة التقييم لكل مدرسة فنية.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveWindow('schools_control')}
                  leftIcon={<Building2 className="w-3.5 h-3.5" />}
                >
                  إدارة شبكة المدارس بالكامل ➔
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">كود المدرسة</th>
                    <th className="p-3">اسم المدرسة الفنية</th>
                    <th className="p-3">الإدارة التعليمية</th>
                    <th className="p-3">النظام والفترات</th>
                    <th className="p-3">مدير المدرسة</th>
                    <th className="p-3 text-center">الرقم السري والاعتماد 🔐</th>
                    <th className="p-3 text-center">حضور الورش (85%)</th>
                    <th className="p-3 text-center">التحقق CBE</th>
                    <th className="p-3 text-center">الإجراء والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {schools.map((s) => {
                    const isCurrent = s.id === activeSchoolId;
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                          isCurrent ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                          {s.code}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{s.name}</span>
                            {isCurrent && (
                              <span className="bg-emerald-500 text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-black">
                                النشطة حالياً
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.address}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                          {s.administration}
                        </td>
                        <td className="p-3 text-[11px]">
                          <span className="font-bold block text-slate-800 dark:text-slate-200">
                            {s.systemType === '5_years_advanced' ? 'فني متقدم (5 سنوات)' : 'صناعي عام (3 سنوات)'}
                          </span>
                          <span className="text-slate-400">
                            {s.shiftType === 'two_shifts' ? 'فترتان (صباحي/مسائي)' : 'فترة صباحية'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">
                          {s.principalName || 'غير مسجل'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/30 px-2 py-0.5 rounded-xl border border-amber-200 dark:border-amber-800/50 text-[11px]">
                            <span className="font-mono font-black text-amber-900 dark:text-amber-300 tracking-wider">
                              {revealedPinSchoolId === s.id ? (s.accessPin || s.code) : '••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealPin(s.id)}
                              className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                              title={revealedPinSchoolId === s.id ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                            >
                              {revealedPinSchoolId === s.id ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copySchoolCredentials(s)}
                              className="p-1 text-slate-500 hover:text-amber-600 cursor-pointer"
                              title="نسخ بيانات الدخول"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCredentialSlip(s)}
                              className="p-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              title="بطاقة اعتماد المدرسة الرسمية (طباعة)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ 89.2% (مستوفٍ)
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            عينات معتمدة
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant={isCurrent ? 'secondary' : 'primary'}
                            size="sm"
                            className="font-bold text-xs"
                            onClick={() => handleSwitchSchool(s.id)}
                          >
                            {isCurrent ? 'تفتيش السجلات 🔍' : 'بدء التفتيش الإداري ➔'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WINDOW 2: SCHOOLS CONTROL & DIRECTORY */}
      {/* ========================================================================= */}
      {activeWindow === 'schools_control' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Search, Filter & Actions Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم المدرسة، الكود الوزاري، الإدارة، أو اسم المدير..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filterDirectorate}
                onChange={(e) => setFilterDirectorate(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="all">جميع المديريات</option>
                <option value="القاهرة">القاهرة</option>
                <option value="الجيزة">الجيزة</option>
                <option value="الإسكندرية">الإسكندرية</option>
              </select>

              <select
                value={filterSystemType}
                onChange={(e) => setFilterSystemType(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="all">جميع النظم الدراسية</option>
                <option value="3_years">صناعي (3 سنوات)</option>
                <option value="5_years_advanced">فني متقدم (5 سنوات)</option>
                <option value="applied_technology">تكنولوجيا تطبيقية</option>
                <option value="dual_education">تعليم مزدوج</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenAddSchool}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                تسجيل مدرسة جديدة
              </Button>
            </div>
          </div>

          {/* Schools Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchools.map((s) => {
              const isCurrent = s.id === activeSchoolId;

              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-3xl border transition-all duration-200 space-y-4 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-black">
                          <School className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-mono text-[10.5px] font-bold text-amber-600 dark:text-amber-400 block">
                            كود المدرسة: {s.code}
                          </span>
                          <h4 className="font-black text-slate-900 dark:text-white text-sm line-clamp-2">
                            {s.name}
                          </h4>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                          النشطة الآن
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{s.directorate} • {s.administration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>المدير: {s.principalName || 'غير مسجل'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          النظام: {s.systemType === '5_years_advanced' ? 'فني متقدم (5 سنوات)' : 'صناعي عام (3 سنوات)'}
                        </span>
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{s.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* School Login Credentials Card Segment */}
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/70 dark:border-amber-800/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-bold">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>الرقم السري للمدرسة:</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleRevealPin(s.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded transition cursor-pointer"
                            title={revealedPinSchoolId === s.id ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                          >
                            {revealedPinSchoolId === s.id ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copySchoolCredentials(s)}
                            className="p-1 text-slate-500 hover:text-amber-600 rounded transition cursor-pointer"
                            title="نسخ بيانات الدخول"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openCredentialSlip(s)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 rounded transition cursor-pointer"
                            title="بطاقة اعتماد المدرسة الرسمية (طباعة)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-mono">
                          كود الدخول: <span className="font-bold text-slate-800 dark:text-slate-200">{s.schoolUsername || s.code}</span>
                        </span>
                        <span className="font-mono text-xs font-black tracking-widest text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          {revealedPinSchoolId === s.id ? (s.accessPin || s.code) : '••••••'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      size="sm"
                      className="flex-1 font-bold text-xs"
                      onClick={() => handleSwitchSchool(s.id)}
                    >
                      {isCurrent ? 'فحص وتفتيش السجلات 🔍' : 'بدء التفتيش الإداري ➔'}
                    </Button>

                    <button
                      onClick={() => handleOpenEditSchool(s)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="تعديل بيانات المدرسة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {schools.length > 1 && (
                      <button
                        onClick={() => handleDeleteSchool(s.id, s.name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="حذف المدرسة من المنظومة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WINDOW 3: COMPETENCY AUDIT & 85% WORKSHOP RATE */}
      {/* ========================================================================= */}
      {activeWindow === 'competency_audit' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Legal Rule Alert Banner */}
          <div className="bg-purple-950/40 border-2 border-purple-500/40 p-4 rounded-2xl text-purple-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-black text-sm text-purple-300">
              <Award className="w-4 h-4 text-purple-400" />
              <span>القاعدة الوزارية الملزمة: شرط الـ 85% لحضور الورش العملية</span>
            </div>
            <p className="leading-relaxed">
              وفقاً للائحة التقييم والتحقق لبرامج التعليم الفني القائمة على الجدارات المهنية (CBE)، لا يحق لأي طالب دخول التقييم النهائي لوحدات الجدارات إلا بعد تحقيق نسبة حضور لا تقل عن 85% في الورش ومعامل التدريب العملي.
            </p>
          </div>

          {/* Audit Cards per School */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((s, idx) => {
              // Simulated realistic variance for governorate oversight
              const workshopRate = 85 + (idx % 3 === 0 ? 6 : idx % 3 === 1 ? -4 : 4);
              const isCompliant = workshopRate >= 85;

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 block">كود: {s.code}</span>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{s.name}</h4>
                      <span className="text-xs text-slate-500">{s.administration}</span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                        isCompliant
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {isCompliant ? '✓ مستوفٍ للائحة' : '⚠️ أقل من 85%'}
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">متوسط حضور الورش:</span>
                      <strong className={`font-mono text-sm ${isCompliant ? 'text-emerald-600' : 'text-red-600'}`}>
                        {workshopRate}%
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">نسبة الاجتياز (جدير):</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">92.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">عينات التحقق الخارجي:</span>
                      <span className="font-bold text-purple-600">معتمدة بالكامل</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold"
                    onClick={() => handleSwitchSchool(s.id)}
                  >
                    فحص مصفوفة جدارات المدرسة ➔
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WINDOW 4: ATTENDANCE & MORNING CENSUS OBSERVATORY */}
      {/* ========================================================================= */}
      {activeWindow === 'attendance_observatory' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span>الإحصاء الصباحي التراكمي (5 مواظبة) على مستوى المحافظة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                متابعة نسب الغياب والإنذارات وقرارات الفصل الصادرة وفق المادة 25 من قانون التعليم 139 لسنة 1981.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block">إجمالي الطلاب المقيدين</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{totalStudentsOverall}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 block">إجمالي الحضور اليوم</span>
                <span className="text-xl font-black text-emerald-600">
                  {Math.round(totalStudentsOverall * 0.918)} طالب (91.8%)
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
                <span className="text-xs text-amber-700 dark:text-amber-300 block">الغياب بعذر معتمد</span>
                <span className="text-xl font-black text-amber-600">
                  {Math.round(totalStudentsOverall * 0.052)} طالب
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800">
                <span className="text-xs text-red-700 dark:text-red-300 block">الغياب بدون عذر</span>
                <span className="text-xl font-black text-red-600">
                  {Math.round(totalStudentsOverall * 0.03)} طالب
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WINDOW 5: CIRCULARS & DIRECTIVES DISPATCHER */}
      {/* ========================================================================= */}
      {activeWindow === 'circulars_directives' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>القرارات والكتب الدورية والتعليمات الوزارية الصادرة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إصدار وتعميم التوجيهات من المديرية إلى المدارس ومتابعة تأكيد الاستلام والقراءة.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCircularModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              إصدار كتاب دوري جديد
            </Button>
          </div>

          <div className="space-y-3">
            {circulars.map((c) => {
              const acknowledgedCount = c.acknowledgedBySchoolIds?.length || 0;
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                          {c.circularNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.priority === 'urgent'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : c.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {c.priority === 'urgent' ? 'عاجل جداً ⚡' : c.priority === 'high' ? 'هام' : 'اعتيادي'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{c.issuedDate}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{c.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800">
                        استلمته {acknowledgedCount} من {schools.length} مدارس
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا القرار؟')) {
                            deleteDirectorateCircular(c.id);
                            refreshAll();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="حذف القرار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {c.content}
                  </p>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>جهة الإصدار: {c.issuedBy}</span>
                    <span>النطاق: {c.targetScope === 'all' ? 'كافة مدارس المحافظة' : 'مدارس محددة'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WINDOW 6: FIELD INSPECTION & AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeWindow === 'inspection_logs' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span>سجل زيارات التفتيش والمتابعة الميدانية للورش والمدارس</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توثيق نتائج التفتيش الميداني على الورش الصناعية، مهمات الوقاية، ونظافة وصيانة الماكينات.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setInspSchoolId(schools[0]?.id || '');
                setIsInspectionModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              تسجيل تقرير تفتيش جديد
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectionReports.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 block">{r.reportNumber}</span>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm">{r.schoolName}</h4>
                      <span className="text-xs text-amber-600 font-bold">{r.departmentInspected}</span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        r.disciplineRating === 'excellent'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.disciplineRating === 'good'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {r.disciplineRating === 'excellent' ? 'ممتاز' : r.disciplineRating === 'good' ? 'جيد' : 'يحتاج تدارك'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">المفتش / رئيس اللجنة:</span>
                      <strong className="text-slate-900 dark:text-white">{r.inspectorName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تاريخ الزيارة:</span>
                      <span className="font-mono">{r.visitDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">مهمات الوقاية (PPE):</span>
                      <span className="font-bold text-emerald-600">
                        {r.ppeComplianceRating === 'compliant' ? '✓ ملتزم بالكامل' : '⚠️ جزئي'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">حضور الورشة المرصود:</span>
                      <span className="font-mono font-bold text-purple-600">{r.workshopAttendanceRate}%</span>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <strong>الملاحظات:</strong> {r.notes}
                    </div>
                  )}

                  {r.recommendations && (
                    <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                      <strong>التوصيات الملزمة:</strong> {r.recommendations}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    الحالة: {r.status === 'resolved' ? '✓ تم تنفيذ التوصيات' : 'قيد متابعة المدرسة'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('حذف هذا التقرير التفتيشي؟')) {
                        deleteInspectionReport(r.id);
                        refreshAll();
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Modal: Register or Edit Technical School */}
      <Modal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        title={editingSchoolId ? 'تعديل بيانات المدرسة الفنية' : 'إضافة مدرسة فنية صناعية جديدة للمنظومة'}
      >
        <form onSubmit={handleSaveSchoolSubmit} className="space-y-4 text-xs">
          <Input
            label="اسم المدرسة الفنية بالكامل *"
            placeholder="مثال: مدرسة السويس الثانوية الصناعية المتقدمة"
            value={schoolFormName}
            onChange={(e) => setSchoolFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="كود المدرسة المالي والوزاري *"
              placeholder="مثال: 10408"
              value={schoolFormCode}
              onChange={(e) => setSchoolFormCode(e.target.value)}
              required
            />

            <Input
              label="مدير عام المدرسة"
              placeholder="اسم مدير المدرسة"
              value={schoolFormPrincipal}
              onChange={(e) => setSchoolFormPrincipal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="مديرية التربية والتعليم *"
              value={schoolFormDirectorate}
              onChange={(e) => setSchoolFormDirectorate(e.target.value)}
              required
            />

            <Input
              label="الإدارة التعليمية *"
              value={schoolFormAdmin}
              onChange={(e) => setSchoolFormAdmin(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="نظام الدراسة"
              value={schoolFormSystem}
              onChange={(e) => setSchoolFormSystem(e.target.value as SchoolSystemType)}
              options={[
                { value: '3_years', label: 'دبلوم صناعي (3 سنوات)' },
                { value: '5_years_advanced', label: 'فني متقدم (5 سنوات)' },
                { value: 'applied_technology', label: 'تكنولوجيا تطبيقية' },
                { value: 'dual_education', label: 'تعليم مزدوج' },
              ]}
            />

            <Select
              label="نظام الفترات"
              value={schoolFormShift}
              onChange={(e) => setSchoolFormShift(e.target.value as SchoolShiftType)}
              options={[
                { value: 'single_morning', label: 'فترة صباحية واحدة' },
                { value: 'two_shifts', label: 'فترتان (صباحي ومسائي)' },
              ]}
            />

            <Select
              label="أيام العمل الأسبوعية"
              value={schoolFormDays}
              onChange={(e) => setSchoolFormDays(e.target.value as WorkDaysScheme)}
              options={[
                { value: 'sun_to_thu', label: 'الأحد إلى الخميس (5 أيام)' },
                { value: 'sat_to_thu', label: 'السبت إلى الخميس (6 أيام)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="هاتف المدرسة"
              placeholder="02xxxxxxxx"
              value={schoolFormPhone}
              onChange={(e) => setSchoolFormPhone(e.target.value)}
            />

            <Input
              label="عنوان المدرسة"
              placeholder="الشارع / المنطقة"
              value={schoolFormAddress}
              onChange={(e) => setSchoolFormAddress(e.target.value)}
            />
          </div>

          {/* School Credentials & Secret PIN Box */}
          <div className="bg-amber-50/80 dark:bg-amber-950/30 p-4 rounded-2xl border-2 border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-950 dark:text-amber-200">
                    بيانات اعتماد الدخول والرقم السري للمدرسة
                  </h4>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    يستخدمها مدير المدرسة لتسجيل الدخول إلى حساب مدرسته بالمنظومة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={generateRandomPin}
                className="text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                title="توليد رقم سري عشوائي جديد"
              >
                <Sparkles className="w-3 h-3 text-slate-950" />
                <span>توليد رقم سري 🎲</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="اسم المستخدم / معرف دخول المدرسة"
                placeholder={schoolFormCode ? schoolFormCode : 'كود المدرسة الوزاري'}
                value={schoolFormUsername}
                onChange={(e) => setSchoolFormUsername(e.target.value)}
                helperText="اسم المستخدم الرسمي لإدارة المدرسة (افتراضياً كود المدرسة)"
              />

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الرقم السري للمدرسة (Secret PIN) *
                </label>
                <div className="relative">
                  <input
                    type={showPinInForm ? 'text' : 'password'}
                    value={schoolFormAccessPin}
                    onChange={(e) => setSchoolFormAccessPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-white pl-10"
                    placeholder="مثال: 749201"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinInForm(!showPinInForm)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showPinInForm ? 'إخفاء الرقم السري' : 'إظهار الرقم السري'}
                  >
                    {showPinInForm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  يُسلم لإدارة المدرسة لتسجيل الدخول مباشرة لحساب المدرسة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsSchoolModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              {editingSchoolId ? 'حفظ التعديلات' : 'تسجيل المدرسة'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Issue New Directorate Circular */}
      <Modal
        isOpen={isCircularModalOpen}
        onClose={() => setIsCircularModalOpen(false)}
        title="إصدار وتعميم قرار / كتاب دوري جديد لمدارس المحافظة"
      >
        <form onSubmit={handleSaveCircular} className="space-y-4 text-xs">
          <Input
            label="عنوان الكتاب الدوري *"
            placeholder="مثال: تعليمات الالتزام بضوابط تقييم الجدارات..."
            value={circTitle}
            onChange={(e) => setCircTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="موضوع التوجيه"
              value={circSubject}
              onChange={(e) => setCircSubject(e.target.value as any)}
              options={[
                { value: 'cbe', label: 'تقييم الجدارات (CBE)' },
                { value: 'safety', label: 'الأمن الصناعي والسلامة' },
                { value: 'attendance', label: 'الانضباط والغياب' },
                { value: 'exams', label: 'امتحانات الدبلوم' },
                { value: 'general', label: 'تعليمات عامة' },
              ]}
            />

            <Select
              label="مستوى الأولوية"
              value={circPriority}
              onChange={(e) => setCircPriority(e.target.value as any)}
              options={[
                { value: 'urgent', label: 'عاجل جداً ⚡' },
                { value: 'high', label: 'هام' },
                { value: 'normal', label: 'اعتيادي' },
              ]}
            />

            <Select
              label="نطاق التعميم"
              value={circScope}
              onChange={(e) => setCircScope(e.target.value as any)}
              options={[
                { value: 'all', label: 'جميع مدارس المحافظة' },
                { value: '5_years_only', label: 'مدارس 5 سنوات فقط' },
                { value: 'applied_tech_only', label: 'التكنولوجيا التطبيقية فقط' },
              ]}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              نص القرار أو التعليمات الوزارية *
            </label>
            <textarea
              rows={4}
              required
              placeholder="اكتب التوجيهات الرسمية الواجب تنفيذها من قبل إدارات المدارس..."
              value={circContent}
              onChange={(e) => setCircContent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsCircularModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              إصدار وتعميم القرار الآن
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Add Inspection Report */}
      <Modal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        title="تسجيل تقرير زيارة تفتيش ومتابعة ميدانية"
      >
        <form onSubmit={handleSaveInspection} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="المدرسة الفنية المستهدفة *"
              value={inspSchoolId}
              onChange={(e) => setInspSchoolId(e.target.value)}
              options={schools.map((s) => ({ value: s.id, label: s.name }))}
            />

            <Input
              label="اسم المفتش / رئيس اللجنة *"
              value={inspInspectorName}
              onChange={(e) => setInspInspectorName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="القسم والورشة التي تم التفتيش عليها *"
              placeholder="مثال: ورشة الكهرباء والتحكم"
              value={inspDept}
              onChange={(e) => setInspDept(e.target.value)}
              required
            />

            <Select
              label="تقييم الانضباط العام"
              value={inspDiscipline}
              onChange={(e) => setInspDiscipline(e.target.value as any)}
              options={[
                { value: 'excellent', label: 'ممتاز' },
                { value: 'good', label: 'جيد' },
                { value: 'needs_improvement', label: 'يحتاج تدارك' },
                { value: 'critical', label: 'حرج وسلبي' },
              ]}
            />

            <Select
              label="مهمات الوقاية بالورش (PPE)"
              value={inspPPE}
              onChange={(e) => setInspPPE(e.target.value as any)}
              options={[
                { value: 'compliant', label: 'ملتزم بالكامل' },
                { value: 'partial', label: 'التزام جزئي' },
                { value: 'non_compliant', label: 'غير ملتزم' },
              ]}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              نسبة حضور الورشة المرصودة أثناء الزيارة (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={inspRate}
              onChange={(e) => setInspRate(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات التفتيش</label>
            <textarea
              rows={2}
              placeholder="سجل ملاحظات اللجنة على نظافة الورش، أجهزة الطوارئ، ودفاتر الحضور..."
              value={inspNotes}
              onChange={(e) => setInspNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">التوصيات والقرارات الملزمة</label>
            <textarea
              rows={2}
              placeholder="التوصيات الموجهة لإدارة المدرسة لتنفيذها فوراً..."
              value={inspRecommendations}
              onChange={(e) => setInspRecommendations(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsInspectionModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              حفظ واعتماد تقرير التفتيش
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Modal: Official School Credential Slip (بطاقة اعتماد وتشغيل حساب المدرسة) */}
      <Modal
        isOpen={isCredentialSlipModalOpen}
        onClose={() => setIsCredentialSlipModalOpen(false)}
        title="بطاقة اعتماد حساب المدرسة والرقم السري الرسمي"
      >
        {credentialSlipSchool && (
          <div className="space-y-4 text-slate-800 dark:text-slate-200">
            {/* Printable official container */}
            <div id="school-credential-slip-print" className="p-5 bg-gradient-to-br from-amber-50/60 via-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl border-2 border-amber-500/40 shadow-sm space-y-4">
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b-2 border-amber-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      وزارة التربية والتعليم والتعليم الفني
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                      {credentialSlipSchool.directorate} • قيادة التعليم الفني بالمحافظة
                    </p>
                  </div>
                </div>
                <div className="text-left text-[11px] text-slate-500 font-mono">
                  <span>تاريخ الاعتماد: </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date())}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <span className="inline-block bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs px-3 py-1 rounded-full font-black border border-amber-300 dark:border-amber-700">
                  إخطار رسمي: بيانات تشغيل واعتماد حساب المدرسة الفنية 🏛️
                </span>
              </div>

              {/* School Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10.5px]">اسم المنشأة التعليمية:</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {credentialSlipSchool.name}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[10.5px]">الإدارة التعليمية التابعة:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {credentialSlipSchool.administration}
                  </span>
                </div>
              </div>

              {/* Big High-Security Credentials Box */}
              <div className="bg-slate-950 text-white p-4 rounded-2xl border border-amber-500/50 shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    بيانات تسجيل الدخول لحساب المدرسة:
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    حساب معتمد نشط ✓
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">اسم المستخدم / كود الدخول:</span>
                    <span className="font-mono text-lg font-black text-amber-300 tracking-wider">
                      {credentialSlipSchool.schoolUsername || credentialSlipSchool.code}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/40">
                    <span className="text-slate-400 text-[11px] block">الرقم السري للمدرسة (PIN):</span>
                    <span className="font-mono text-2xl font-black text-emerald-400 tracking-widest">
                      {credentialSlipSchool.accessPin || credentialSlipSchool.code}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed text-center">
                  يتم الدخول عبر إدخال <strong>كود المدرسة</strong> في اسم المستخدم و<strong>الرقم السري للمدرسة</strong> في كلمة المرور.
                </p>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 bg-amber-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-amber-200/50">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">تعليمات أمنية وتشغيلية:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>يُسلم هذا الإخطار لمدير المدرسة شخصياً بموجب توقيع رسمي.</li>
                  <li>يمنح هذا الحساب صلاحيات الإدارة التنفيذية الكاملة للمدرسة ومتابعة نسب الورش 85%.</li>
                  <li>في حال فقدان الرقم السري، يمكن لقيادة المديرية إعادة ضبطه وتوليد رقم جديد فوراً.</li>
                </ul>
              </div>

              {/* Signature stamp */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <div className="text-slate-500">
                  <span>مسئول الرقابة الإلكترونية: </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">معتمد إلكترونياً</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">يعتمد مدير عام التعليم الفني:</span>
                  <span className="font-bold text-slate-900 dark:text-white">د. حسام الدين عبد القادر</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setIsCredentialSlipModalOpen(false)}
              >
                إغلاق
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  leftIcon={<Copy className="w-4 h-4 text-amber-600" />}
                  onClick={() => copySchoolCredentials(credentialSlipSchool)}
                >
                  نسخ البيانات 📋
                </Button>

                <Button
                  variant="primary"
                  type="button"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  طباعة بطاقة الاعتماد 🖨️
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {copyFeedbackText && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copyFeedbackText}</span>
        </div>
      )}
    </div>
  );
};

// Helper icon
function LayoutDashboardIcon(props: any) {
  return <TrendingUp {...props} />;
}
