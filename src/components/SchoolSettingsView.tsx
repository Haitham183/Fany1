import React, { useState } from 'react';
import { Department, SchoolClass, SchoolConfig, User, Holiday, HolidayType } from '@/types';
import {
  updateSchoolConfig,
  saveDepartment,
  deleteDepartment,
  saveClass,
  deleteClass,
  exportBackupData,
  importBackupData,
  saveHoliday,
  deleteHoliday,
  resetDefaultHolidays,
  updateAcademicCalendar,
} from '@/lib/storage';
import { pushAllDataToCloud, pullAllDataFromCloud } from '@/lib/supabaseSync';
import {
  Building2,
  Sliders,
  PlusCircle,
  Edit2,
  Trash2,
  Save,
  Check,
  Zap,
  Car,
  Snowflake,
  Cog,
  Cpu,
  Wrench,
  GraduationCap,
  Users,
  ShieldAlert,
  X,
  Phone,
  MapPin,
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  Clock,
  Layers,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RotateCcw,
  FileCheck2,
  Scale,
  Image as ImageIcon,
} from 'lucide-react';

interface SchoolSettingsViewProps {
  schoolConfig: SchoolConfig;
  departments: Department[];
  classes: SchoolClass[];
  currentUser: User;
  onSettingsSaved: () => void;
}

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  schoolConfig,
  departments,
  classes,
  currentUser,
  onSettingsSaved,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'school_info' | 'cbe_regulations' | 'departments' | 'classes' | 'calendar' | 'backup'>(
    'school_info'
  );

  // Backup & Restore State
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);
  const [backupErrorMsg, setBackupErrorMsg] = useState<string | null>(null);

  // School Config Form State
  const [formData, setFormData] = useState<SchoolConfig>({ ...schoolConfig });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState(false);

  // Academic Calendar & Holidays State
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);
  const [holidayFormName, setHolidayFormName] = useState('');
  const [holidayFormStartDate, setHolidayFormStartDate] = useState('');
  const [holidayFormEndDate, setHolidayFormEndDate] = useState('');
  const [holidayFormType, setHolidayFormType] = useState<HolidayType>('official');
  const [holidayFormDescription, setHolidayFormDescription] = useState('');
  const [holidayFormError, setHolidayFormError] = useState<string | null>(null);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({
    id: undefined,
    name: '',
    code: '',
    description: '',
    headPhone: '',
    scientificSupervisorName: '',
    practicalSupervisorName: '',
    iconName: 'Wrench',
    workshopCount: 2,
  });

  // Class Filters State
  const [classFilterShift, setClassFilterShift] = useState<'all' | 'morning' | 'evening'>('all');
  const [classFilterGrade, setClassFilterGrade] = useState<string>('all');
  const [classFilterDept, setClassFilterDept] = useState<string>('all');

  // Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState<Partial<SchoolClass>>({
    id: undefined,
    name: '',
    gradeLevel: 1,
    departmentId: departments[0]?.id || '',
    supervisorTeacherName: '',
    roomNumber: 'مبنى الورش - ورشة 1',
    shift: 'morning',
  });

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSchoolConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    updateSchoolConfig(formData);
    setTimeout(() => {
      setIsSavingConfig(false);
      setConfigSuccessMsg(true);
      onSettingsSaved();
      setTimeout(() => setConfigSuccessMsg(false), 4000);
    }, 400);
  };

  const handleOpenAddDept = () => {
    setDeptForm({
      id: undefined,
      name: '',
      code: `DEP-${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      headPhone: '',
      scientificSupervisorName: '',
      practicalSupervisorName: '',
      iconName: 'Wrench',
      workshopCount: 2,
    });
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setDeptForm({ ...dept });
    setIsDeptModalOpen(true);
  };

  const handleSaveDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || (!deptForm.scientificSupervisorName && !deptForm.practicalSupervisorName)) return;

    saveDepartment({
      id: deptForm.id,
      name: deptForm.name,
      code: deptForm.code || `DEP-${Math.floor(100 + Math.random() * 900)}`,
      description: deptForm.description || '',
      scientificSupervisorName: deptForm.scientificSupervisorName || '',
      practicalSupervisorName: deptForm.practicalSupervisorName || '',
      headPhone: deptForm.headPhone || '',
      iconName: deptForm.iconName || 'Wrench',
      workshopCount: Number(deptForm.workshopCount) || 2,
    });

    setIsDeptModalOpen(false);
    onSettingsSaved();
  };

  const handleDeleteDept = (deptId: string, deptName: string) => {
    if (confirm(`هل أنت متأكد من حذف قسم (${deptName})؟`)) {
      deleteDepartment(deptId);
      onSettingsSaved();
    }
  };

  const handleOpenAddClass = () => {
    setClassForm({
      id: undefined,
      name: '',
      gradeLevel: 1,
      departmentId: departments[0]?.id || '',
      supervisorTeacherName: '',
      roomNumber: 'مبنى الورش - ورشة 1',
      shift: 'morning',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: SchoolClass) => {
    setClassForm({
      ...cls,
      shift: cls.shift || 'morning',
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name || !classForm.departmentId) return;

    saveClass({
      id: classForm.id,
      name: classForm.name,
      gradeLevel: Number(classForm.gradeLevel) as 1 | 2 | 3 | 4 | 5,
      departmentId: classForm.departmentId,
      supervisorTeacherName: classForm.supervisorTeacherName || 'معلم الفصل المشرف',
      roomNumber: classForm.roomNumber || 'ورشة 1',
      shift: classForm.shift || 'morning',
    });

    setIsClassModalOpen(false);
    onSettingsSaved();
  };

  const handleDeleteClass = (classId: string, className: string) => {
    if (confirm(`هل أنت متأكد من حذف فصل (${className})؟`)) {
      deleteClass(classId);
      onSettingsSaved();
    }
  };

  const getDeptIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Car':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'Snowflake':
        return <Snowflake className="w-5 h-5 text-cyan-500" />;
      case 'Cog':
        return <Cog className="w-5 h-5 text-slate-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-500" />;
      default:
        return <Wrench className="w-5 h-5 text-purple-600" />;
    }
  };

  // Academic Calendar & Holidays Handlers
  const handleSaveAcademicCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateAcademicCalendar({
      term1StartDate: formData.term1StartDate,
      term1EndDate: formData.term1EndDate,
      midYearBreakStartDate: formData.midYearBreakStartDate,
      midYearBreakEndDate: formData.midYearBreakEndDate,
      term2StartDate: formData.term2StartDate,
      term2EndDate: formData.term2EndDate,
      currentTerm: formData.currentTerm,
      academicYear: formData.academicYear,
    });
    setFormData(updated);
    setCalendarSuccessMsg(true);
    onSettingsSaved();
    setTimeout(() => setCalendarSuccessMsg(false), 4000);
  };

  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayFormName('');
    setHolidayFormStartDate('');
    setHolidayFormEndDate('');
    setHolidayFormType('official');
    setHolidayFormDescription('');
    setHolidayFormError(null);
    setIsHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (hol: Holiday) => {
    setEditingHoliday(hol);
    setHolidayFormName(hol.name);
    setHolidayFormStartDate(hol.startDate);
    setHolidayFormEndDate(hol.endDate);
    setHolidayFormType(hol.type);
    setHolidayFormDescription(hol.description || '');
    setHolidayFormError(null);
    setIsHolidayModalOpen(true);
  };

  const handleSaveHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayFormName.trim()) {
      setHolidayFormError('يرجى إدخال اسم العطلة أو مناسبتها');
      return;
    }
    if (!holidayFormStartDate) {
      setHolidayFormError('يرجى تحديد تاريخ بداية العطلة');
      return;
    }
    const endDate = holidayFormEndDate || holidayFormStartDate;
    if (new Date(endDate) < new Date(holidayFormStartDate)) {
      setHolidayFormError('تاريخ نهاية العطلة يجب أن يكون مساوياً أو بعد تاريخ البداية');
      return;
    }

    const updated = saveHoliday({
      id: editingHoliday?.id,
      name: holidayFormName.trim(),
      startDate: holidayFormStartDate,
      endDate,
      type: holidayFormType,
      description: holidayFormDescription.trim(),
      isTermBreak: editingHoliday?.isTermBreak || false,
    });

    setFormData(updated);
    setIsHolidayModalOpen(false);
    onSettingsSaved();
  };

  const handleDeleteHolidayClick = (holId: string, holName: string) => {
    if (confirm(`هل أنت متأكد من حذف عطلة (${holName})؟`)) {
      const updated = deleteHoliday(holId);
      setFormData(updated);
      onSettingsSaved();
    }
  };

  const handleResetDefaultHolidaysClick = () => {
    if (confirm('هل ترغب في استعادة القائمة الرسمية المعتمدة للعطلات الرسمية لجمهورية مصر العربية؟')) {
      const updated = resetDefaultHolidays();
      setFormData(updated);
      onSettingsSaved();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> تهيئة المدرسة والأقسام للتوافق العام
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            إعدادات المدرسة، الأقسام التخصصية، والفصول
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            تحديد بيانات المدرسة وإضافة التخصصات الصناعية والفصول المسكنة وتعيين المشرفين.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-center text-xs">
          <div className="text-[10px] text-slate-300">المدرسة الحالية:</div>
          <div className="font-bold text-amber-400 text-xs">{schoolConfig.name}</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('school_info')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'school_info'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> بيانات وهوية المدرسة والمديرية
        </button>

        <button
          onClick={() => setActiveSubTab('cbe_regulations')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'cbe_regulations'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" /> لائحة الجدارات وقانون التعليم 139
        </button>

        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-amber-400" /> التقويم الدراسي والعطلات الرسمية ({formData.holidays?.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'departments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" /> الأقسام والتخصصات ورؤساء الأقسام ({departments.length})
        </button>

        <button
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'classes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> الفصول وقاعات الورش ({classes.length})
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'backup'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" /> النسخ الاحتياطي واستعادة البيانات
        </button>
      </div>

      {/* Sub Tab 1: School Info */}
      {activeSubTab === 'school_info' && (
        <form onSubmit={handleSaveSchoolConfig} className="space-y-6">
          {configSuccessMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-xl p-3.5 flex items-center gap-2 font-bold text-xs animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600" />
              تم حفظ وتحديث بيانات وهوية المدرسة بنجاح! سيتم تطبيق الاسم في كل النماذج والإنذارات.
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-amber-600" />
              البيانات الرسمية للمدرسة والإدارة التعليمية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المدرسة بالكامل *</label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleConfigChange}
                  placeholder="مثال: مدرسة المحلة الكبرى الثانوية الميكانيكية العسكرية بنين"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مديرية التربية والتعليم بمحافظة *</label>
                <input
                  type="text"
                  required
                  name="directorate"
                  value={formData.directorate}
                  onChange={handleConfigChange}
                  placeholder="مثال: مديرية التربية والتعليم بمحافظة الغربية"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإدارة التعليمية - قسم التعليم الفني *</label>
                <input
                  type="text"
                  required
                  name="administration"
                  value={formData.administration}
                  onChange={handleConfigChange}
                  placeholder="مثال: إدارة شرق المحلة التعليمية - قسم التعليم الفني الصناعي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العام الدراسي الحالي</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleConfigChange}
                  placeholder="2025 / 2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* =========================================================================
                NEW SECTION: نظام الفترات الدراسية وأيام العمل الأسبوعية
               ========================================================================= */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-amber-500/30 space-y-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">
                      نظام الفترات الدراسية وجدول أيام العمل الأسبوعية بالمدرسة
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      تحديد ما إذا كانت المدرسة تعمل فترة واحدة أو فترتين، وتحديد أيام العمل الرسمية (5 أو 6 أيام)
                    </p>
                  </div>
                </div>

                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-500/30">
                  إعدادات التشغيل المدرسي
                </span>
              </div>

              {/* 1. School Shift Selection Cards */}
              <div className="space-y-2">
                <label className="block font-bold text-xs text-amber-300">
                  1. نظام تشغيل الفترات الدراسية بالمدرسة *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Single Morning Shift */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.schoolShiftType === 'single_morning'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-xs text-white">فترة واحدة صباحية</span>
                      </div>
                      <input
                        type="radio"
                        name="schoolShiftType"
                        value="single_morning"
                        checked={formData.schoolShiftType === 'single_morning'}
                        onChange={handleConfigChange}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      طابور الصباح والحصص تبدأ صباحاً لجميع الصفوف والتخصصات.
                    </p>
                  </label>

                  {/* Two Shifts (Morning & Evening) */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.schoolShiftType === 'two_shifts'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-purple-400" />
                        <span className="font-black text-xs text-white">فترتان (صباحية ومسائية)</span>
                      </div>
                      <input
                        type="radio"
                        name="schoolShiftType"
                        value="two_shifts"
                        checked={formData.schoolShiftType === 'two_shifts'}
                        onChange={handleConfigChange}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      فترة صباحية لصفوف وفترة مسائية لصفوف أخرى أو فصول الخدمات.
                    </p>
                  </label>

                  {/* Single Extended / Full Day */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.schoolShiftType === 'single_full_day'
                        ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span className="font-black text-xs text-white">فترة ممتدة (يوم كامل)</span>
                      </div>
                      <input
                        type="radio"
                        name="schoolShiftType"
                        value="single_full_day"
                        checked={formData.schoolShiftType === 'single_full_day'}
                        onChange={handleConfigChange}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed">
                      يوم تدريبي وتطبيقي ممتد للمدارس التكنولوجية والمتقدمة ومراكز التدريب.
                    </p>
                  </label>
                </div>
              </div>

              {/* 2. Weekly Work Schedule Options */}
              <div className="space-y-2">
                <label className="block font-bold text-xs text-amber-300">
                  2. نظام أيام العمل والدراسة الأسبوعية *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Sun to Thu */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.workDaysScheme === 'sun_to_thu'
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-xs text-white">من الأحد إلى الخميس</span>
                      </div>
                      <input
                        type="radio"
                        name="workDaysScheme"
                        value="sun_to_thu"
                        checked={formData.workDaysScheme === 'sun_to_thu'}
                        onChange={handleConfigChange}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="text-[10.5px] text-emerald-300 font-bold flex items-center gap-1">
                      <span>5 أيام دراسة</span> • <span className="text-slate-400 font-normal">عطلة الجمعة والسبت</span>
                    </div>
                  </label>

                  {/* Sat to Thu */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.workDaysScheme === 'sat_to_thu'
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-xs text-white">من السبت إلى الخميس</span>
                      </div>
                      <input
                        type="radio"
                        name="workDaysScheme"
                        value="sat_to_thu"
                        checked={formData.workDaysScheme === 'sat_to_thu'}
                        onChange={handleConfigChange}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="text-[10.5px] text-emerald-300 font-bold flex items-center gap-1">
                      <span>6 أيام دراسة</span> • <span className="text-slate-400 font-normal">عطلة الجمعة فقط (ورش مكثفة)</span>
                    </div>
                  </label>

                  {/* Sat to Wed */}
                  <label
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      formData.workDaysScheme === 'sat_to_wed'
                        ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-400" />
                        <span className="font-black text-xs text-white">من السبت إلى الأربعاء</span>
                      </div>
                      <input
                        type="radio"
                        name="workDaysScheme"
                        value="sat_to_wed"
                        checked={formData.workDaysScheme === 'sat_to_wed'}
                        onChange={handleConfigChange}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="text-[10.5px] text-emerald-300 font-bold flex items-center gap-1">
                      <span>5 أيام دراسة</span> • <span className="text-slate-400 font-normal">عطلة الخميس والجمعة</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 3. Queue Times & Work Schedule Visual Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    ⏰ موعد طابور الصباح / بدء اليوم الدراسي:
                  </label>
                  <input
                    type="text"
                    name="morningQueueTime"
                    value={formData.morningQueueTime || '07:30 ص'}
                    onChange={handleConfigChange}
                    placeholder="07:30 ص"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {formData.schoolShiftType === 'two_shifts' && (
                  <div>
                    <label className="block font-bold text-purple-300 mb-1">
                      🌙 موعد طابور الفترة المسائية:
                    </label>
                    <input
                      type="text"
                      name="eveningQueueTime"
                      value={formData.eveningQueueTime || '12:30 م'}
                      onChange={handleConfigChange}
                      placeholder="12:30 م"
                      className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Visual Active Days Badge Bar */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-400">الأيام المعتمدة بالمنظومة:</span>
                <div className="flex flex-wrap items-center gap-1.5 font-bold">
                  {formData.workDaysScheme === 'sun_to_thu' && (
                    <>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأحد</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الإثنين</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الثلاثاء</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأربعاء</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الخميس</span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">الجمعة (عطلة)</span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">السبت (عطلة)</span>
                    </>
                  )}

                  {formData.workDaysScheme === 'sat_to_thu' && (
                    <>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">السبت</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأحد</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الإثنين</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الثلاثاء</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأربعاء</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الخميس</span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">الجمعة (عطلة)</span>
                    </>
                  )}

                  {formData.workDaysScheme === 'sat_to_wed' && (
                    <>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">السبت</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأحد</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الإثنين</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الثلاثاء</span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">الأربعاء</span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">الخميس (عطلة)</span>
                      <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">الجمعة (عطلة)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3 pt-3">
              <Users className="w-5 h-5 text-blue-600" />
              القيادات المدرسية والمسئولون للتوقيع على الإنذارات
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم مدير عام المدرسة *</label>
                <input
                  type="text"
                  required
                  name="managerName"
                  value={formData.managerName || ''}
                  onChange={handleConfigChange}
                  placeholder="أ / محمد عبد الله الشناوي"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اللقب الوظيفي لمدير المدرسة</label>
                <input
                  type="text"
                  name="managerTitle"
                  value={formData.managerTitle || ''}
                  onChange={handleConfigChange}
                  placeholder="مدير عام المدرسة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم وكيل شئون الطلاب *</label>
                <input
                  type="text"
                  required
                  name="studentAffairsHead"
                  value={formData.studentAffairsHead || ''}
                  onChange={handleConfigChange}
                  placeholder="أ / شريف كمال الدين مصطفى"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم مسئول شئون الطلاب وسجلات الغياب</label>
                <input
                  type="text"
                  name="studentAffairsAgent"
                  value={formData.studentAffairsAgent || ''}
                  onChange={handleConfigChange}
                  placeholder="أ / مسئول سجلات الغياب"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3 pt-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              بيانات التواصل والعنوان
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان المدرسة</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleConfigChange}
                  placeholder="شارع الجيش - المحلة الكبرى"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تليفون المدرسة</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleConfigChange}
                  placeholder="0402234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-400" />
                {isSavingConfig ? 'جارٍ الحفظ...' : 'حفظ وتحديث بيانات المدرسة'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sub Tab: CBE Regulations & Law 139 */}
      {activeSubTab === 'cbe_regulations' && (
        <form onSubmit={handleSaveSchoolConfig} className="space-y-6">
          {configSuccessMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-xl p-3.5 flex items-center gap-2 font-bold text-xs animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600" />
              تم حفظ وتحديث إعدادات وضوابط لائحة الجدارات وقانون التعليم بنجاح!
            </div>
          )}

          {/* 1. Absence & Threshold Rules */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="w-5 h-5 text-amber-600" />
              ضوابط احتساب الغياب والحد الأدنى للتنبيهات (المادة 25 - قانون 139)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="absenceOnePeriodCountsAsDay"
                    checked={formData.absenceOnePeriodCountsAsDay ?? true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, absenceOnePeriodCountsAsDay: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <div>
                    <span className="font-bold block text-slate-900">احتساب غياب الحصة الواحدة كغياب يوم كامل</span>
                    <span className="text-slate-500 text-[11px]">وفق المادة 25 من قانون التعليم 139 لسنة 1981</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الحد الأدنى لأيام الحضور الفعلية لتفعيل تنبيه النسبة</label>
                <input
                  type="number"
                  name="minDaysForAttendanceWarning"
                  value={formData.minDaysForAttendanceWarning ?? 10}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minDaysForAttendanceWarning: Number(e.target.value) }))}
                  min={1}
                  max={60}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                />
                <span className="text-[10.5px] text-slate-500">لا يتم إنذار الطالب بسبب النسبة قبل مضي هذا العدد من الأيام الفعلية</span>
              </div>
            </div>

            {/* Legal Warning Days Matrix */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 text-xs mb-3">مدد الإنذار القانوني والفصل (أيام متصلة / منفصلة):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900">الإنذار الأول</div>
                  <div>
                    <label className="block text-[10.5px] text-amber-800">متصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.continuousAbsenceDaysForWarning1 ?? 5}
                      onChange={(e) => setFormData((prev) => ({ ...prev, continuousAbsenceDaysForWarning1: Number(e.target.value) }))}
                      className="w-full bg-white border border-amber-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-amber-800">منفصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.separateAbsenceDaysForWarning1 ?? 10}
                      onChange={(e) => setFormData((prev) => ({ ...prev, separateAbsenceDaysForWarning1: Number(e.target.value) }))}
                      className="w-full bg-white border border-amber-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 space-y-2">
                  <div className="font-bold text-orange-900">الإنذار الثاني</div>
                  <div>
                    <label className="block text-[10.5px] text-orange-800">متصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.continuousAbsenceDaysForWarning2 ?? 10}
                      onChange={(e) => setFormData((prev) => ({ ...prev, continuousAbsenceDaysForWarning2: Number(e.target.value) }))}
                      className="w-full bg-white border border-orange-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-orange-800">منفصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.separateAbsenceDaysForWarning2 ?? 20}
                      onChange={(e) => setFormData((prev) => ({ ...prev, separateAbsenceDaysForWarning2: Number(e.target.value) }))}
                      className="w-full bg-white border border-orange-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-xl border border-red-200 space-y-2">
                  <div className="font-bold text-red-900">قرار الفصل القانوني</div>
                  <div>
                    <label className="block text-[10.5px] text-red-800">متصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.continuousAbsenceDaysForExpulsion ?? 15}
                      onChange={(e) => setFormData((prev) => ({ ...prev, continuousAbsenceDaysForExpulsion: Number(e.target.value) }))}
                      className="w-full bg-white border border-red-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] text-red-800">منفصل (أيام):</label>
                    <input
                      type="number"
                      value={formData.separateAbsenceDaysForExpulsion ?? 30}
                      onChange={(e) => setFormData((prev) => ({ ...prev, separateAbsenceDaysForExpulsion: Number(e.target.value) }))}
                      className="w-full bg-white border border-red-300 rounded-lg p-1 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reinstatement Fees */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 text-xs mb-3">رسوم إعادة القيد الرسمية (ج.م):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رسم إعادة القيد بسبب الغياب (ج.م)</label>
                  <input
                    type="number"
                    value={formData.reinstatementFeeAbsence ?? 25}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reinstatementFeeAbsence: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رسم إعادة القيد بسبب الرسوب (ج.م)</label>
                  <input
                    type="number"
                    value={formData.reinstatementFeeFailure ?? 35}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reinstatementFeeFailure: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Competency & Verification Settings */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 text-xs mb-3">نسب الجدارات والتحقق الداخلي:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأدنى لحضور الورش (%)</label>
                  <input
                    type="number"
                    value={formData.minWorkshopAttendanceRate ?? 85}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minWorkshopAttendanceRate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحد الأدنى للحضور النظري (%)</label>
                  <input
                    type="number"
                    value={formData.minTheoreticalAttendanceRate ?? 75}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minTheoreticalAttendanceRate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نسبة عينة التحقق الداخلي (%)</label>
                  <input
                    type="number"
                    value={formData.internalVerificationSampleRate ?? 15}
                    onChange={(e) => setFormData((prev) => ({ ...prev, internalVerificationSampleRate: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Custom Header Image URL */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-800 text-xs mb-2">ترويسة المدرسة الرسمية للمستندات والطباعة:</h4>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رابط صورة الترويسة المرفوعة (Header Image URL)</label>
                <input
                  type="text"
                  name="schoolHeaderImageUrl"
                  value={formData.schoolHeaderImageUrl || ''}
                  onChange={handleConfigChange}
                  placeholder="https://... أو مسار الصورة المرفوعة"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                />
                <span className="text-[10.5px] text-slate-500">إذا وُجدت، سيتم إدراجها أعلى كافة الشيتات والشهادات بدلاً من الترويسة النصية الافتراضية.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingConfig ? 'جارٍ الحفظ...' : 'حفظ ضوابط اللائحة وقانون التعليم'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sub Tab: Academic Calendar & Holidays */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          {calendarSuccessMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-xl p-3.5 flex items-center gap-2 font-bold text-xs animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600" />
              تم حفظ وتحديث تواريخ التقويم الدراسي بنجاح!
            </div>
          )}

          {/* 1. Academic Terms Form */}
          <form onSubmit={handleSaveAcademicCalendar} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                  تواريخ بداية ونهاية الفصول الدراسية (الترم الأول والثاني)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تحديد المدى الزمني المعتمد للدراسة ونصف العام لحساب أسابيع الحضور والغياب الرسمية.
                </p>
              </div>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" /> حفظ تواريخ التقويم الدراسي
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Term 1 Card */}
              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-blue-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>الفصل الدراسي الأول (الترم الأول)</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ بداية الدراسة *</label>
                  <input
                    type="date"
                    value={formData.term1StartDate || ''}
                    onChange={(e) => setFormData({ ...formData, term1StartDate: e.target.value })}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ نهاية الدراسة والامتحانات *</label>
                  <input
                    type="date"
                    value={formData.term1EndDate || ''}
                    onChange={(e) => setFormData({ ...formData, term1EndDate: e.target.value })}
                    className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Mid-year Break Card */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>إجازة نصف العام الدراسي</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ بداية إجازة نصف العام *</label>
                  <input
                    type="date"
                    value={formData.midYearBreakStartDate || ''}
                    onChange={(e) => setFormData({ ...formData, midYearBreakStartDate: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ نهاية إجازة نصف العام *</label>
                  <input
                    type="date"
                    value={formData.midYearBreakEndDate || ''}
                    onChange={(e) => setFormData({ ...formData, midYearBreakEndDate: e.target.value })}
                    className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Term 2 Card */}
              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <span>الفصل الدراسي الثاني (الترم الثاني)</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ بداية الدراسة *</label>
                  <input
                    type="date"
                    value={formData.term2StartDate || ''}
                    onChange={(e) => setFormData({ ...formData, term2StartDate: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">تاريخ نهاية الدراسة وامتحانات الدبلوم *</label>
                  <input
                    type="date"
                    value={formData.term2EndDate || ''}
                    onChange={(e) => setFormData({ ...formData, term2EndDate: e.target.value })}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* 2. Official and Emergency Holidays Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  العطلات الرسمية والاضطرارية (المعتمدة)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  إدارة العطلات الرسمية (الأعياد والمناسبات) والعطلات الاضطرارية (الطقس / السيول / قرارات المحافظة) — لا تحسب غياباً على الطلاب.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetDefaultHolidaysClick}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-300"
                  title="استعادة العطلات الرسمية الافتراضية لجمهورية مصر العربية"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> استعادة العطلات الرسمية لمصر
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddHoliday}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" /> إضافة عطلة جديدة (رسمية / اضطرارية)
                </button>
              </div>
            </div>

            {/* Note alert */}
            <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>تنويه نظام الحضور والغياب:</strong> أي يوم يقع ضمن تاريخ العطلات المدرجة أدناه يتم تعريفه تلقائياً كعطلة في شيت التحضير الأسبوعي وقوائم الفصول، <strong>ولا يتم احتسابه كأيام غياب</strong> للطلاب في خطابات الإنذار أو نسب الحضور والغياب المهنية (الجدارات 85%).
              </div>
            </div>

            {/* Holidays Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">م</th>
                    <th className="p-3">اسم ومناسبة العطلة</th>
                    <th className="p-3 text-center">نوع العطلة</th>
                    <th className="p-3 text-center">تاريخ البداية</th>
                    <th className="p-3 text-center">تاريخ النهاية</th>
                    <th className="p-3 text-center">المدة</th>
                    <th className="p-3">البيان / ملاحظات</th>
                    <th className="p-3 text-center w-28">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(formData.holidays || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                        لا توجد عطلات مسجلة حالياً. يمكنك النقر على &quot;استعادة العطلات الرسمية لمصر&quot; أو إضافة عطلة يدوياً.
                      </td>
                    </tr>
                  ) : (
                    (formData.holidays || []).map((hol, idx) => {
                      const start = new Date(hol.startDate);
                      const end = new Date(hol.endDate || hol.startDate);
                      const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                      return (
                        <tr key={hol.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-black text-slate-900 flex items-center gap-1.5">
                            {hol.type === 'emergency' ? (
                              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <Sun className="w-4 h-4 text-blue-600 shrink-0" />
                            )}
                            <span>{hol.name}</span>
                          </td>
                          <td className="p-3 text-center">
                            {hol.type === 'emergency' ? (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                ⚠️ عطلة اضطرارية (طقس/طوارئ)
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-900 border border-blue-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                🏛️ عطلة رسمية مجدولة
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono text-slate-700 font-bold">{hol.startDate}</td>
                          <td className="p-3 text-center font-mono text-slate-700 font-bold">{hol.endDate || hol.startDate}</td>
                          <td className="p-3 text-center font-bold text-slate-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {daysCount} {daysCount > 1 ? 'أيام' : 'يوم'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={hol.description}>
                            {hol.description || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditHoliday(hol)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                title="تعديل العطلة"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteHolidayClick(hol.id, hol.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="حذف العطلة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Sub Tab 2: Departments & Specialties Manager */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                قائمة الأقسام والتخصصات الصناعية المسجلة بالمدرسة
              </h3>
              <p className="text-xs text-slate-500">
                يمكنك إضافة تخصصات جديدة (غزل ونسيج، بتروكيماويات، طاقة متجددة، صيانة سيارات...) وتحديد بيانات رؤساء الأقسام.
              </p>
            </div>

            <button
              onClick={handleOpenAddDept}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> إضافة تخصص / قسم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200 shadow-2xs hover:shadow-sm hover:border-purple-300 transition flex flex-col justify-between space-y-2 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {getDeptIcon(dept.iconName)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate" title={dept.name}>
                        {dept.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded inline-block">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditDept(dept)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="تعديل بيانات القسم"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Brief description */}
                {dept.description && (
                  <p className="text-[10.5px] text-slate-500 line-clamp-1 leading-snug" title={dept.description}>
                    {dept.description}
                  </p>
                )}

                {/* Compact Info Footer */}
                <div className="bg-slate-50/80 rounded-lg p-2 text-[11px] space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between gap-1 text-slate-700">
                    <span className="text-blue-700 font-bold shrink-0 text-[10px]">مشرف العلمي (نظري):</span>
                    <strong className="text-slate-900 truncate font-semibold text-[10.5px]">
                      {dept.scientificSupervisorName || 'غير محدد'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-slate-700">
                    <span className="text-emerald-700 font-bold shrink-0 text-[10px]">مشرف العملي (ورش):</span>
                    <strong className="text-slate-900 truncate font-semibold text-[10.5px]">
                      {dept.practicalSupervisorName || 'غير محدد'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-slate-200/60">
                    <span className="text-purple-700 font-bold">{dept.workshopCount || 2} ورش تدريبية</span>
                    {dept.headPhone ? (
                      <span className="font-mono text-slate-600 truncate">{dept.headPhone}</span>
                    ) : (
                      <span className="text-slate-400">تخصص معتمد</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Tab 3: Classes Manager */}
      {activeSubTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span>فصول المدرسة وقاعات الورش المسكنة</span>
                {formData.schoolShiftType === 'two_shifts' && (
                  <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    نظام فترتين (صباحي / مسائي)
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                إضافة وتعديل فصول الصفوف الدراسية يدوياً وتحديد تخصصاتها وقاعات تدريبها والفترة الدراسية (صباحية / مسائية).
              </p>
            </div>

            <button
              onClick={handleOpenAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <PlusCircle className="w-4 h-4" /> إضافة فصل / ورشة جديدة
            </button>
          </div>

          {/* Shift Notice Banner if Two Shifts */}
          {formData.schoolShiftType === 'two_shifts' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-purple-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>تنبيه الفترات:</strong> المدرسة تعمل بنظام <strong>فترتين دراسيتين</strong> (صباحية ومسائية). يتم تحديد فترة كل فصل عند إنشائه أو تعديله لفرز الجداول والإحصاء تلقائياً.
                </span>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Shift Filter */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-600">الفترة:</span>
                <select
                  value={classFilterShift}
                  onChange={(e) => setClassFilterShift(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">جميع الفترات (الصباحية والمسائية)</option>
                  <option value="morning">☀️ الفترة الصباحية فقط</option>
                  <option value="evening">🌙 الفترة المسائية فقط</option>
                </select>
              </div>

              {/* Grade Filter */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-600">الصف:</span>
                <select
                  value={classFilterGrade}
                  onChange={(e) => setClassFilterGrade(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">جميع الصفوف الدراسية</option>
                  <option value="1">الصف الأول الصناعي</option>
                  <option value="2">الصف الثاني الصناعي</option>
                  <option value="3">الصف الثالث الصناعي (دبلوم)</option>
                  {formData.schoolSystemType !== '3_years' && (
                    <>
                      <option value="4">الفرقة الرابعة المتقدمة</option>
                      <option value="5">الفرقة الخامسة المتقدمة</option>
                    </>
                  )}
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-600">القسم:</span>
                <select
                  value={classFilterDept}
                  onChange={(e) => setClassFilterDept(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">جميع التخصصات</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-slate-500 font-bold">
              إجمالي الفصول المطابقة: <strong className="text-blue-900 font-black">{
                classes.filter((cls) => {
                  if (classFilterShift !== 'all' && (cls.shift || 'morning') !== classFilterShift) return false;
                  if (classFilterGrade !== 'all' && cls.gradeLevel.toString() !== classFilterGrade) return false;
                  if (classFilterDept !== 'all' && cls.departmentId !== classFilterDept) return false;
                  return true;
                }).length
              }</strong> فصل
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes
              .filter((cls) => {
                if (classFilterShift !== 'all' && (cls.shift || 'morning') !== classFilterShift) return false;
                if (classFilterGrade !== 'all' && cls.gradeLevel.toString() !== classFilterGrade) return false;
                if (classFilterDept !== 'all' && cls.departmentId !== classFilterDept) return false;
                return true;
              })
              .map((cls) => {
                const isEvening = cls.shift === 'evening';
                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900 text-sm">{cls.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 ${
                              isEvening
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {isEvening ? <Moon className="w-3 h-3 text-purple-700" /> : <Sun className="w-3 h-3 text-amber-700" />}
                            <span>{isEvening ? 'فترة مسائية' : 'فترة صباحية'}</span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-0.5">{cls.gradeName}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          title="تعديل بيانات الفصل والفترة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="حذف الفصل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">التخصص:</span>
                        <span className="font-bold text-slate-800">{cls.departmentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المكان / الورشة:</span>
                        <span className="font-medium text-slate-800">{cls.roomNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المعلم المشرف:</span>
                        <span className="font-medium text-slate-800">{cls.supervisorTeacherName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Sub Tab 4: Backup & Restore (1-Click Database Package) */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Notifications */}
          {backupSuccessMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-2xl p-4 flex items-center gap-3 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{backupSuccessMsg}</span>
            </div>
          )}

          {backupErrorMsg && (
            <div className="bg-red-50 border-2 border-red-500 text-red-900 rounded-2xl p-4 flex items-center gap-3 font-bold text-xs">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{backupErrorMsg}</span>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    نظام النسخ الاحتياطي واستعادة البيانات بضغطة زر (1-Click Backup & Restore)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    حفظ نسخة كاملة من قاعدة بيانات المدرسة (الطلاب، الأقسام، الفصول، الحضور، الإنذارات، الجدارات، ومخالفات الورش) واسترجاعها بأمان تام.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 0. Cloud Sync Multi-Device Status Card */}
              <div className="md:col-span-2 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 rounded-2xl p-5 border border-blue-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-sm">المزامنة والتشغيل السحابي متعدد الأجهزة (Multi-Device Cloud)</h4>
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          المزامنة التلقائية اللحظية مفعلة 🟢
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        أي تغيير أو رصد حضور أو تعديل بيانات يتم حفظه ومزامنته سحابياً وتلقائياً عبر جميع هواتف وحواسب المعلمين والإدارة دون الحاجة للضغط على أي زر.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setBackupSuccessMsg('جارٍ رفع ومزامنة كافة البيانات مع السحابة...');
                        const res = await pushAllDataToCloud();
                        if (res.success) {
                          setBackupSuccessMsg(res.message);
                        } else {
                          setBackupErrorMsg(res.message);
                        }
                        setTimeout(() => {
                          setBackupSuccessMsg(null);
                          setBackupErrorMsg(null);
                        }, 5000);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع البيانات للسحابة (Push)</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setBackupSuccessMsg('جارٍ جلب وتحديث البيانات من السحابة...');
                        const res = await pullAllDataFromCloud();
                        if (res.success) {
                          setBackupSuccessMsg(res.message);
                          onSettingsSaved();
                        } else {
                          setBackupErrorMsg(res.message);
                        }
                        setTimeout(() => {
                          setBackupSuccessMsg(null);
                          setBackupErrorMsg(null);
                        }, 5000);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 font-black px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>جلب البيانات من السحابة (Pull)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span>✨ <strong>قاعدة البيانات المركزية متصلة:</strong> أي تغيير تقوم به يمكنك رفعه بضغطة زر، وسيظهر في كل الأجهزة المتصلة.</span>
                </div>
              </div>

              {/* 1. Export Backup Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>تصدير وحفظ نسخة احتياطية (.json)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يقوم النظام بتجميع كافة الجداول والسجلات المدرسية في حزمة بيانات مشفرة ومنسقة (JSON) معتمدة للتنزيل المباشر على جهازك.
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                    <div>• يشمل ملفات وإعدادات المدرسة: <strong className="text-slate-800">{schoolConfig.name}</strong></div>
                    <div>• يشمل عدد الطلاب: <strong className="text-slate-800">{classes.reduce((acc, c) => acc + (c.studentCount || 0), 0) || 'جميع الطلاب'}</strong></div>
                    <div>• يشمل سجلات وحدات الجدارات والتقييمات بالكامل</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const backupPkg = exportBackupData();
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPkg, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute(
                      'download',
                      `نسخة_احتياطية_${schoolConfig.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
                    );
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();

                    setBackupSuccessMsg('تم تصدير وتنزيل النسخة الاحتياطية بنجاح تام! يرجى حفظها في مكان آمن.');
                    setTimeout(() => setBackupSuccessMsg(null), 5000);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير النسخة الاحتياطية الشاملة الآن</span>
                </button>
              </div>

              {/* 2. Import Backup Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>استعادة قاعدة البيانات من ملف نسخة سابقة</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    رفع ملف نسخة احتياطية (.json) تم تصديره سابقاً لاسترجاع كافة الطلاب وسجلات الحضور والإنذارات والجدارات فورياً.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed">
                    <strong>تنبيه هام:</strong> استعادة النسخة الاحتياطية ستقوم بمزامنة قاعدة البيانات وتحديث الجداول تلقائياً للمطابقة مع ملف النسخة.
                  </div>
                </div>

                <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-center">
                  <Upload className="w-4 h-4" />
                  <span>اختيار ملف النسخة الاحتياطية (.json) للاستعادة</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const result = importBackupData(event.target?.result as string);
                          if (result.success) {
                            setBackupSuccessMsg('تم استعادة قاعدة البيانات وتحديث كافة الجداول بنجاح تام!');
                            setBackupErrorMsg(null);
                            onSettingsSaved();
                            setTimeout(() => setBackupSuccessMsg(null), 5000);
                          } else {
                            setBackupErrorMsg(result.message || 'فشل في استعادة النسخة الاحتياطية');
                          }
                        } catch (err) {
                          setBackupErrorMsg('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 3. Factory Reset / New School Wipe */}
              <div className="md:col-span-2 bg-red-50/50 rounded-2xl p-5 border border-red-200 space-y-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 font-black text-red-950 text-sm">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>تصفير وتفريغ النظام لبدء مدرسة جديدة بالكامل (Factory Reset)</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    مسح كافة البيانات التجريبية وسجلات الطلاب والغياب والإنذارات والورش لبدء استخدام المنظومة في مدرسة جديدة خالية من أي بيانات سابقة.
                    (يبقى حساب المدير العام متاحاً باسم: <strong className="font-mono">admin</strong> وكلمة المرور: <strong className="font-mono">123</strong>).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      'تحذير هام:\nهل أنت متأكد تماماً من رغبتك في تفريغ قاعدة البيانات وتصفير كافة السجلات التجريبية لمدرسة جديدة؟\nلا يمكن التراجع عن هذا الإجراء إلا باستعادة نسخة احتياطية سابقة.'
                    );
                    if (confirmed) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>تصفير النظام وتفريغ كافة البيانات الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Add/Edit Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Wrench className="w-4 h-4 text-purple-400" />
                {deptForm.id ? 'تعديل بيانات التخصص / القسم' : 'إضافة تخصص وقسم صناعي جديد'}
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeptSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القسم / التخصص الصناعي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قسم الغزل والنسيج والتريكو الآلي"
                  value={deptForm.name || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود التخصص</label>
                  <input
                    type="text"
                    placeholder="TEX-106"
                    value={deptForm.code || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عدد الورش المجهزة</label>
                  <input
                    type="number"
                    min={1}
                    value={deptForm.workshopCount || 2}
                    onChange={(e) => setDeptForm({ ...deptForm, workshopCount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Supervisors: Scientific & Practical (No Head of Dept) */}
              <div className="space-y-3 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
                <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-700" />
                  <span>مشرفو التخصص (القسم العلمي والعملي) *</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-xs">
                      مشرف القسم العلمي (المواد الفنية والنظرية) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="أ / إبراهيم خليل محمد"
                      value={deptForm.scientificSupervisorName || ''}
                      onChange={(e) => setDeptForm({ ...deptForm, scientificSupervisorName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-xs">
                      مشرف القسم العملي (التدريب والورش والجدارات) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="م / أشرف عبد الفتاح رضوان"
                      value={deptForm.practicalSupervisorName || ''}
                      onChange={(e) => setDeptForm({ ...deptForm, practicalSupervisorName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف التواصل للتخصص (اختياري)</label>
                <input
                  type="tel"
                  placeholder="010xxxxxxxx"
                  value={deptForm.headPhone || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, headPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نبذة عن التخصص وأهدافه التدريبية</label>
                <textarea
                  rows={2}
                  placeholder="تدريب الطلاب على تشغيل ماكينات النسيج الحديثة وضبط جودة الخيوط..."
                  value={deptForm.description || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ التخصص
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Add/Edit Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                {classForm.id ? 'تعديل بيانات الفصل' : 'إضافة فصل / ورشة جديدة'}
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClassSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الفصل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1 / 2 غزل ونسيج"
                  value={classForm.name || ''}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الصف الدراسي *</label>
                  <select
                    value={classForm.gradeLevel || 1}
                    onChange={(e) => setClassForm({ ...classForm, gradeLevel: Number(e.target.value) as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={1}>الصف الأول الصناعي</option>
                    <option value={2}>الصف الثاني الصناعي</option>
                    <option value={3}>الصف الثالث الصناعي (دبلوم)</option>
                    {formData.schoolSystemType !== '3_years' && (
                      <>
                        <option value={4}>الفرقة الرابعة المتقدمة</option>
                        <option value={5}>الفرقة الخامسة المتقدمة</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم والتخصص *</label>
                  <select
                    value={classForm.departmentId || departments[0]?.id}
                    onChange={(e) => setClassForm({ ...classForm, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shift Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>الفترة الدراسية للفصل *</span>
                  {formData.schoolShiftType === 'two_shifts' ? (
                    <span className="text-[10.5px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      ⚡ المدرسة تعمل بنظام فترتين
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-slate-500 font-medium">
                      (فترة الدراسة لهذا الفصل)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, shift: 'morning' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      (classForm.shift || 'morning') === 'morning'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm ring-2 ring-amber-400 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-950" />
                    <span>☀️ الفترة الصباحية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassForm({ ...classForm, shift: 'evening' })}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      classForm.shift === 'evening'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-400 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-purple-200" />
                    <span>🌙 الفترة المسائية</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المعلم / مدرب الورشة المشرف</label>
                <input
                  type="text"
                  placeholder="م / حسام حسن"
                  value={classForm.supervisorTeacherName || ''}
                  onChange={(e) => setClassForm({ ...classForm, supervisorTeacherName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مقر الورشة أو القاعة</label>
                <input
                  type="text"
                  placeholder="مبنى الورش - ورشة 3"
                  value={classForm.roomNumber || ''}
                  onChange={(e) => setClassForm({ ...classForm, roomNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ الفصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holiday Add / Edit Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                {editingHoliday ? 'تعديل بيانات العطلة' : 'إضافة عطلة رسمية أو اضطرارية جديدة'}
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHolidaySubmit} className="p-5 space-y-3.5 text-xs">
              {holidayFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  {holidayFormError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم ومناسبة العطلة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ذكرى نصر 6 أكتوبر / سوء الأحوال الجوية والسيول"
                  value={holidayFormName}
                  onChange={(e) => setHolidayFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Holiday Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع العطلة *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHolidayFormType('official')}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      holidayFormType === 'official'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>🏛️ عطلة رسمية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHolidayFormType('emergency')}
                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      holidayFormType === 'emergency'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>⚠️ عطلة اضطرارية (طقس/طوارئ)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ البداية *</label>
                  <input
                    type="date"
                    required
                    value={holidayFormStartDate}
                    onChange={(e) => {
                      setHolidayFormStartDate(e.target.value);
                      if (!holidayFormEndDate) setHolidayFormEndDate(e.target.value);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ النهاية *</label>
                  <input
                    type="date"
                    required
                    value={holidayFormEndDate}
                    onChange={(e) => setHolidayFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">السبب / قرار المحافظة أو الوزارة (اختياري)</label>
                <textarea
                  rows={2}
                  placeholder="مثال: بناءً على قرار السيد المحافظ بتعطيل الدراسة لسوء الأحوال الجوية..."
                  value={holidayFormDescription}
                  onChange={(e) => setHolidayFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black shadow-md cursor-pointer"
                >
                  حفظ العطلة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
