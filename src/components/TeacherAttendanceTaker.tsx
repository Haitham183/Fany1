'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolClass,
  Student,
  User,
  AttendanceStatus,
  PeriodType,
  Department,
  SchoolConfig,
  WorkDaysScheme,
} from '@/types';
import { getSchoolConfig, getAttendance, saveWeeklyClassAttendance, isHolidayDate } from '@/lib/storage';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Users,
  AlertTriangle,
  Sparkles,
  Search,
  Building2,
  Calendar,
  Printer,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCheck,
  Flame,
  Info,
  Check,
  LayoutGrid,
  List,
  Smartphone,
  CheckCircle,
  UserX,
} from 'lucide-react';
import { useToast, Button, Badge, Tabs } from '@/components/ui';

interface TeacherAttendanceTakerProps {
  currentUser: User;
  classes: SchoolClass[];
  students: Student[];
  departments: Department[];
  schoolConfig?: SchoolConfig;
  onAttendanceSaved: (count: number) => void;
  onNavigateToNotices?: () => void;
}

export interface WeekDayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. 'الأحد'
  formattedShort: string; // e.g. '20/09'
  isToday: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  holidayType?: 'official' | 'emergency';
}

// Helper to get week days based on workDaysScheme, anchor date and school config holidays
export function computeWeekDays(
  anchorDate: Date,
  scheme: WorkDaysScheme = 'sun_to_thu',
  config?: SchoolConfig
): WeekDayInfo[] {
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayIndex = anchorDate.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

  let startOfWeek = new Date(anchorDate);
  startOfWeek.setHours(0, 0, 0, 0);

  if (scheme === 'sun_to_thu') {
    // Week starts on Sunday (day 0)
    startOfWeek.setDate(anchorDate.getDate() - dayIndex);
  } else if (scheme === 'sat_to_thu' || scheme === 'sat_to_wed') {
    // Week starts on Saturday (day 6)
    const diff = dayIndex === 6 ? 0 : -(dayIndex + 1);
    startOfWeek.setDate(anchorDate.getDate() + diff);
  }

  // Define offsets from start of week
  let dayOffsets: number[] = [];
  if (scheme === 'sun_to_thu') {
    // 5 days: Sunday to Thursday
    dayOffsets = [0, 1, 2, 3, 4];
  } else if (scheme === 'sat_to_thu') {
    // 6 days: Saturday to Thursday
    dayOffsets = [0, 1, 2, 3, 4, 5];
  } else if (scheme === 'sat_to_wed') {
    // 5 days: Saturday to Wednesday
    dayOffsets = [0, 1, 2, 3, 4];
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return dayOffsets.map((offset) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = arabicDays[d.getDay()] || '';
    const formattedShort = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const holCheck = isHolidayDate(dateStr, config);

    return {
      date: dateStr,
      dayOfWeek: dayName,
      formattedShort,
      isToday: dateStr === todayStr,
      isHoliday: holCheck.isHoliday,
      holidayName: holCheck.holiday?.name,
      holidayType: holCheck.holiday?.type,
    };
  });
}

