'use client';

import React, { useState } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  AttendanceRecord,
  User,
  AttendanceStatus,
  StudentTransferLog,
} from '@/types';
import {
  approveStudentExcuse,
  addStudent,
  updateStudent,
  deleteStudent,
  transferStudent,
  getTransferLogs,
  getSchoolConfig,
  autoFixSwappedStudentFields,
  checkStudentDuplicate,
} from '@/lib/storage';
import { generateParentAccessCode } from '@/lib/migration';
import { computeWeekDays } from '@/components/TeacherAttendanceTaker';
import {
  Users,
  Calendar,
  Search,
  FileSpreadsheet,
  PlusCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  XCircle,
  Filter,
  Check,
  Building,
  UserPlus,
  Phone,
  FileCheck2,
  X,
  AlertCircle,
  ArrowRightLeft,
  Edit2,
  Trash2,
  History,
  GraduationCap,
  Upload,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  Copy,
  RefreshCw,
  Wrench,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ExcelImportModal } from '@/components/ExcelImportModal';

interface StudentAffairsViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onDataChanged: () => void;
  onNavigateToReport?: (studentId: string) => void;
}

export const StudentAffairsView: React.FC<StudentAffairsViewProps> = ({
  students,
  classes,
  departments,
  attendance,
  currentUser,
  onDataChanged,
  onNavigateToReport,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly_sheet' | 'student_roster' | 'excuses' | 'transfers'>(
    'weekly_sheet'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedWarningFilter, setSelectedWarningFilter] = useState<string>('all');
  const [rosterViewMode, setRosterViewMode] = useState<'cards' | 'table'>('cards');

  // Add / Edit Student Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormName, setStudentFormName] = useState('');
  const [studentFormNationalId, setStudentFormNationalId] = useState('');
  const [studentFormCode, setStudentFormCode] = useState('');
  const [studentFormParentCode, setStudentFormParentCode] = useState('');
  const [studentFormClassId, setStudentFormClassId] = useState(classes[0]?.id || '');
  const [studentFormGuardian, setStudentFormGuardian] = useState('');
  const [studentFormPhone, setStudentFormPhone] = useState('');
  const [studentFormAddress, setStudentFormAddress] = useState('');
  const [studentFormStatus, setStudentFormStatus] = useState<any>('منتظم');
  const [studentFormError, setStudentFormError] = useState<string | null>(null);
  const [copiedCodeStudentId, setCopiedCodeStudentId] = useState<string | null>(null);

  // Transfer Student Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [targetDeptId, setTargetDeptId] = useState<string>(departments[0]?.id || '');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('بناءً على طلب ولي الأمر وتنسيق الأقسام المدرسية');

  // Excuse Modal State
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState<boolean>(false);
  const [selectedStudentForExcuse, setSelectedStudentForExcuse] = useState<Student | null>(null);
  const [excuseDate, setExcuseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [excuseReason, setExcuseReason] = useState<string>('عذر طبي معتمد من التأمين الصحي للطلاب (نموذج 2 كشف)');

  // Excel Import Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [repairAlert, setRepairAlert] = useState<string | null>(null);

  const handleAutoFixExisting = () => {
    const res = autoFixSwappedStudentFields();
    if (res.fixedCount > 0) {
      setRepairAlert(`تم بنجاح تصحيح واستعادة بيانات (${res.fixedCount}) طالب تم استيرادها سابقاً بشكل معكوس!`);
      onDataChanged();
      setTimeout(() => setRepairAlert(null), 6000);
    } else {
      setRepairAlert('جميع بيانات الطلاب الحالية سليمة ومتطابقة ولا يوجد أي تضارب.');
      setTimeout(() => setRepairAlert(null), 4000);
    }
  };

  const schoolConfig = getSchoolConfig();
  const classStudents = students
    .filter((s) => s.classId === selectedClassId)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base' }));
  const transferLogs = getTransferLogs();

  // Live duplicate check for the student form
  const liveDuplicateCheck = isStudentModalOpen
    ? checkStudentDuplicate(
        {
          fullName: studentFormName,
          nationalId: studentFormNationalId,
          studentCode: studentFormCode,
          id: editingStudent?.id,
        },
        students
      )
    : { hasDuplicate: false };

  // Classes filtered for target department in transfer modal
  const targetAvailableClasses = classes.filter((c) => c.departmentId === targetDeptId);

  // Dynamic Weekdays computed from school config
  const weekDayInfos = computeWeekDays(anchorDate, schoolConfig.workDaysScheme || 'sun_to_thu', schoolConfig);
  const weekDays = weekDayInfos.map((d) => ({
    label: d.dayOfWeek,
    date: d.date,
    isHoliday: d.isHoliday,
    holidayName: d.holidayName,
  }));

  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);
    setAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
    setAnchorDate(next);
  };

  const handleCurrentWeek = () => {
    setAnchorDate(new Date());
  };

  const getAttendanceOnDate = (studentId: string, date: string): AttendanceStatus | 'unrecorded' => {
    const rec = attendance.find((a) => a.studentId === studentId && a.date === date);
    return rec ? rec.status : 'unrecorded';
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentFormName('');
    setStudentFormNationalId('');
    setStudentFormCode(String(Date.now()).slice(-8));
    setStudentFormParentCode(generateParentAccessCode());
    setStudentFormClassId(classes[0]?.id || '');
    setStudentFormGuardian('');
    setStudentFormPhone('');
    setStudentFormAddress('');
    setStudentFormStatus('منتظم');
    setStudentFormError(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentFormName(student.fullName);
    setStudentFormNationalId(student.nationalId);
    setStudentFormCode(student.studentCode);
    setStudentFormParentCode(student.parentAccessCode || generateParentAccessCode());
    setStudentFormClassId(student.classId);
    setStudentFormGuardian(student.guardianName);
    setStudentFormPhone(student.guardianPhone);
    setStudentFormAddress(student.address);
    setStudentFormStatus(student.status);
    setStudentFormError(null);
    setIsStudentModalOpen(true);
  };

  const handleCopySecretCode = (studentId: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeStudentId(studentId);
    setTimeout(() => setCopiedCodeStudentId(null), 2500);
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError(null);

    if (!studentFormName || !studentFormNationalId || !studentFormClassId) {
      setStudentFormError('يرجى ملء كافة الحقول الأساسية المطلوبة');
      return;
    }

    if (liveDuplicateCheck.hasDuplicate) {
      setStudentFormError(liveDuplicateCheck.message || 'بيانات الطالب مكررة بالفعل في المدرسة');
      return;
    }

    const targetClass = classes.find((c) => c.id === studentFormClassId);
    const resolvedParentCode = (studentFormParentCode.trim().toUpperCase() || generateParentAccessCode());

    try {
      if (editingStudent) {
        updateStudent({
          ...editingStudent,
          fullName: studentFormName.trim(),
          nationalId: studentFormNationalId.trim(),
          studentCode: studentFormCode.trim(),
          parentAccessCode: resolvedParentCode,
          classId: studentFormClassId,
          departmentId: targetClass?.departmentId || editingStudent.departmentId,
          gradeLevel: targetClass?.gradeLevel || editingStudent.gradeLevel,
          guardianName: studentFormGuardian.trim() || 'ولي أمر الطالب',
          guardianPhone: studentFormPhone.trim() || '01000000000',
          address: studentFormAddress.trim() || 'القاهرة',
          status: studentFormStatus,
        });
      } else {
        addStudent({
          fullName: studentFormName.trim(),
          nationalId: studentFormNationalId.trim(),
          studentCode: studentFormCode.trim() || String(Date.now()).slice(-8),
          parentAccessCode: resolvedParentCode,
          classId: studentFormClassId,
          departmentId: targetClass?.departmentId || departments[0]?.id || '',
          gradeLevel: targetClass?.gradeLevel || 1,
          guardianName: studentFormGuardian.trim() || 'ولي أمر الطالب',
          guardianPhone: studentFormPhone.trim() || '01000000000',
          guardianJob: 'موظف',
          address: studentFormAddress.trim() || 'القاهرة',
          status: studentFormStatus,
          enrollmentDate: new Date().toISOString().split('T')[0],
          birthDate: '2008-01-01',
        });
      }

      setIsStudentModalOpen(false);
      onDataChanged();
    } catch (err: any) {
      setStudentFormError(err.message || 'حدث خطأ أثناء حفظ بيانات الطالب');
    }
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب (${name}) وجميع سجلاته نهائياً؟`)) {
      deleteStudent(studentId);
      onDataChanged();
    }
  };

  // Open Transfer Modal
  const handleOpenTransfer = (student: Student) => {
    setTransferringStudent(student);
    setTargetDeptId(student.departmentId);
    const available = classes.filter((c) => c.departmentId === student.departmentId);
    setTargetClassId(available.find((c) => c.id !== student.classId)?.id || available[0]?.id || '');
    setTransferReason('بناءً على طلب ولي الأمر وتنسيق شئون الطلاب');
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent || !targetClassId || !targetDeptId) return;

    transferStudent(
      transferringStudent.id,
      targetDeptId,
      targetClassId,
      transferReason,
      currentUser.name
    );

    setIsTransferModalOpen(false);
    onDataChanged();
  };

  const handleApproveExcuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForExcuse) return;

    approveStudentExcuse(
      selectedStudentForExcuse.id,
      excuseDate,
      excuseReason,
      currentUser.name
    );

    setIsExcuseModalOpen(false);
    onDataChanged();
  };

  // Filtered Students Roster
  const filteredRoster = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nationalId.includes(searchQuery) ||
      s.studentCode.includes(searchQuery);

    const matchesDept =
      selectedDeptFilter === 'all' || s.departmentId === selectedDeptFilter;

    const matchesWarning =
      selectedWarningFilter === 'all'
        ? true
        : selectedWarningFilter === 'clean'
        ? s.warningLevel === 0
        : selectedWarningFilter === 'warning_1'
        ? s.warningLevel === 1
        : selectedWarningFilter === 'warning_2'
        ? s.warningLevel === 2
        : selectedWarningFilter === 'expulsion'
        ? s.warningLevel === 3
        : true;

    return matchesSearch && matchesDept && matchesWarning;
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base' }));

  const exportToCSV = () => {
    const headers = ['كود الطالب', 'الاسم بالكامل', 'الرقم القومي', 'الفصل', 'القسم', 'أيام الغياب', 'حالة الإنذار', 'تليفون ولي الأمر'];
    const rows = filteredRoster.map((s) => {
      const cls = classes.find((c) => c.id === s.classId)?.name || '';
      const dept = departments.find((d) => d.id === s.departmentId)?.name || '';
      const warning = s.warningLevel === 3 ? 'فصل' : s.warningLevel === 2 ? 'إنذار ثان' : s.warningLevel === 1 ? 'إنذار أول' : 'منتظم';
      return [s.studentCode, s.fullName, s.nationalId, cls, dept, s.totalAbsenceDays, warning, s.guardianPhone];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `شيت_شئون_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 shadow-md border border-blue-700/50 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-400/30 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> قسم شئون الطلاب والامتحانات
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            إدارة الطلاب، الشيت الأسبوعي، ونقل وتسكين التخصصات
          </h2>
          <p className="text-[11px] text-blue-100 max-w-2xl leading-relaxed">
            إضافة وحذف ونقل الطلاب بين الفصول والتخصصات الصناعية، ومتابعة شيت الغياب الأسبوعي.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoFixExisting}
            className="bg-purple-600/80 hover:bg-purple-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer border border-purple-400/30"
            title="إصلاح مواضع الأسماء والأكواد والأرقام القومية إذا تم استيرادها سابقاً بشكل معكوس"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> إصلاح البيانات المعكوسة
          </button>
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> استيراد إكسيل
          </button>
          <button
            onClick={handleOpenAddStudent}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> إضافة طالب
          </button>
          <button
            onClick={exportToCSV}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> تصدير
          </button>
        </div>
      </div>

      {repairAlert && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 text-xs font-bold text-emerald-950 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{repairAlert}</span>
          </div>
          <button onClick={() => setRepairAlert(null)} className="text-emerald-700 font-bold p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('weekly_sheet')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'weekly_sheet'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" /> شيت الغياب الأسبوعي للفصل
        </button>

        <button
          onClick={() => setActiveTab('student_roster')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'student_roster'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" /> سجل وقوائم الطلاب ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('excuses')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'excuses'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-indigo-400" /> اعتماد وتعديل الأعذار الطبية
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'transfers'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <History className="w-4 h-4 text-purple-400" /> سجل التحويلات بين الفصول ({transferLogs.length})
        </button>
      </div>

      {/* Tab 1: Weekly Attendance Sheet */}
      {activeTab === 'weekly_sheet' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">الفصل:</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - ({cls.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Week Navigation Controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={handleNextWeek}
                  className="p-1.5 hover:bg-white rounded-lg transition text-slate-700 cursor-pointer"
                  title="الأسبوع التالي"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCurrentWeek}
                  className="px-2.5 py-1 bg-white shadow-2xs rounded-lg font-bold text-slate-900 cursor-pointer"
                >
                  الأسبوع الحالي ({weekDays[0]?.date} إلى {weekDays[weekDays.length - 1]?.date})
                </button>
                <button
                  onClick={handlePrevWeek}
                  className="p-1.5 hover:bg-white rounded-lg transition text-slate-700 cursor-pointer"
                  title="الأسبوع السابق"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> حاضر (ح)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> غائب (غ)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> متأخر (ت)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> معذور (ع)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="p-3 border-l border-slate-800 text-center w-12">م</th>
                  <th className="p-3 border-l border-slate-800">اسم الطالب</th>
                  <th className="p-3 border-l border-slate-800 text-center w-28">كود الطالب</th>
                  {weekDays.map((d) => (
                    <th key={d.date} className={`p-2.5 border-l border-slate-800 text-center w-24 ${d.isHoliday ? 'bg-amber-950/80 text-amber-300' : ''}`}>
                      <div>{d.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{d.date.slice(5)}</div>
                      {d.isHoliday && (
                        <div className="text-[9px] bg-amber-500/30 text-amber-200 border border-amber-500/40 px-1 py-0.2 rounded mt-0.5 truncate max-w-[80px] mx-auto font-bold" title={d.holidayName}>
                          🏖️ {d.holidayName || 'عطلة'}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="p-3 border-l border-slate-800 text-center w-24">غياب الأسبوع</th>
                  <th className="p-3 text-center w-28">حالة الإنذار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classStudents.map((std, idx) => {
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 border-l border-slate-100 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-l border-slate-100 font-bold text-slate-900">
                        {std.fullName}
                      </td>
                      <td className="p-3 border-l border-slate-100 text-center font-mono text-slate-600">
                        {std.studentCode}
                      </td>

                      {weekDays.map((d) => {
                        const status = getAttendanceOnDate(std.id, d.date);
                        let cell = <span className="text-slate-300 font-mono text-xs">-</span>;

                        if (status === 'present') {
                          cell = (
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-[11px] border border-emerald-300">
                              ح
                            </span>
                          );
                        } else if (status === 'absent') {
                          cell = (
                            <span className="w-6 h-6 rounded-full bg-red-100 text-red-800 font-bold flex items-center justify-center mx-auto text-[11px] border border-red-300 shadow-2xs">
                              غ
                            </span>
                          );
                        } else if (status === 'late') {
                          cell = (
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center mx-auto text-[11px] border border-amber-300">
                              ت
                            </span>
                          );
                        } else if (status === 'excused') {
                          cell = (
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center mx-auto text-[11px] border border-blue-300">
                              ع
                            </span>
                          );
                        }

                        return (
                          <td key={d.date} className="p-2 border-l border-slate-100 text-center">
                            {cell}
                          </td>
                        );
                      })}

                      <td className="p-3 border-l border-slate-100 text-center font-bold">
                        <span className={std.totalAbsenceDays > 4 ? 'text-red-600 font-black' : 'text-slate-700'}>
                          {std.totalAbsenceDays} يوم
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {std.warningLevel === 3 ? (
                          <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-300">
                            فصل
                          </span>
                        ) : std.warningLevel === 2 ? (
                          <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-orange-300">
                            إنذار 2
                          </span>
                        ) : std.warningLevel === 1 ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-300">
                            إنذار 1
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[10px] font-semibold">منتظم</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Students Roster with Transfer, Edit, Delete */}
      {activeTab === 'student_roster' && (
        <div className="space-y-3">
          {/* Top Control Ribbon */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم الطالب، الرقم القومي، كود الطالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كل الأقسام والتخصصات</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedWarningFilter}
                onChange={(e) => setSelectedWarningFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كل حالات الغياب</option>
                <option value="clean">منتظمون (بدون إنذارات)</option>
                <option value="warning_1">الإنذار الأول (5+ يوم)</option>
                <option value="warning_2">الإنذار الثاني (10+ يوم)</option>
                <option value="expulsion">قرارات الفصل (15+ يوم)</option>
              </select>

              {/* View Mode Toggle & Count */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRosterViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    rosterViewMode === 'cards'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="عرض الكروت المدمجة"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRosterViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    rosterViewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="عرض الجدول المباشر"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                {filteredRoster.length} طالب
              </span>
            </div>
          </div>

          {/* Cards View (Ultra-compact & high density) */}
          {rosterViewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredRoster.map((student) => {
                const studentClass = classes.find((c) => c.id === student.classId);
                const studentDept = departments.find((d) => d.id === student.departmentId);

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs hover:shadow-sm hover:border-blue-300 transition flex flex-col justify-between gap-2"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={student.fullName}>
                            {student.fullName}
                          </h4>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5 truncate">
                            <span>كود: {student.studentCode}</span>
                            <span>|</span>
                            <span>ق: {student.nationalId}</span>
                          </div>
                          {/* 2FA Secret Access Code Badge */}
                          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200/80 rounded-md px-1.5 py-0.5 mt-1 text-[10px]">
                            <div className="flex items-center gap-1 font-mono font-bold text-indigo-950">
                              <KeyRound className="w-3 h-3 text-indigo-600" />
                              <span>كود 2FA:</span>
                              <span className="bg-white px-1 rounded border border-indigo-300 text-indigo-700 font-black">
                                {student.parentAccessCode || 'DEMO12'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopySecretCode(student.id, student.parentAccessCode || 'DEMO12')}
                              className="text-[9.5px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-0.5 px-1 rounded hover:bg-indigo-100 transition cursor-pointer"
                              title="نسخ كود الدخول السري لولي الأمر"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{copiedCodeStudentId === student.id ? 'تم النسخ!' : 'نسخ'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center shrink-0">
                          <button
                            onClick={() => handleOpenEditStudent(student)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            title="تعديل بيانات الطالب وتحديث الكود السري"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id, student.fullName)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Concise Info Strip */}
                      <div className="mt-1.5 bg-slate-50 rounded-lg p-1.5 text-[11px] text-slate-600 space-y-1 border border-slate-100">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="truncate">
                            <span className="text-slate-400 text-[10px]">فصل: </span>
                            <span className="font-bold text-slate-800">{studentClass?.name || '—'}</span>
                          </div>
                          <div className="truncate text-left">
                            <span className="text-slate-400 text-[10px]">قسم: </span>
                            <span className="font-medium text-slate-800" title={studentDept?.name}>
                              {studentDept?.name || 'عام'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1 pt-0.5 border-t border-slate-200/60">
                          <div className="truncate text-[10px] text-slate-600" title={student.guardianName}>
                            {student.guardianName || 'ولي الأمر'}
                          </div>
                          <div className="truncate text-[10px] font-mono text-slate-700 text-left" title={student.guardianPhone}>
                            {student.guardianPhone || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="text-[10px]">
                        {student.totalAbsenceDays > 0 ? (
                          <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md">
                            {student.totalAbsenceDays} يوم غياب
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-semibold">
                            منتظم (0)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {onNavigateToReport && (
                          <button
                            onClick={() => onNavigateToReport(student.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold text-[10px] transition flex items-center gap-0.5 border border-emerald-200 cursor-pointer"
                            title="عرض وطباعة التقرير الشامل للطالب"
                          >
                            <GraduationCap className="w-3 h-3" /> التقرير
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenTransfer(student)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md font-bold text-[10px] transition flex items-center gap-0.5 border border-purple-200 cursor-pointer"
                          title="نقل الطالب إلى فصل أو قسم آخر"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> نقل
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudentForExcuse(student);
                            setIsExcuseModalOpen(true);
                          }}
                          className="text-blue-700 hover:bg-blue-100 bg-blue-50 px-1.5 py-0.5 rounded-md font-bold text-[10px] transition flex items-center gap-0.5 border border-blue-200 cursor-pointer"
                          title="إضافة عذر طبي أو رسمي"
                        >
                          <FileCheck2 className="w-3 h-3" /> عذر
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Dense Table View (Shows max rows with minimal scrolling) */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-12">#</th>
                      <th className="p-2.5">اسم الطالب</th>
                      <th className="p-2.5">كود الطالب</th>
                      <th className="p-2.5">الرقم القومي</th>
                      <th className="p-2.5 text-center">كود 2FA لولي الأمر</th>
                      <th className="p-2.5">الفصل</th>
                      <th className="p-2.5">القسم</th>
                      <th className="p-2.5">ولي الأمر</th>
                      <th className="p-2.5">الهاتف</th>
                      <th className="p-2.5 text-center">الغياب</th>
                      <th className="p-2.5 text-center w-48">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoster.map((student, idx) => {
                      const studentClass = classes.find((c) => c.id === student.classId);
                      const studentDept = departments.find((d) => d.id === student.departmentId);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{student.fullName}</td>
                          <td className="p-2 font-mono text-slate-600 text-[11px]">{student.studentCode}</td>
                          <td className="p-2 font-mono text-slate-600 text-[11px]">{student.nationalId}</td>
                          <td className="p-2 text-center">
                            <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200/90 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-indigo-900">
                              <span>{student.parentAccessCode || 'DEMO12'}</span>
                              <button
                                type="button"
                                onClick={() => handleCopySecretCode(student.id, student.parentAccessCode || 'DEMO12')}
                                className="text-indigo-600 hover:text-indigo-950 transition cursor-pointer p-0.5"
                                title="نسخ كود الدخول السري"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2 font-semibold text-slate-800">{studentClass?.name || '—'}</td>
                          <td className="p-2 text-slate-700">{studentDept?.name || 'عام'}</td>
                          <td className="p-2 text-slate-600">{student.guardianName || '—'}</td>
                          <td className="p-2 font-mono text-slate-600 text-[11px]">{student.guardianPhone || '—'}</td>
                          <td className="p-2 text-center">
                            {student.totalAbsenceDays > 0 ? (
                              <span className="font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[10px]">
                                {student.totalAbsenceDays} يوم
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                منتظم (0)
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {onNavigateToReport && (
                                <button
                                  onClick={() => onNavigateToReport(student.id)}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold text-[10px] border border-emerald-200"
                                  title="التقرير الشامل"
                                >
                                  تقرير
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenTransfer(student)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-md font-bold text-[10px] border border-purple-200"
                                title="نقل الطالب"
                              >
                                نقل
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudentForExcuse(student);
                                  setIsExcuseModalOpen(true);
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold text-[10px] border border-blue-200"
                                title="عذر طبي"
                              >
                                عذر
                              </button>
                              <button
                                onClick={() => handleOpenEditStudent(student)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded-md"
                                title="تعديل"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id, student.fullName)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Medical Excuses */}
      {activeTab === 'excuses' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                نظام اعتماد الأعذار الرسمية والأجازات المرضية المعتمدة
              </h3>
              <p className="text-xs text-slate-500">
                يقوم مسئول شئون الطلاب بإدخال بيانات التقارير الطبية المعتمدة من هيئة التأمين الصحي، لخصم أيام الغياب المرضي من عداد الإنذارات.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.filter((s) => s.totalAbsenceDays > 0).map((student) => (
              <div
                key={student.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{student.fullName}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    الغياب المسجل: <b className="text-red-700">{student.totalAbsenceDays} يوم</b>
                    {student.excusedAbsenceDays > 0 && ` | الأعذار المقبولة: ${student.excusedAbsenceDays}`}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedStudentForExcuse(student);
                    setIsExcuseModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> اعتماد عذر
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Student Transfer Logs */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                سجل التحويلات وتغيير التخصصات والفصول
              </h3>
              <p className="text-xs text-slate-500">
                أرشيف رسمي يوثق كافة حركات نقل الطلاب بين الأقسام الصناعية والفصول وقاعات الورش وتاريخها.
              </p>
            </div>
          </div>

          {transferLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              لم يتم إجراء أي عمليات نقل طلاب حتى الآن
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transferLogs.map((log) => {
                const std = students.find((s) => s.id === log.studentId);

                return (
                  <div key={log.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{std?.fullName || 'طالب محول'}</span>
                        <span className="text-xs text-slate-400 font-mono">{log.date}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                        <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          من: {log.fromClassName} ({log.fromDeptName})
                        </span>
                        <span>←</span>
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                          إلى: {log.toClassName} ({log.toDeptName})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        السبب: {log.reason} | المسئول: {log.officerName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transfer Student Modal */}
      {isTransferModalOpen && transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                نقل وتحويل الطالب بين الفصول والتخصصات
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">اسم الطالب:</div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{transferringStudent.fullName}</div>
                <div className="text-slate-500 mt-1">
                  الفصل الحالي: <b className="text-slate-800">{classes.find((c) => c.id === transferringStudent.classId)?.name}</b> (
                  {departments.find((d) => d.id === transferringStudent.departmentId)?.name})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر التخصص / القسم الجديد المراد التحويل إليه *</label>
                <select
                  value={targetDeptId}
                  onChange={(e) => {
                    setTargetDeptId(e.target.value);
                    const av = classes.filter((c) => c.departmentId === e.target.value);
                    setTargetClassId(av[0]?.id || '');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر الفصل / الورشة الجديدة *</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {targetAvailableClasses.length === 0 ? (
                    <option value="">لا توجد فصول مسكنة لهذا القسم</option>
                  ) : (
                    targetAvailableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - ({c.gradeName})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التحويل والنقل</label>
                <textarea
                  rows={2}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!targetClassId}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  تأكيد النقل والتسكين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                <UserPlus className="w-4 h-4 text-amber-400" />
                {editingStudent ? 'تعديل بيانات الطالب' : 'تسكين وقيد طالب جديد'}
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {studentFormError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{studentFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الطالب رباعي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف إبراهيم محمد حسن"
                  value={studentFormName}
                  onChange={(e) => {
                    setStudentFormName(e.target.value);
                    setStudentFormError(null);
                  }}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-hidden ${
                    liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'fullName'
                      ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'fullName' && (
                  <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {liveDuplicateCheck.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم القومي (14 رقم) *</label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="30801010101234"
                    value={studentFormNationalId}
                    onChange={(e) => {
                      setStudentFormNationalId(e.target.value);
                      setStudentFormError(null);
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-hidden ${
                      liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'nationalId'
                        ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'nationalId' && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {liveDuplicateCheck.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الطالب المدرسي</label>
                  <input
                    type="text"
                    placeholder="20251099"
                    value={studentFormCode}
                    onChange={(e) => {
                      setStudentFormCode(e.target.value);
                      setStudentFormError(null);
                    }}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-hidden ${
                      liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'studentCode'
                        ? 'border-red-500 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {liveDuplicateCheck.hasDuplicate && liveDuplicateCheck.field === 'studentCode' && (
                    <p className="text-[11px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {liveDuplicateCheck.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 2FA Secret Access Code */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>كود الدخول السري لولي الأمر (2FA Access Code) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStudentFormParentCode(generateParentAccessCode())}
                    className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 bg-white hover:bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-lg transition cursor-pointer"
                    title="توليد كود سري عشوائي جديد للطالب"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>توليد كود جديد</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="مثال: W8R4XY أو DEMO12"
                    value={studentFormParentCode}
                    onChange={(e) => setStudentFormParentCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white border border-indigo-300 focus:border-indigo-600 rounded-xl px-3 py-2 text-indigo-950 font-mono font-black text-sm tracking-wider uppercase focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopySecretCode('form', studentFormParentCode)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl font-bold flex items-center gap-1 text-xs transition cursor-pointer shrink-0"
                    title="نسخ الكود"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCodeStudentId === 'form' ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-indigo-800 leading-relaxed">
                  يُسلم هذا الكود لولي الأمر مع الرقم القومي للدخول الآمن عبر بوابة ولي الأمر والطالب.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفصل والتخصص المسكن عليه *</label>
                  <select
                    value={studentFormClassId}
                    onChange={(e) => setStudentFormClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - ({c.departmentName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع القيد الدراسي</label>
                  <select
                    value={studentFormStatus}
                    onChange={(e) => setStudentFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="منتظم">منتظم</option>
                    <option value="خدمات">خدمات</option>
                    <option value="نظام عمال">نظام عمال</option>
                    <option value="دمج">دمج تعليمي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    placeholder="إبراهيم محمد حسن"
                    value={studentFormGuardian}
                    onChange={(e) => setStudentFormGuardian(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تليفون ولي الأمر</label>
                  <input
                    type="tel"
                    placeholder="01012345678"
                    value={studentFormPhone}
                    onChange={(e) => setStudentFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
                <input
                  type="text"
                  placeholder="شارع العباسية - الوايلي - القاهرة"
                  value={studentFormAddress}
                  onChange={(e) => setStudentFormAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={liveDuplicateCheck.hasDuplicate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  {editingStudent ? 'حفظ التعديلات' : 'حفظ وتسجيل الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excuse Modal */}
      {isExcuseModalOpen && selectedStudentForExcuse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileCheck2 className="w-4 h-4 text-blue-400" />
                اعتماد وتوثيق عذر رسمي للطالب
              </div>
              <button
                onClick={() => setIsExcuseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApproveExcuseSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">الطالب:</div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{selectedStudentForExcuse.fullName}</div>
                <div className="text-slate-500 mt-1">
                  إجمالي أيام الغياب المسجلة: <b className="text-red-700">{selectedStudentForExcuse.totalAbsenceDays}</b> يوم
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الغياب المراد اعتماده</label>
                <input
                  type="date"
                  required
                  value={excuseDate}
                  onChange={(e) => setExcuseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب العذر والجهة المعتمدة</label>
                <textarea
                  rows={3}
                  required
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExcuseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  اعتماد وتعديل السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        departments={departments}
        classes={classes}
        onImportSuccess={() => {
          setIsExcelModalOpen(false);
          onDataChanged();
        }}
      />
    </div>
  );
};