export const TeacherAttendanceTaker: React.FC<TeacherAttendanceTakerProps> = ({
  currentUser,
  classes,
  students,
  departments,
  schoolConfig: propSchoolConfig,
  onAttendanceSaved,
  onNavigateToNotices,
}) => {
  const activeConfig = propSchoolConfig || getSchoolConfig();
  const workScheme = activeConfig.workDaysScheme || 'sun_to_thu';

  // Filter classes based on user role and permissions
  const availableClasses = classes.filter((c) => {
    if (
      currentUser.role === 'principal' ||
      currentUser.role === 'affairs_deputy' ||
      currentUser.role === 'affairs_officer'
    ) {
      return true;
    }
    if (currentUser.role === 'dept_head' && currentUser.departmentId) {
      return c.departmentId === currentUser.departmentId;
    }
    if (currentUser.role === 'teacher' && currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
      return currentUser.assignedClassIds.includes(c.id);
    }
    return true;
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(
    availableClasses[0]?.id || classes[0]?.id || ''
  );
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [periodType, setPeriodType] = useState<PeriodType>('workshop');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'mobile_fast' | 'weekly_table'>('mobile_fast');
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, Record<string, AttendanceStatus | undefined>> | null>(null);

  // Weekly Attendance Matrix: studentId -> (date -> AttendanceStatus | undefined)
  const [weeklyMatrix, setWeeklyMatrix] = useState<Record<string, Record<string, AttendanceStatus | undefined>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  let toast: ReturnType<typeof useToast> | null = null;
  try {
    toast = useToast();
  } catch {
    // Graceful fallback if rendered outside ToastProvider
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.classId === selectedClassId)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true }));
  }, [students, selectedClassId]);

  // Compute the week days array
  const weekDays = useMemo(() => {
    return computeWeekDays(anchorDate, workScheme, activeConfig);
  }, [anchorDate, workScheme, activeConfig]);

  const startDateStr = weekDays[0]?.date || '';
  const endDateStr = weekDays[weekDays.length - 1]?.date || '';

  // Ensure selectedMobileDate matches one of the weekDays
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const matchToday = weekDays.find((d) => d.date === today);
    if (matchToday) {
      setSelectedMobileDate(today);
    } else if (weekDays[0]) {
      setSelectedMobileDate(weekDays[0].date);
    }
  }, [weekDays]);

  // Initialize or load weekly attendance matrix when class or week changes
  useEffect(() => {
    const existingAttendance = getAttendance();
    const initialMatrix: Record<string, Record<string, AttendanceStatus | undefined>> = {};

    classStudents.forEach((student) => {
      initialMatrix[student.id] = {};
      weekDays.forEach((day) => {
        // Look for existing saved record
        const found = existingAttendance.find(
          (a) =>
            a.studentId === student.id &&
            a.date === day.date &&
            a.classId === selectedClassId &&
            a.periodNumber === periodNumber &&
            a.periodType === periodType
        );
        // Default to undefined (فارغة حتى يتم الإدخال) if no record exists
        initialMatrix[student.id][day.date] = found ? found.status : undefined;
      });
    });

    setWeeklyMatrix(initialMatrix);
    setSaveSuccessMsg(null);
  }, [selectedClassId, weekDays, periodType, periodNumber, students.length]);

  // Handle Undo of bulk actions
  const handleUndo = () => {
    if (undoSnapshot) {
      setWeeklyMatrix(undoSnapshot);
      setUndoSnapshot(null);
      toast?.info('تم التراجع عن الإجراء واستعادة السجل السابق بنجاح');
    }
  };

  // Cycle status on cell click: Empty -> P -> A -> E -> L -> Empty
  const handleCellClick = (studentId: string, date: string) => {
    const current = weeklyMatrix[studentId]?.[date];
    let nextStatus: AttendanceStatus | undefined = 'present';
    if (!current) nextStatus = 'present';
    else if (current === 'present') nextStatus = 'absent';
    else if (current === 'absent') nextStatus = 'excused';
    else if (current === 'excused') nextStatus = 'late';
    else if (current === 'late') nextStatus = undefined; // Return to blank
    else nextStatus = 'present';

    setWeeklyMatrix((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [date]: nextStatus,
      },
    }));
  };

  // Direct set status
  const handleSetStatus = (studentId: string, date: string, status: AttendanceStatus | undefined) => {
    setWeeklyMatrix((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [date]: status,
      },
    }));
  };

  // 1-Click Fast Mobile Attendance: Mark All Students Present for Selected Day + Undo Toast
  const handleFastMarkAllPresent = (date: string) => {
    setUndoSnapshot(JSON.parse(JSON.stringify(weeklyMatrix)));
    setWeeklyMatrix((prev) => {
      const next = { ...prev };
      classStudents.forEach((student) => {
        next[student.id] = {
          ...next[student.id],
          [date]: 'present',
        };
      });
      return next;
    });

    const activeDayInfo = weekDays.find((d) => d.date === date);
    const dayLabel = activeDayInfo ? activeDayInfo.dayOfWeek : date;

    toast?.success(
      `تم تحديد جميع طلاب الفصل (${classStudents.length}) كـ حاضر ليوم ${dayLabel}`,
      'يمكنك الآن استثناء الطلاب الغائبين بالنقر على بطاقة كل طالب.',
      handleUndo
    );
  };

  // Bulk actions
  const handleSetAllPresent = () => {
    setUndoSnapshot(JSON.parse(JSON.stringify(weeklyMatrix)));
    const nextMatrix: Record<string, Record<string, AttendanceStatus | undefined>> = {};
    classStudents.forEach((student) => {
      nextMatrix[student.id] = {};
      weekDays.forEach((day) => {
        nextMatrix[student.id][day.date] = 'present';
      });
    });
    setWeeklyMatrix(nextMatrix);
    toast?.success('تم تعيين الأسبوع كاملاً كـ حاضر لجميع الطلاب', undefined, handleUndo);
  };

  const handleClearAll = () => {
    setUndoSnapshot(JSON.parse(JSON.stringify(weeklyMatrix)));
    const nextMatrix: Record<string, Record<string, AttendanceStatus | undefined>> = {};
    classStudents.forEach((student) => {
      nextMatrix[student.id] = {};
      weekDays.forEach((day) => {
        nextMatrix[student.id][day.date] = undefined;
      });
    });
    setWeeklyMatrix(nextMatrix);
    toast?.info('تم تفريغ رصد الأسبوع كاملاً', undefined, handleUndo);
  };

  const handleSetDayAllPresent = (date: string) => {
    handleFastMarkAllPresent(date);
  };

  const handleSetDayAllAbsent = (date: string) => {
    setUndoSnapshot(JSON.parse(JSON.stringify(weeklyMatrix)));
    setWeeklyMatrix((prev) => {
      const next = { ...prev };
      classStudents.forEach((student) => {
        next[student.id] = {
          ...next[student.id],
          [date]: 'absent',
        };
      });
      return next;
    });
    toast?.warning('تم تعيين اليوم كـ غائب لجميع الطلاب', undefined, handleUndo);
  };

  const handleClearDay = (date: string) => {
    setWeeklyMatrix((prev) => {
      const next = { ...prev };
      classStudents.forEach((student) => {
        next[student.id] = {
          ...next[student.id],
          [date]: undefined,
        };
      });
      return next;
    });
  };

  // Week navigation
  const handlePrevWeek = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setAnchorDate(new Date());
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setAnchorDate(new Date(e.target.value));
    }
  };

  // Save weekly attendance
  const handleSaveWeekly = () => {
    if (!selectedClassId) return;
    setIsSaving(true);

    const recordsToSave = classStudents.map((student) => ({
      studentId: student.id,
      dayStatuses: weeklyMatrix[student.id] || {},
    }));

    const result = saveWeeklyClassAttendance(
      selectedClassId,
      weekDays.map((w) => ({ date: w.date, dayOfWeek: w.dayOfWeek })),
      periodType,
      periodNumber,
      currentUser,
      recordsToSave
    );

    setIsSaving(false);
    if (result.success) {
      if (result.newWarningsCreated > 0) {
        setSaveSuccessMsg(
          `تم اعتماد وحفظ سجل الأسبوع بنجاح! ⚠️ تم تلقائياً توليد (${result.newWarningsCreated}) إنذار رسمي للطلاب الذين تجاوزوا المدد القانونية للغياب.`
        );
      } else {
        setSaveSuccessMsg('تم اعتماد وتوثيق سجل الحضور والغياب الأسبوعي بنجاح في قاعدة البيانات المدرسية.');
      }
      onAttendanceSaved(result.newWarningsCreated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Filter students by search
  const filteredStudents = useMemo(() => {
    return classStudents
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.studentCode.includes(searchQuery) ||
          s.nationalId.includes(searchQuery)
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true }));
  }, [classStudents, searchQuery]);

  // Statistics calculation for the current week
  let totalCellCount = 0;
  let totalRecordedCount = 0;
  let totalPCount = 0;
  let totalACount = 0;
  let totalECount = 0;
  let totalLCount = 0;

  classStudents.forEach((s) => {
    weekDays.forEach((d) => {
      totalCellCount++;
      const st = weeklyMatrix[s.id]?.[d.date];
      if (st) {
        totalRecordedCount++;
        if (st === 'present') totalPCount++;
        else if (st === 'absent') totalACount++;
        else if (st === 'excused') totalECount++;
        else if (st === 'late') totalLCount++;
      }
    });
  });

  const weeklyAttendanceRate = totalRecordedCount > 0 ? Math.round((totalPCount / totalRecordedCount) * 100) : 0;

  // Render Status Badge
  const renderStatusBadge = (status: AttendanceStatus | undefined, size: 'sm' | 'md' = 'md') => {
    switch (status) {
      case 'present':
        return (
          <span
            title="P: حاضر (Present)"
            className={`font-black rounded-md flex items-center justify-center transition-all ${
              size === 'sm'
                ? 'w-5 h-5 text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'w-7 h-7 text-xs bg-emerald-600 text-white shadow-2xs font-black ring-1 ring-emerald-400/50'
            }`}
          >
            P
          </span>
        );
      case 'absent':
        return (
          <span
            title="A: غائب (Absent)"
            className={`font-black rounded-md flex items-center justify-center transition-all ${
              size === 'sm'
                ? 'w-5 h-5 text-[11px] bg-red-100 text-red-800 border border-red-300'
                : 'w-7 h-7 text-xs bg-red-600 text-white shadow-2xs font-black ring-1 ring-red-400'
            }`}
          >
            A
          </span>
        );
      case 'excused':
        return (
          <span
            title="E: استئذان / عذر قانوني (Excused)"
            className={`font-black rounded-md flex items-center justify-center transition-all ${
              size === 'sm'
                ? 'w-5 h-5 text-[11px] bg-blue-100 text-blue-800 border border-blue-300'
                : 'w-7 h-7 text-xs bg-blue-600 text-white shadow-2xs font-black ring-1 ring-blue-400/50'
            }`}
          >
            E
          </span>
        );
      case 'late':
        return (
          <span
            title="L: متأخر عن الطابور (Late)"
            className={`font-black rounded-md flex items-center justify-center transition-all ${
              size === 'sm'
                ? 'w-5 h-5 text-[11px] bg-amber-100 text-amber-800 border border-amber-300'
                : 'w-7 h-7 text-xs bg-amber-500 text-white shadow-2xs font-black'
            }`}
          >
            L
          </span>
        );
      default:
        return (
          <span
            title="فارغ (انقر لتسجيل الحضور)"
            className={`font-bold rounded-md flex items-center justify-center transition-all ${
              size === 'sm'
                ? 'w-5 h-5 text-[10px] bg-slate-50 text-slate-400 border border-dashed border-slate-300'
                : 'w-7 h-7 text-xs bg-slate-50 text-slate-400 border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40 shadow-2xs'
            }`}
          >
            —
          </span>
        );
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'م',
      'كود الطالب',
      'الرقم القومي',
      'اسم الطالب',
      ...weekDays.map((d) => `${d.dayOfWeek} (${d.formattedShort})`),
      'حضور (P)',
      'غياب (A)',
      'استئذان (E)',
      'نسبة حضور الأسبوع',
    ];

    const rows = filteredStudents.map((student, idx) => {
      let pCount = 0;
      let aCount = 0;
      let eCount = 0;
      let recCount = 0;
      const dayValues = weekDays.map((d) => {
        const st = weeklyMatrix[student.id]?.[d.date];
        if (st === 'present') {
          pCount++;
          recCount++;
          return 'P';
        } else if (st === 'absent') {
          aCount++;
          recCount++;
          return 'A';
        } else if (st === 'excused') {
          eCount++;
          recCount++;
          return 'E';
        } else if (st === 'late') {
          recCount++;
          return 'L';
        }
        return '-';
      });

      const weeklyRate = recCount > 0 ? `${Math.round((pCount / recCount) * 100)}%` : '—';

      return [
        idx + 1,
        `"${student.studentCode}"`,
        `"\t${student.nationalId}"`,
        `"${student.fullName}"`,
        ...dayValues,
        pCount,
        aCount,
        eCount,
        `"${weeklyRate}%"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute(
      'download',
      `سجل_الغياب_الأسبوعي_${selectedClass?.name || 'فصل'}_${startDateStr}_إلى_${endDateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Weekly Register Layout (Only visible when printing) */}
      <div className="hidden print:block text-slate-900 bg-white p-4">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4;
                margin: 8mm 8mm 8mm 8mm;
              }
              body {
                background: white !important;
                color: black !important;
                font-family: Arial, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-no-break {
                page-break-inside: avoid;
              }
              header, nav, aside, footer, .no-print {
                display: none !important;
              }
            }
          `
        }} />

        {/* Official Ministry Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between text-xs">
          <div className="text-right space-y-0.5">
            <div className="font-bold text-sm">جمهورية مصر العربية</div>
            <div>وزارة التربية والتعليم والتعليم الفني</div>
            <div>مديرية: <span className="font-bold">{activeConfig.directorate}</span></div>
            <div>إدارة: <span className="font-bold">{activeConfig.administration}</span></div>
            <div>مدرسة: <span className="font-bold">{activeConfig.name}</span></div>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-black border border-slate-900 px-4 py-1.5 rounded-md bg-slate-100 leading-normal">
              سجل الحضور والغياب الأسبوعي للفصل والورشة
            </h1>
            <div className="text-xs font-bold mt-1 text-slate-700">
              للفترة من {startDateStr} إلى {endDateStr}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              العام الدراسي: {activeConfig.academicYear} | {activeConfig.currentTerm}
            </div>
          </div>

          <div className="text-left space-y-0.5">
            <div>الفصل: <span className="font-bold">{selectedClass?.name}</span></div>
            <div>التخصص: <span className="font-bold">{selectedClass?.departmentName}</span></div>
            <div>نوع الفترة: <span className="font-bold">{periodType === 'workshop' ? 'ورشة عملية' : 'فصل نظري'}</span></div>
            <div>الفترة: <span className="font-bold">الحصة {periodNumber}</span></div>
            <div>المشرف: <span className="font-bold">{selectedClass?.supervisorTeacherName}</span></div>
          </div>
        </div>

        {/* Legend for Print */}
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-md mb-3 text-xs border border-slate-300">
          <div className="flex items-center gap-6 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-emerald-700 text-white rounded flex items-center justify-center font-black text-xs">P</span>
              <span>حاضر (Present)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-red-700 text-white rounded flex items-center justify-center font-black text-xs">A</span>
              <span>غائب (Absent)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-blue-700 text-white rounded flex items-center justify-center font-black text-xs">E</span>
              <span>استئذان / عذر (Excused)</span>
            </span>
          </div>
          <div className="text-xs text-slate-600 font-bold">
            إجمالي المقيدين: {classStudents.length} طالب | نسبة الحضور: {weeklyAttendanceRate}%
          </div>
        </div>

        {/* Printable Table */}
        <table className="w-full text-center border-collapse border border-slate-900 text-xs">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-black border-b border-slate-900">
              <th className="border border-slate-900 p-1 w-8">م</th>
              <th className="border border-slate-900 p-1 w-20">كود الطالب</th>
              <th className="border border-slate-900 p-1 text-right pr-2">اسم الطالب رباعياً</th>
              {weekDays.map((d) => (
                <th key={d.date} className="border border-slate-900 p-1">
                  <div>{d.dayOfWeek}</div>
                  <div className="text-[10px] font-normal">{d.formattedShort}</div>
                </th>
              ))}
              <th className="border border-slate-900 p-1 w-12 bg-emerald-100 text-emerald-900">P</th>
              <th className="border border-slate-900 p-1 w-12 bg-red-100 text-red-900">A</th>
              <th className="border border-slate-900 p-1 w-12 bg-blue-100 text-blue-900">E</th>
              <th className="border border-slate-900 p-1 w-24">نسبة حضور الأسبوع</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, idx) => {
              let pCount = 0;
              let aCount = 0;
              let eCount = 0;

              return (
                <tr key={student.id} className="border-b border-slate-700 hover:bg-slate-50">
                  <td className="border border-slate-900 p-1 font-bold">{idx + 1}</td>
                  <td className="border border-slate-900 p-1 font-mono text-[11px]">{student.studentCode}</td>
                  <td className="border border-slate-900 p-1 text-right font-bold pr-2">{student.fullName}</td>
                  {weekDays.map((d) => {
                    const st = weeklyMatrix[student.id]?.[d.date];
                    if (st === 'present') pCount++;
                    else if (st === 'absent') aCount++;
                    else if (st === 'excused') eCount++;

                    return (
                      <td key={d.date} className="border border-slate-900 p-1 font-black">
                        {st ? (
                          <span
                            className={`inline-block w-6 h-6 leading-6 rounded text-xs font-black ${
                              st === 'present'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                                : st === 'absent'
                                ? 'bg-red-100 text-red-900 border border-red-400 font-black'
                                : 'bg-blue-100 text-blue-900 border border-blue-400'
                            }`}
                          >
                            {st === 'present' ? 'P' : st === 'absent' ? 'A' : 'E'}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-slate-900 p-1 font-black text-emerald-800 bg-emerald-50/50">{pCount}</td>
                  <td className="border border-slate-900 p-1 font-black text-red-800 bg-red-50/50">{aCount}</td>
                  <td className="border border-slate-900 p-1 font-black text-blue-800 bg-blue-50/50">{eCount}</td>
                  <td className="border border-slate-900 p-1 font-black text-xs">
                    {(pCount + aCount + eCount) > 0 ? `${Math.round((pCount / (pCount + aCount + eCount)) * 100)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Printable Signatures Block */}
        <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-4 gap-4 text-center text-xs font-bold print-no-break">
          <div>
            <div className="text-slate-600 mb-8">معلم المادة / مدرب الورشة</div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-900">{currentUser.name}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-8">مسئول سجلات الغياب</div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-900">{activeConfig.studentAffairsAgent || '.....................'}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-8">وكيل شئون الطلاب</div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-900">{activeConfig.studentAffairsHead}</div>
          </div>
          <div>
            <div className="text-slate-600 mb-8">يعتمد، مدير عام المدرسة</div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-900">{activeConfig.managerName}</div>
          </div>
        </div>
      </div>

      {/* Screen View UI (Hidden when printing) */}
      <div className="no-print space-y-4">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white rounded-2xl p-4 shadow-md border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-950/80 text-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-400/30 flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" /> نظام التحضير الأسبوعي المطور
                </span>
                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10.5px] px-2 py-0.2 rounded-full font-bold">
                  P = حاضر | A = غائب | E = استئذان
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-normal">
                سجل الحضور والغياب الأسبوعي للورش والفصول
              </h2>
              <p className="text-[11px] text-amber-100 leading-relaxed max-w-2xl">
                رصد أسبوعي سريع لأيام العمل المعتمدة ({workScheme === 'sun_to_thu' ? 'الأحد إلى الخميس' : workScheme === 'sat_to_thu' ? 'السبت إلى الخميس' : 'السبت إلى الأربعاء'}) وحفظ واعتماد السجل بضغطة واحدة.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 text-center shrink-0 text-xs">
              <div>
                <div className="text-[10px] text-amber-200">المسجل الحالي: <span className="font-bold text-white">{currentUser.name}</span></div>
                <div className="text-[9.5px] text-amber-200/90 font-medium">{currentUser.roleTitle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <div className="font-black text-sm">تم الحفظ بنجاح</div>
                <div className="text-xs text-emerald-800 leading-relaxed">{saveSuccessMsg}</div>
              </div>
            </div>
            {onNavigateToNotices && (
              <button
                type="button"
                onClick={onNavigateToNotices}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                عرض سجل الإنذارات 📄
              </button>
            )}
          </div>
        )}

        {/* Main Controls Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                الفصل / الورشة
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.gradeName} • {cls.shift === 'evening' ? 'فترة مسائية 🌙' : 'فترة صباحية ☀️'} • {cls.studentCount} طالب)
                  </option>
                ))}
              </select>
            </div>

            {/* Week Navigation & Date Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  الأسبوع المحدد
                </span>
                <span className="text-[11px] text-blue-700 font-bold">
                  {startDateStr} ↔ {endDateStr}
                </span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  title="الأسبوع السابق"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={anchorDate.toISOString().split('T')[0]}
                  onChange={handleDatePickerChange}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-center"
                />
                <button
                  type="button"
                  onClick={handleNextWeek}
                  title="الأسبوع القادم"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCurrentWeek}
                  title="العودة للأسبوع الحالي"
                  className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  اليوم
                </button>
              </div>
            </div>

            {/* Period Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                نوع الفترة التعليمية
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPeriodType('workshop')}
                  className={`py-2 text-xs font-black rounded-lg transition cursor-pointer ${
                    periodType === 'workshop'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🛠️ ورشة عملية
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('theoretical')}
                  className={`py-2 text-xs font-black rounded-lg transition cursor-pointer ${
                    periodType === 'theoretical'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📚 فصل نظري
                </button>
              </div>
            </div>

            {/* Period Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                رقم الحصة / الفترة
              </label>
              <select
                value={periodNumber}
                onChange={(e) => setPeriodNumber(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value={1}>الفترة الأولى (08:00 - 09:30)</option>
                <option value={2}>الفترة الثانية (09:45 - 11:15)</option>
                <option value={3}>الفترة الثالثة (11:30 - 01:00)</option>
                <option value={4}>الفترة المسائية / التدريب العملي</option>
              </select>
            </div>
          </div>

          {/* Quick Actions Strip & Class Meta */}
          {selectedClass && (
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap text-slate-600">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  التخصص: <b className="text-slate-900">{selectedClass.departmentName}</b>
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  المقر: <b className="text-slate-900">{selectedClass.roomNumber}</b>
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  المشرف: <b className="text-slate-900">{selectedClass.supervisorTeacherName}</b>
                </span>
              </div>

              {/* Action Buttons: Batch Set, Clear, Print, Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetAllPresent}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="تعيين جميع خلايا الأسبوع كـ P (حاضر)"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  تحضير الأسبوع بالكامل (P)
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="تفريغ ومسح جميع خلايا الأسبوع لتصبح فارغة"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  تفريغ السجل (فارغ)
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="تصدير السجل الأسبوعي كملف Excel / CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  تصدير Excel
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="طباعة سجل الحضور والغياب الأسبوعي بحجم ورقة A4"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  طباعة السجل (A4)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Weekly Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-slate-500 font-bold">طلاب الفصل</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{classStudents.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-emerald-700 font-bold">إجمالي الحضور (P)</div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{totalPCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-black text-lg">
              P
            </div>
          </div>

          <div className="bg-red-50 rounded-2xl p-4 border border-red-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-red-700 font-bold">إجمالي الغياب (A)</div>
              <div className="text-2xl font-black text-red-900 mt-1">{totalACount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-200/80 text-red-900 flex items-center justify-center font-black text-lg">
              A
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-blue-700 font-bold">إجمالي الاستئذان (E)</div>
              <div className="text-2xl font-black text-blue-900 mt-1">{totalECount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-200/80 text-blue-900 flex items-center justify-center font-black text-lg">
              E
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between shadow-2xs col-span-2 sm:col-span-1">
            <div>
              <div className="text-xs text-amber-800 font-bold">نسبة الحضور الأسبوعية</div>
              <div className="text-2xl font-black text-amber-950 mt-1">{weeklyAttendanceRate}%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setAttendanceViewMode('mobile_fast')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition min-h-[44px] cursor-pointer ${
                attendanceViewMode === 'mobile_fast'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>وضع الموبايل السريع (تحضير بنقرة واحدة)</span>
            </button>

            <button
              type="button"
              onClick={() => setAttendanceViewMode('weekly_table')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition min-h-[44px] cursor-pointer ${
                attendanceViewMode === 'weekly_table'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>جدول الرصد الأسبوعي الكامل (A4 Grid)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-bold">
            عدد طلاب الفصل: <strong className="text-slate-900">{classStudents.length} طالب</strong>
          </div>
        </div>

        {/* =========================================================================
            1. Mobile Fast Attendance View (Optimized for Mobile/Touch in Workshops)
           ========================================================================= */}
        {attendanceViewMode === 'mobile_fast' && (
          <div className="space-y-4">
            {/* Fast Day Selector & 1-Click Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>اختر اليوم للتحضير السريع:</span>
                </label>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {selectedMobileDate}
                </span>
              </div>

              {/* Day Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {weekDays.map((d) => {
                  const isSelected = selectedMobileDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedMobileDate(d.date)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-1'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      } ${d.isToday ? 'border-2 border-amber-500' : ''}`}
                    >
                      <span>{d.dayOfWeek}</span>
                      <span className="text-[10px] font-mono opacity-80">({d.formattedShort})</span>
                      {d.isToday && (
                        <span className="bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-black">
                          اليوم
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 1-Click Fast Actions */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleFastMarkAllPresent(selectedMobileDate)}
                    className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl font-black shadow-md flex items-center gap-2 cursor-pointer transition active:scale-98"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>✨ تحضير الكل حاضر اليوم (P)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDayAllAbsent(selectedMobileDate)}
                    className="min-h-[44px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <UserX className="w-4 h-4 text-red-600" />
                    <span>تحديد الكل غائب</span>
                  </button>
                </div>

                {/* Live Search Box */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 absolute start-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث عن طالب بالاسم أو الكود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl ps-9 pe-3 py-2 min-h-[44px] text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Student Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  لا يوجد طلاب مطابقين للبحث
                </div>
              ) : (
                filteredStudents.map((student, idx) => {
                  const currentStatus = weeklyMatrix[student.id]?.[selectedMobileDate];

                  return (
                    <div
                      key={student.id}
                      className={`p-3.5 rounded-2xl border transition-all shadow-2xs space-y-2.5 bg-white ${
                        currentStatus === 'present'
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : currentStatus === 'absent'
                          ? 'border-red-300 bg-red-50/30'
                          : currentStatus === 'late'
                          ? 'border-amber-300 bg-amber-50/30'
                          : currentStatus === 'excused'
                          ? 'border-blue-300 bg-blue-50/30'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                              {student.fullName}
                            </h4>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-mono ps-7">
                            كود: <b className="text-slate-700">{student.studentCode}</b> • قومي: {student.nationalId.slice(0, 4)}***{student.nationalId.slice(-4)}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {currentStatus === 'present' ? (
                            <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3" /> حاضر
                            </span>
                          ) : currentStatus === 'absent' ? (
                            <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              <XCircle className="w-3 h-3" /> غائب
                            </span>
                          ) : currentStatus === 'late' ? (
                            <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              <Clock className="w-3 h-3" /> متأخر
                            </span>
                          ) : currentStatus === 'excused' ? (
                            <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                              <HelpCircle className="w-3 h-3" /> إذن ورشة
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-dashed border-slate-300">
                              غير مسجل
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4 Touch Action Buttons (>= 44px) */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, selectedMobileDate, 'present')}
                          className={`min-h-[44px] rounded-xl text-xs font-black flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500 ring-offset-1'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          <span className="text-sm leading-none font-black">P</span>
                          <span className="text-[9.5px]">حاضر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, selectedMobileDate, 'absent')}
                          className={`min-h-[44px] rounded-xl text-xs font-black flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                            currentStatus === 'absent'
                              ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-500 ring-offset-1'
                              : 'bg-red-50 text-red-800 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          <span className="text-sm leading-none font-black">A</span>
                          <span className="text-[9.5px]">غائب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, selectedMobileDate, 'late')}
                          className={`min-h-[44px] rounded-xl text-xs font-black flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400 ring-offset-1'
                              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          <span className="text-sm leading-none font-black">L</span>
                          <span className="text-[9.5px]">متأخر</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetStatus(student.id, selectedMobileDate, 'excused')}
                          className={`min-h-[44px] rounded-xl text-xs font-black flex flex-col items-center justify-center gap-0.5 transition cursor-pointer active:scale-95 ${
                            currentStatus === 'excused'
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500 ring-offset-1'
                              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <span className="text-sm leading-none font-black">E</span>
                          <span className="text-[9.5px]">إذن</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Bottom Fast Save Bar for Mobile */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 sticky bottom-3 z-20 border border-slate-800">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="text-slate-400 font-medium">إجمالي اليوم ({selectedMobileDate}):</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {classStudents.filter((s) => weeklyMatrix[s.id]?.[selectedMobileDate] === 'present').length} حاضر
                </span>
                <span className="font-bold text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  {classStudents.filter((s) => weeklyMatrix[s.id]?.[selectedMobileDate] === 'absent').length} غائب
                </span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  {classStudents.filter((s) => weeklyMatrix[s.id]?.[selectedMobileDate] === 'late').length} متأخر
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveWeekly}
                  disabled={isSaving || filteredStudents.length === 0}
                  className="min-h-[44px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'اعتماد وحفظ السجل الآن'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. Weekly Table View (Full Grid)
           ========================================================================= */}
        {attendanceViewMode === 'weekly_table' && (
          <div className="space-y-4">
            {/* Legend Strip & Fast Guide */}
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-6 flex-wrap font-bold">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-400" /> دليل الرموز:
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs">P</span>
                  <span className="text-emerald-300 font-bold">حاضر (Present)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-600 text-white font-black flex items-center justify-center text-xs">A</span>
                  <span className="text-red-300 font-bold">غائب (Absent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">E</span>
                  <span className="text-blue-300 font-bold">استئذان / عذر (Excused)</span>
                </div>
              </div>

              <div className="text-amber-300/90 text-[11px] font-medium">
                💡 انقر على أي خانة للتبديل السريع بين الحالات (P ➔ A ➔ E ➔ P)
              </div>
            </div>

            {/* Weekly Attendance Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Table Header Controls */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    جدول رصد الأسبوع ({filteredStudents.length} طالب)
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    • {selectedClass?.name}
                  </span>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث بالاسم أو كود الطالب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl ps-9 pe-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium min-h-[44px]"
                  />
                </div>
              </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2 px-2 w-10 text-center">م</th>
                  <th className="py-2 px-3 min-w-[200px]">اسم الطالب</th>
                  {weekDays.map((day) => (
                    <th key={day.date} className={`py-1.5 px-2 text-center min-w-[84px] border-r border-slate-200 ${day.isHoliday ? 'bg-amber-50/80' : ''}`}>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-black text-slate-900 text-xs">{day.dayOfWeek}</span>
                        <span className={`text-[10.5px] font-mono px-1.5 py-0.2 rounded-md ${
                          day.isToday ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500'
                        }`}>
                          {day.formattedShort}
                        </span>
                        {day.isHoliday && (
                          <span
                            className="text-[9px] bg-amber-200 text-amber-950 border border-amber-300 px-1 py-0.2 rounded font-black max-w-[82px] truncate"
                            title={day.holidayName || 'عطلة رسمية'}
                          >
                            🏖️ {day.holidayName || 'عطلة'}
                          </span>
                        )}
                        {/* Quick Day Bulk Actions */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleSetDayAllPresent(day.date)}
                            title={`تحضير يوم ${day.dayOfWeek} كاملاً حاضر (P)`}
                            className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] rounded font-black cursor-pointer transition"
                          >
                            P الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetDayAllAbsent(day.date)}
                            title={`تفريغ يوم ${day.dayOfWeek} كاملاً غائب (A)`}
                            className="px-1.5 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] rounded font-black cursor-pointer transition"
                          >
                            A الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearDay(day.date)}
                            title={`مسح رصد يوم ${day.dayOfWeek} ليصبح فارغاً`}
                            className="px-1 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] rounded font-black cursor-pointer transition"
                          >
                            —
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center w-24 border-r border-slate-200 bg-slate-50">
                    ملخص الأسبوع
                  </th>
                  <th className="py-2 px-2 text-center w-24 border-r border-slate-200">
                    نسبة الحضور
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={weekDays.length + 4} className="p-8 text-center text-slate-400 text-sm">
                      لا توجد بيانات طلاب مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    // Weekly stats for this student
                    let studentP = 0;
                    let studentA = 0;
                    let studentE = 0;
                    let studentL = 0;
                    let studentRecordedCount = 0;

                    weekDays.forEach((d) => {
                      const st = weeklyMatrix[student.id]?.[d.date];
                      if (st) {
                        studentRecordedCount++;
                        if (st === 'present') studentP++;
                        else if (st === 'absent') studentA++;
                        else if (st === 'excused') studentE++;
                        else if (st === 'late') studentL++;
                      }
                    });

                    const hasRecorded = studentRecordedCount > 0;
                    const studentWeeklyRate = hasRecorded
                      ? Math.round((studentP / studentRecordedCount) * 100)
                      : 0;

                    // Warning badge for cumulative absence
                    let warningBadge = null;
                    if (student.warningLevel === 3) {
                      warningBadge = (
                        <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-red-300 flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 text-red-600" /> قرار فصل
                        </span>
                      );
                    } else if (student.warningLevel === 2) {
                      warningBadge = (
                        <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-orange-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-600" /> إنذار 2
                        </span>
                      );
                    } else if (student.warningLevel === 1) {
                      warningBadge = (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> إنذار 1
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors hover:bg-slate-50 ${
                          studentA > 0 ? 'bg-red-50/20' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 text-center font-bold text-slate-500 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                              {student.fullName}
                            </span>
                            {warningBadge}
                          </div>
                        </td>

                        {/* Matrix Interactive Cells */}
                        {weekDays.map((day) => {
                          const status = weeklyMatrix[student.id]?.[day.date];

                          return (
                            <td
                              key={day.date}
                              className="py-1 px-1.5 text-center border-r border-slate-200/80"
                            >
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleCellClick(student.id, day.date)}
                                  className="transform active:scale-95 transition-transform cursor-pointer focus:outline-hidden"
                                  title={`انقر للتبديل | ${day.dayOfWeek} (${day.formattedShort}): ${
                                    status === 'present'
                                      ? 'حاضر (P)'
                                      : status === 'absent'
                                      ? 'غائب (A)'
                                      : status === 'excused'
                                      ? 'استئذان (E)'
                                      : status === 'late'
                                      ? 'متأخر (L)'
                                      : 'فارغ (لم يُرصد بعد)'
                                  }`}
                                >
                                  {renderStatusBadge(status, 'md')}
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Week summary badges */}
                        <td className="py-1 px-2 text-center border-r border-slate-200 bg-slate-50/80">
                          {hasRecorded ? (
                            <div className="flex items-center justify-center gap-1 font-black">
                              <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[10.5px] border border-emerald-300" title="حضور">
                                {studentP}P
                              </span>
                              <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-[10.5px] border border-red-300" title="غياب">
                                {studentA}A
                              </span>
                              {studentE > 0 && (
                                <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-[10.5px] border border-blue-300" title="استئذان">
                                  {studentE}E
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-mono">—</span>
                          )}
                        </td>

                        {/* Weekly Attendance Rate */}
                        <td className="py-1 px-2 text-center border-r border-slate-200">
                          <div className="flex flex-col items-center justify-center">
                            {hasRecorded ? (
                              <span
                                className={`font-black px-2 py-0.5 rounded text-[11px] border ${
                                  studentWeeklyRate >= 80
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : studentWeeklyRate >= 60
                                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                                    : 'bg-red-50 text-red-800 border-red-300'
                                }`}
                              >
                                {studentWeeklyRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                بانتظار الرصد
                              </span>
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

          {/* Sticky Bottom Commit Bar */}
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-20 shadow-xl border-t border-slate-800">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <span className="text-slate-400 font-medium">إجمالي سجل الأسبوع:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {totalPCount} حضور (P)
              </span>
              <span className="font-bold text-red-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> {totalACount} غياب (A)
              </span>
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span> {totalECount} استئذان (E)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer text-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                تصدير Excel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                طباعة A4
              </button>

              <button
                type="button"
                onClick={handleSaveWeekly}
                disabled={isSaving || filteredStudents.length === 0}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'جارٍ الاعتماد والحفظ...' : 'اعتماد وحفظ سجل الأسبوع'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  </div>
  );
};
