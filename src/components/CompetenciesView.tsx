'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  CompetencyAttendanceStatus,
  CompetencyUnit,
  LearningOutcome,
  StudentCompetencyAssessment,
  CompetencyEvaluationResult,
  GradeLevel,
} from '@/types';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  Filter,
  Printer,
  Wrench,
  BookOpen,
  Info,
  ShieldAlert,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Clock,
  ChevronDown,
  UserCheck,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  getCompetencyUnits,
  saveCompetencyUnit,
  deleteCompetencyUnit,
  getCompetencyAssessments,
  saveCompetencyAssessment,
  bulkSaveCompetencyAssessments,
} from '@/lib/storage';

interface CompetenciesViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  currentUser: User;
}

export const CompetenciesView: React.FC<CompetenciesViewProps> = ({
  students,
  classes,
  departments,
  schoolConfig,
  currentUser,
}) => {
  const isFullAdmin =
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  const defaultDept = !isFullAdmin && currentUser.departmentId ? currentUser.departmentId : (departments[0]?.id || 'all');

  // Active Main Sub-Tab
  const [subTab, setSubTab] = useState<'assessment' | 'units_catalog' | 'attendance_eligibility'>('assessment');

  // Competency Units & Assessments State from Storage
  const [units, setUnits] = useState<CompetencyUnit[]>([]);
  const [assessments, setAssessments] = useState<StudentCompetencyAssessment[]>([]);

  // Filters for Assessment Tab
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDept);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>(1);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Unit Creation / Editing
  const [isUnitModalOpen, setIsUnitModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<CompetencyUnit | null>(null);
  const [unitFormCode, setUnitFormCode] = useState<string>('');
  const [unitFormName, setUnitFormName] = useState<string>('');
  const [unitFormDeptId, setUnitFormDeptId] = useState<string>(departments[0]?.id || 'dept_elec');
  const [unitFormGrade, setUnitFormGrade] = useState<GradeLevel>(1);
  const [unitFormTerm, setUnitFormTerm] = useState<'term_1' | 'term_2' | 'full_year'>('term_1');
  const [unitFormHours, setUnitFormHours] = useState<number>(40);
  const [unitFormDescription, setUnitFormDescription] = useState<string>('');
  const [unitFormOutcomes, setUnitFormOutcomes] = useState<{ id: string; code: string; title: string; weightHours?: number }[]>([
    { id: 'lo_1', code: 'LO 1', title: 'تطبيق إجراءات واشتراطات السلامة المهنية' },
    { id: 'lo_2', code: 'LO 2', title: 'تنفيذ المهارة الأساسية باستخدام العدد والمعدات' },
    { id: 'lo_3', code: 'LO 3', title: 'فحص واختبار جودة المنتج الفني المنجز' },
  ]);

  // Modal for Official Print / Dossier
  const [printModalStudent, setPrintModalStudent] = useState<Student | null>(null);
  const [printClassSheet, setPrintClassSheet] = useState<boolean>(false);
  const [printAssessorTeacher, setPrintAssessorTeacher] = useState<string>('');
  const [printInternalVerifier, setPrintInternalVerifier] = useState<string>('');
  const [printExternalVerifier, setPrintExternalVerifier] = useState<string>('');

  // Success Notification banner
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Bulk Quick Action Ribbon Collapsible State
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState<boolean>(true);

  // Load data on mount and on storage updates
  useEffect(() => {
    loadCompetencyData();

    const handleStorageUpdate = () => {
      loadCompetencyData();
    };

    window.addEventListener('egyptian_school_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('egyptian_school_storage_update', handleStorageUpdate);
    };
  }, []);

  const loadCompetencyData = () => {
    const loadedUnits = getCompetencyUnits();
    const loadedAssessments = getCompetencyAssessments();
    setUnits(loadedUnits);
    setAssessments(loadedAssessments);

    // Auto-select first available unit matching department and grade if not set
    if (loadedUnits.length > 0) {
      setSelectedUnitId((prev) => {
        if (prev && loadedUnits.some((u) => u.id === prev)) return prev;
        const match = loadedUnits.find(
          (u) =>
            (selectedDeptId === 'all' || u.departmentId === selectedDeptId) &&
            (selectedGrade === 'all' || u.gradeLevel === selectedGrade)
        );
        return match ? match.id : loadedUnits[0].id;
      });
    }
  };

  // Filtered classes based on selected department and grade
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDeptId !== 'all' && c.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && c.gradeLevel !== selectedGrade) return false;
      return true;
    });
  }, [classes, selectedDeptId, selectedGrade]);

  // Filtered units matching dept and grade
  const availableUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedDeptId !== 'all' && u.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && u.gradeLevel !== selectedGrade) return false;
      return true;
    });
  }, [units, selectedDeptId, selectedGrade]);

  // Active Selected Unit
  const currentUnit = useMemo(() => {
    return units.find((u) => u.id === selectedUnitId) || availableUnits[0] || null;
  }, [units, selectedUnitId, availableUnits]);

  // Filtered Students for the active selection
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (selectedDeptId !== 'all' && student.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && student.gradeLevel !== selectedGrade) return false;
      if (selectedClassId !== 'all' && student.classId !== selectedClassId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = student.fullName.toLowerCase().includes(q);
        const matchCode = student.studentCode.toLowerCase().includes(q);
        const matchNid = student.nationalId.includes(q);
        if (!matchName && !matchCode && !matchNid) return false;
      }

      return true;
    }).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base' }));
  }, [students, selectedDeptId, selectedGrade, selectedClassId, searchQuery]);

  // Handler: Open Add Unit Modal
  const handleOpenAddUnitModal = () => {
    setEditingUnit(null);
    setUnitFormCode(`MOD-${Math.floor(100 + Math.random() * 900)}`);
    setUnitFormName('');
    setUnitFormDeptId(selectedDeptId !== 'all' ? selectedDeptId : departments[0]?.id || 'dept_elec');
    setUnitFormGrade(typeof selectedGrade === 'number' ? selectedGrade : 1);
    setUnitFormTerm('term_1');
    setUnitFormHours(40);
    setUnitFormDescription('');
    setUnitFormOutcomes([
      { id: `lo_${Date.now()}_1`, code: 'LO 1', title: 'تجهيز مهمات وأدوات العمل والالتزام باشتراطات السلامة' },
      { id: `lo_${Date.now()}_2`, code: 'LO 2', title: 'تنفيذ خطوات العمليات المهارية بدقة طبقا لبطاقة التعليمات' },
      { id: `lo_${Date.now()}_3`, code: 'LO 3', title: 'فحص واختبار جودة المنتج النهائي وإعداد تقرير التسليم' },
    ]);
    setIsUnitModalOpen(true);
  };

  // Handler: Open Edit Unit Modal
  const handleOpenEditUnitModal = (unit: CompetencyUnit) => {
    setEditingUnit(unit);
    setUnitFormCode(unit.code);
    setUnitFormName(unit.name);
    setUnitFormDeptId(unit.departmentId);
    setUnitFormGrade(unit.gradeLevel);
    setUnitFormTerm(unit.term);
    setUnitFormHours(unit.totalHours);
    setUnitFormDescription(unit.description || '');
    setUnitFormOutcomes(
      unit.outcomes && unit.outcomes.length > 0
        ? unit.outcomes.map((o) => ({ ...o }))
        : [
            { id: `lo_${Date.now()}_1`, code: 'LO 1', title: 'المخرج الأول للوحدة' },
            { id: `lo_${Date.now()}_2`, code: 'LO 2', title: 'المخرج الثاني للوحدة' },
          ]
    );
    setIsUnitModalOpen(true);
  };

  // Add LO Row in Unit Modal
  const handleAddOutcomeRow = () => {
    const nextIdx = unitFormOutcomes.length + 1;
    setUnitFormOutcomes([
      ...unitFormOutcomes,
      { id: `lo_${Date.now()}_${nextIdx}`, code: `LO ${nextIdx}`, title: '' },
    ]);
  };

  // Remove LO Row in Unit Modal
  const handleRemoveOutcomeRow = (idx: number) => {
    if (unitFormOutcomes.length <= 1) return;
    const next = unitFormOutcomes.filter((_, i) => i !== idx);
    setUnitFormOutcomes(next);
  };

  // Save Unit Form
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitFormName.trim()) {
      alert('يرجى إدخال اسم الوحدة الدراسية');
      return;
    }

    const cleanOutcomes: LearningOutcome[] = unitFormOutcomes
      .filter((o) => o.title.trim().length > 0)
      .map((o, idx) => ({
        id: o.id || `lo_${Date.now()}_${idx + 1}`,
        code: `LO ${idx + 1}`,
        title: o.title.trim(),
        weightHours: o.weightHours,
      }));

    if (cleanOutcomes.length === 0) {
      alert('يرجى إدخال مخرج تعلم واحد على الأقل للوحدة');
      return;
    }

    const unitPayload: Omit<CompetencyUnit, 'id'> & { id?: string } = {
      id: editingUnit ? editingUnit.id : undefined,
      code: unitFormCode.trim() || 'MOD-101',
      name: unitFormName.trim(),
      departmentId: unitFormDeptId,
      gradeLevel: unitFormGrade,
      term: unitFormTerm,
      totalHours: unitFormHours,
      description: unitFormDescription.trim(),
      outcomesCount: cleanOutcomes.length,
      outcomes: cleanOutcomes,
    };

    const saved = saveCompetencyUnit(unitPayload);
    loadCompetencyData();
    setSelectedUnitId(saved.id);
    setIsUnitModalOpen(false);
    showSuccessNotification('تم حفظ بيانات وحدة الجدارات ومخرجات التعلم بنجاح');
  };

  // Delete Unit
  const handleDeleteUnit = (unitId: string, unitName: string) => {
    if (confirm(`هل أنت متأكد من حذف وحدة "${unitName}" وكافة تقييمات مخرجاتها المرتبطة؟`)) {
      deleteCompetencyUnit(unitId);
      loadCompetencyData();
      showSuccessNotification('تم حذف وحدة الجدارات بنجاح');
    }
  };

  // Get Assessment record for a student, unit, and outcome
  const getAssessmentRecord = (studentId: string, unitId: string, outcomeId: string): StudentCompetencyAssessment | undefined => {
    return assessments.find(
      (a) => a.studentId === studentId && a.unitId === unitId && a.outcomeId === outcomeId
    );
  };

  // Quick Change Evaluation Result
  const handleUpdateStudentResult = (
    student: Student,
    outcome: LearningOutcome,
    newResult: CompetencyEvaluationResult
  ) => {
    if (!currentUnit) return;

    const existing = getAssessmentRecord(student.id, currentUnit.id, outcome.id);
    const today = new Date().toISOString().split('T')[0];

    let firstDate = existing?.firstAttemptDate;
    let secondDate = existing?.secondAttemptDate;
    let remDate = existing?.remedialDate;

    if (newResult === 'first_attempt_pass') {
      firstDate = firstDate || today;
    } else if (newResult === 'second_attempt_pass') {
      firstDate = firstDate || today;
      secondDate = secondDate || today;
    } else if (newResult === 'remedial_program') {
      firstDate = firstDate || today;
      secondDate = secondDate || today;
      remDate = remDate || today;
    }

    const updatedAssessment: StudentCompetencyAssessment = {
      id: existing?.id || `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: student.fullName,
      nationalId: student.nationalId,
      studentCode: student.studentCode,
      classId: student.classId,
      departmentId: student.departmentId,
      gradeLevel: student.gradeLevel,
      unitId: currentUnit.id,
      unitCode: currentUnit.code,
      unitName: currentUnit.name,
      outcomeId: outcome.id,
      outcomeCode: outcome.code,
      outcomeTitle: outcome.title,
      result: newResult,
      firstAttemptDate: firstDate,
      secondAttemptDate: secondDate,
      remedialDate: remDate,
      assessorTeacherName: existing?.assessorTeacherName || (currentUser.role === 'teacher' ? currentUser.name : ''),
      internalVerifierName: existing?.internalVerifierName || '',
      notes: existing?.notes,
      updatedAt: new Date().toISOString(),
    };

    saveCompetencyAssessment(updatedAssessment);
    loadCompetencyData();
  };

  // Update Evaluation Dates (Immediate Auto-Save)
  const handleUpdateAssessmentDates = (
    student: Student,
    outcome: LearningOutcome,
    field: 'firstAttemptDate' | 'secondAttemptDate' | 'remedialDate',
    val: string
  ) => {
    if (!currentUnit) return;
    const existing = getAssessmentRecord(student.id, currentUnit.id, outcome.id);
    const today = new Date().toISOString().split('T')[0];

    // Determine default result if not yet assigned
    let currentResult: CompetencyEvaluationResult = existing?.result || 'first_attempt_pass';
    if (field === 'secondAttemptDate' && (!existing || existing.result === 'pending' || existing.result === 'first_attempt_pass')) {
      currentResult = 'second_attempt_pass';
    } else if (field === 'remedialDate' && (!existing || existing.result === 'pending' || existing.result === 'first_attempt_pass' || existing.result === 'second_attempt_pass')) {
      currentResult = 'remedial_program';
    }

    const updatedRecord: StudentCompetencyAssessment = {
      id: existing?.id || `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentName: student.fullName,
      nationalId: student.nationalId,
      studentCode: student.studentCode,
      classId: student.classId,
      departmentId: student.departmentId,
      gradeLevel: student.gradeLevel,
      unitId: currentUnit.id,
      unitCode: currentUnit.code,
      unitName: currentUnit.name,
      outcomeId: outcome.id,
      outcomeCode: outcome.code,
      outcomeTitle: outcome.title,
      result: currentResult,
      firstAttemptDate: field === 'firstAttemptDate' ? val : (existing?.firstAttemptDate || today),
      secondAttemptDate: field === 'secondAttemptDate' ? val : existing?.secondAttemptDate,
      remedialDate: field === 'remedialDate' ? val : existing?.remedialDate,
      assessorTeacherName: existing?.assessorTeacherName || (currentUser.role === 'teacher' ? currentUser.name : ''),
      internalVerifierName: existing?.internalVerifierName || '',
      notes: existing?.notes,
      updatedAt: new Date().toISOString(),
    };

    saveCompetencyAssessment(updatedRecord);
    loadCompetencyData();
  };

  // Bulk Apply Result to all visible students for an outcome
  const handleBulkApplyResult = (outcome: LearningOutcome, result: CompetencyEvaluationResult) => {
    if (!currentUnit || filteredStudents.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    const bulkRecords: StudentCompetencyAssessment[] = filteredStudents.map((student) => {
      const existing = getAssessmentRecord(student.id, currentUnit.id, outcome.id);
      return {
        id: existing?.id || `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: student.id,
        studentName: student.fullName,
        nationalId: student.nationalId,
        studentCode: student.studentCode,
        classId: student.classId,
        departmentId: student.departmentId,
        gradeLevel: student.gradeLevel,
        unitId: currentUnit.id,
        unitCode: currentUnit.code,
        unitName: currentUnit.name,
        outcomeId: outcome.id,
        outcomeCode: outcome.code,
        outcomeTitle: outcome.title,
        result: result,
        firstAttemptDate: result === 'first_attempt_pass' ? (existing?.firstAttemptDate || today) : existing?.firstAttemptDate,
        secondAttemptDate: result === 'second_attempt_pass' ? (existing?.secondAttemptDate || today) : existing?.secondAttemptDate,
        remedialDate: result === 'remedial_program' ? (existing?.remedialDate || today) : existing?.remedialDate,
        assessorTeacherName: existing?.assessorTeacherName || (currentUser.role === 'teacher' ? currentUser.name : ''),
        internalVerifierName: existing?.internalVerifierName || '',
        updatedAt: new Date().toISOString(),
      };
    });

    bulkSaveCompetencyAssessments(bulkRecords);
    loadCompetencyData();
    showSuccessNotification(`تم رصد حالة (${getResultLabel(result)}) لكافة طلاب الفصل بنجاح`);
  };

  // Helper Labels and Badges
  const getResultLabel = (result?: CompetencyEvaluationResult): string => {
    switch (result) {
      case 'first_attempt_pass':
        return 'اجتاز من المرة الأولى';
      case 'second_attempt_pass':
        return 'اجتاز من الفترة الثانية';
      case 'remedial_program':
        return 'برنامج علاجي';
      case 'not_competent':
        return 'لم يجتاز (غير جدير)';
      default:
        return 'قيد التقييم';
    }
  };

  const getResultBadge = (result?: CompetencyEvaluationResult) => {
    switch (result) {
      case 'first_attempt_pass':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> اجتاز من المرة الأولى
          </span>
        );
      case 'second_attempt_pass':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
            <Check className="w-3.5 h-3.5 text-blue-600" /> اجتاز من الفترة الثانية
          </span>
        );
      case 'remedial_program':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> برنامج علاجي
          </span>
        );
      case 'not_competent':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded-md text-[11px]">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> لم يجتاز
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 font-bold px-2 py-0.5 rounded-md text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> قيد التقييم
          </span>
        );
    }
  };

  const showSuccessNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Statistics calculation for current view
  const currentUnitStats = useMemo(() => {
    if (!currentUnit || filteredStudents.length === 0) {
      return { total: 0, firstPass: 0, secondPass: 0, remedial: 0, notComp: 0, pending: 0, passRate: 0 };
    }

    const totalEvals = filteredStudents.length * currentUnit.outcomes.length;
    let firstPass = 0;
    let secondPass = 0;
    let remedial = 0;
    let notComp = 0;

    filteredStudents.forEach((student) => {
      currentUnit.outcomes.forEach((outcome) => {
        const record = getAssessmentRecord(student.id, currentUnit.id, outcome.id);
        if (record?.result === 'first_attempt_pass') firstPass++;
        else if (record?.result === 'second_attempt_pass') secondPass++;
        else if (record?.result === 'remedial_program') remedial++;
        else if (record?.result === 'not_competent') notComp++;
      });
    });

    const pending = totalEvals - (firstPass + secondPass + remedial + notComp);
    return {
      total: totalEvals,
      firstPass,
      secondPass,
      remedial,
      notComp,
      pending,
      passRate: totalEvals > 0 ? Math.round(((firstPass + secondPass) / totalEvals) * 100) : 0,
    };
  }, [currentUnit, filteredStudents, assessments]);

  return (
    <div className="space-y-6">
      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white font-bold p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in no-print">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            {saveSuccessMsg}
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 px-3 py-1 rounded-lg cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-amber-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> اللائحة الرسمية للتقييم والتحقق لمنظومة الجدارات الفنية
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10.5px] px-2 py-0.2 rounded-full font-mono font-bold border border-emerald-500/30">
              العام الدراسي {schoolConfig.academicYear}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-amber-400">
            منظومة إدارة وحدات ومخرجات الجدارات وتقييم الطلاب
          </h2>
          <p className="text-[11px] text-slate-300 max-w-3xl leading-relaxed">
            رصد نتائج تقييم مخرجات التعلم بكل وحدة دراسية: (اجتاز 1 - اجتاز 2 - علاج - لم يجتز)، واعتماد نسب الحضور العملية بالورش (85%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const targetClass = classes.find((c) => c.id === selectedClassId);
              const targetDept = departments.find((d) => d.id === selectedDeptId);
              setPrintAssessorTeacher(targetClass?.supervisorTeacherName || (currentUser.role === 'teacher' ? currentUser.name : ''));
              setPrintInternalVerifier(targetDept?.practicalSupervisorName || targetDept?.scientificSupervisorName || '');
              setPrintExternalVerifier('');
              setPrintClassSheet(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة كشف رصد الجدارات
          </button>
          <button
            onClick={handleOpenAddUnitModal}
            className="bg-white hover:bg-slate-100 text-slate-900 font-black px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600" /> إضافة وحدة جدارات
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setSubTab('assessment')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'assessment'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>رصد وتقييم الطلاب في مخرجات الوحدات</span>
          <span className="bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {filteredStudents.length} طالب
          </span>
        </button>

        <button
          onClick={() => setSubTab('units_catalog')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'units_catalog'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دليل وبنك وحدات الجدارات ومخرجاتها</span>
          <span className="bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {units.length} وحدة
          </span>
        </button>

        <button
          onClick={() => setSubTab('attendance_eligibility')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'attendance_eligibility'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>كشف استيفاء حضور الورش (85%) والتحقق</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: ASSESSMENT AND GRADING MATRIX                 */}
      {/* ======================================================== */}
      {subTab === 'assessment' && (
        <div className="space-y-6 no-print">
          {/* Top Filter and Module Selector Strip */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Department Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">التخصص / القسم الصناعي</label>
                <select
                  value={selectedDeptId}
                  disabled={!isFullAdmin && departments.length <= 1}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedClassId('all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 disabled:opacity-80"
                >
                  {isFullAdmin && <option value="all">جميع الأقسام والتخصصات</option>}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel));
                    setSelectedClassId('all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">جميع الصفوف</option>
                  <option value="1">الصف الأول الصناعي</option>
                  <option value="2">الصف الثاني الصناعي</option>
                  <option value="3">الصف الثالث الصناعي (دبلوم)</option>
                  <option value="4">الفرقة الرابعة (نظام متقدم 5 سنوات)</option>
                  <option value="5">الفرقة الخامسة (نظام متقدم 5 سنوات)</option>
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الفصل الدراسي</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">جميع فصول الصف</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Search */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث سريع عن طالب</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="اسم الطالب أو الكود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Competency Unit Selector Card Bar */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> اختر وحدة الجدارات المراد رصدها وتقييمها:
                </span>
                {availableUnits.length === 0 && (
                  <button
                    onClick={handleOpenAddUnitModal}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                  >
                    + اضغط هنا لإضافة أول وحدة لهذا التخصص والصف
                  </button>
                )}
              </div>

              {availableUnits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {availableUnits.map((u) => {
                    const isSelected = u.id === (currentUnit?.id || '');
                    return (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUnitId(u.id)}
                        className={`text-right p-3 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold ring-2 ring-amber-400'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-black ${
                              isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {u.code}
                          </span>
                          <span className="text-[11px] font-bold">
                            {u.outcomesCount || u.outcomes?.length || 0} مخرجات تعلم
                          </span>
                        </div>
                        <div className="font-black text-xs mt-2 line-clamp-2">{u.name}</div>
                        <div
                          className={`text-[10px] mt-2 flex items-center justify-between ${
                            isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'
                          }`}
                        >
                          <span>{u.totalHours} ساعة تدريبية</span>
                          <span>
                            {u.term === 'term_1' ? 'ترم 1' : u.term === 'term_2' ? 'ترم 2' : 'عام كامل'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-xs text-amber-900 font-bold">
                  لا توجد وحدات جدارات مضافة للتخصص والصف المحددين حالياً. يمكنك الضغط على "إضافة وحدة جدارات جديدة" في الأعلى لإضافتها.
                </div>
              )}
            </div>
          </div>

          {/* Current Active Unit Assessment Matrix */}
          {currentUnit && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              {/* Active Unit Header Strip */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded-md">
                      {currentUnit.code}
                    </span>
                    <h3 className="text-base font-black text-amber-300">{currentUnit.name}</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    عدد مخرجات التعلم المقررة بالوحدة:{' '}
                    <strong className="text-white font-mono">{currentUnit.outcomes.length} مخرجات</strong> | إجمالي الساعات: {currentUnit.totalHours} ساعة
                  </p>
                </div>

                {/* Performance Summary Pill */}
                <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">نسبة الاجتياز العامة:</span>
                    <span className="text-emerald-400 font-black font-mono text-sm">{currentUnitStats.passRate}%</span>
                  </div>
                  <div className="h-6 w-px bg-slate-700" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">المرة الأولى:</span>
                    <span className="text-emerald-300 font-bold font-mono">{currentUnitStats.firstPass}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الفترة الثانية:</span>
                    <span className="text-blue-300 font-bold font-mono">{currentUnitStats.secondPass}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">علاجي:</span>
                    <span className="text-amber-300 font-bold font-mono">{currentUnitStats.remedial}</span>
                  </div>
                </div>
              </div>

              {/* Assessment Outcomes Description & Compact Bulk Actions */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-900 border border-amber-500/30 text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>مخرجات التعلم والرصد الجماعي السريع</span>
                    </span>
                    <span className="text-slate-500 font-normal text-[11px] hidden sm:inline">
                      (رصد نتيجة موحدة لجميع طلاب الفصل بنقرة واحدة)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBulkActionsOpen((prev) => !prev)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-100 transition"
                  >
                    <span>{isBulkActionsOpen ? 'تقليص شريط المخرجات ▲' : 'إظهار مخرجات التعلم والرصد السريع ▼'}</span>
                  </button>
                </div>

                {isBulkActionsOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                    {currentUnit.outcomes.map((lo, loIdx) => (
                      <div
                        key={lo.id}
                        className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between gap-2 shadow-2xs hover:border-amber-300 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="bg-amber-100 text-amber-900 text-[9.5px] font-mono font-black px-1.5 py-0.2 rounded">
                              {lo.code || `LO ${loIdx + 1}`}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-bold">مخرج {loIdx + 1}</span>
                          </div>
                          <div
                            className="font-bold text-xs text-slate-800 leading-snug line-clamp-2"
                            title={lo.title}
                          >
                            {lo.title}
                          </div>
                        </div>

                        {/* Ultra-compact inline bulk buttons */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                          <span className="text-[9.5px] font-bold text-slate-400 shrink-0">رصد جماعي:</span>
                          <div className="flex items-center gap-1">
                            <button
                              title="رصد اجتياز من المرة الأولى لكل الطلاب"
                              onClick={() => handleBulkApplyResult(lo, 'first_attempt_pass')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              🟢 أولى
                            </button>
                            <button
                              title="رصد اجتياز من الفترة الثانية لكل الطلاب"
                              onClick={() => handleBulkApplyResult(lo, 'second_attempt_pass')}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              🔵 ثانية
                            </button>
                            <button
                              title="رصد برنامج علاجي لكل الطلاب"
                              onClick={() => handleBulkApplyResult(lo, 'remedial_program')}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md transition cursor-pointer"
                            >
                              🟡 علاجي
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Student Assessment Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-900 text-slate-100 font-bold">
                      <tr>
                        <th className="p-3 text-center w-10">م</th>
                        <th className="p-3 min-w-[180px]">بيانات الطالب</th>
                        <th className="p-3 text-center">الفصل</th>
                        <th className="p-3 text-center min-w-[100px]">حضور الورش (85%)</th>
                        {currentUnit.outcomes.map((lo, loIdx) => (
                          <th key={lo.id} className="p-3 text-center min-w-[240px] border-r border-slate-800">
                            <div>{lo.code || `LO ${loIdx + 1}`}</div>
                            <div className="text-[10px] font-normal text-slate-300 line-clamp-1 max-w-[220px]">
                              {lo.title}
                            </div>
                          </th>
                        ))}
                        <th className="p-3 text-center no-print">بطاقة التقييم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4 + currentUnit.outcomes.length + 1}
                            className="p-8 text-center text-slate-400 font-bold"
                          >
                            لا يوجد طلاب مطابقون لمعايير البحث المحددة
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const targetClass = classes.find((c) => c.id === student.classId);
                          const pracAbs = student.workshopAbsenceHours || 0;
                          const pracRate = Math.max(0, Math.round(((120 - pracAbs) / 120) * 100));
                          const isEligible = pracRate >= schoolConfig.practicalMinAttendanceRate;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 text-center text-slate-400 font-mono font-bold">
                                {idx + 1}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {student.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                  <span>كود: {student.studentCode}</span>
                                  <span>رقم قومي: {student.nationalId}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[11px] font-bold">
                                  {targetClass?.name || 'فصل غير محدد'}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                    isEligible
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {pracRate}% {isEligible ? '✓' : '✗'}
                                </span>
                              </td>

                              {/* Outcomes Result Dropdown & Dates */}
                              {currentUnit.outcomes.map((lo) => {
                                const record = getAssessmentRecord(student.id, currentUnit.id, lo.id);
                                const result = record?.result || 'pending';

                                return (
                                  <td
                                    key={lo.id}
                                    className="p-3 border-r border-slate-200 bg-slate-50/40 align-top"
                                  >
                                    <div className="space-y-2">
                                      {/* Evaluation Status Selector */}
                                      <select
                                        value={result}
                                        onChange={(e) =>
                                          handleUpdateStudentResult(
                                            student,
                                            lo,
                                            e.target.value as CompetencyEvaluationResult
                                          )
                                        }
                                        className={`w-full text-xs font-bold p-1.5 rounded-lg border transition cursor-pointer ${
                                          result === 'first_attempt_pass'
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                            : result === 'second_attempt_pass'
                                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                                            : result === 'remedial_program'
                                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                                            : result === 'not_competent'
                                            ? 'bg-red-50 text-red-900 border-red-300'
                                            : 'bg-white text-slate-700 border-slate-300'
                                        }`}
                                      >
                                        <option value="pending">⏳ قيد التقييم / لم يرصد</option>
                                        <option value="first_attempt_pass">🟢 اجتاز من المرة الأولى</option>
                                        <option value="second_attempt_pass">🔵 اجتاز من الفترة الثانية</option>
                                        <option value="remedial_program">🟡 برنامج علاجي</option>
                                        <option value="not_competent">🔴 لم يجتاز (غير جدير)</option>
                                      </select>

                                      {/* Assessment Dates Strip */}
                                      <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] space-y-1.5">
                                        {/* First Attempt Date */}
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="text-slate-600 font-bold">تاريخ الأولى:</span>
                                          <input
                                            type="date"
                                            value={record?.firstAttemptDate || ''}
                                            onChange={(e) =>
                                              handleUpdateAssessmentDates(
                                                student,
                                                lo,
                                                'firstAttemptDate',
                                                e.target.value
                                              )
                                            }
                                            className="border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono text-slate-800 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-amber-500"
                                          />
                                        </div>

                                        {/* Second Attempt Date */}
                                        {(result === 'second_attempt_pass' ||
                                          result === 'remedial_program' ||
                                          result === 'not_competent') && (
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-blue-600 font-bold">تاريخ الثانية:</span>
                                            <input
                                              type="date"
                                              value={record?.secondAttemptDate || ''}
                                              onChange={(e) =>
                                                handleUpdateAssessmentDates(
                                                  student,
                                                  lo,
                                                  'secondAttemptDate',
                                                  e.target.value
                                                )
                                              }
                                              className="border border-blue-200 rounded px-1 py-0.5 text-[10px] font-mono text-slate-800 bg-blue-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                            />
                                          </div>
                                        )}

                                        {/* Remedial Date */}
                                        {(result === 'remedial_program' || result === 'not_competent') && (
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="text-amber-700 font-bold">تاريخ العلاجي:</span>
                                            <input
                                              type="date"
                                              value={record?.remedialDate || ''}
                                              onChange={(e) =>
                                                handleUpdateAssessmentDates(
                                                  student,
                                                  lo,
                                                  'remedialDate',
                                                  e.target.value
                                                )
                                              }
                                              className="border border-amber-200 rounded px-1 py-0.5 text-[10px] font-mono text-slate-800 bg-amber-50/50 focus:bg-white focus:ring-1 focus:ring-amber-500"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Student Dossier Button */}
                              <td className="p-3 text-center no-print align-middle">
                                <button
                                  onClick={() => setPrintModalStudent(student)}
                                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
                                >
                                  <FileCheck className="w-3.5 h-3.5" /> استمارة التقييم
                                </button>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: UNITS & LEARNING OUTCOMES CATALOG             */}
      {/* ======================================================== */}
      {subTab === 'units_catalog' && (
        <div className="space-y-6 no-print">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  دليل وحدات الجدارات ومخرجات التعلم المعتمدة بالخطة الدراسية
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  إضافة وتعديل وحدات المنهج لكل تخصص وصف دراسي مع تحديد عدد المخرجات وعناوينها وساعاتها.
                </p>
              </div>

              <button
                onClick={handleOpenAddUnitModal}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> إضافة وحدة جدارات جديدة
              </button>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => {
                const targetDept = departments.find((d) => d.id === unit.departmentId);

                return (
                  <div
                    key={unit.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="bg-slate-900 text-amber-400 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                          {unit.code}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditUnitModal(unit)}
                            title="تعديل الوحدة والمخرجات"
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-white rounded-lg transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(unit.id, unit.name)}
                            title="حذف الوحدة"
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-900 text-sm leading-snug">{unit.name}</h4>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <strong>التخصص:</strong> {targetDept?.name || unit.departmentId}
                        </div>
                        <div>
                          <strong>الصف الدراسي:</strong> الصف {unit.gradeLevel} الصناعي |{' '}
                          <strong>الفصل:</strong>{' '}
                          {unit.term === 'term_1' ? 'الترم الأول' : unit.term === 'term_2' ? 'الترم الثاني' : 'ممتدة'}
                        </div>
                        <div>
                          <strong>إجمالي الساعات:</strong> {unit.totalHours} ساعة تدريبية
                        </div>
                      </div>

                      {/* Outcomes preview list */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>مخرجات التعلم المقررة:</span>
                          <span className="font-mono text-amber-700">{unit.outcomes?.length || 0} مخرجات</span>
                        </div>
                        <div className="space-y-1">
                          {unit.outcomes?.map((lo, lIdx) => (
                            <div
                              key={lo.id || lIdx}
                              className="text-[11px] text-slate-700 bg-white p-1.5 rounded-lg border border-slate-100 flex items-start gap-1.5"
                            >
                              <span className="bg-amber-100 text-amber-900 font-mono text-[9px] px-1 py-0.5 rounded font-bold">
                                {lo.code || `LO ${lIdx + 1}`}
                              </span>
                              <span className="line-clamp-1">{lo.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedDeptId(unit.departmentId);
                        setSelectedGrade(unit.gradeLevel);
                        setSelectedUnitId(unit.id);
                        setSubTab('assessment');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4" /> فتح جدول رصد نتائج الطلاب
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: ATTENDANCE ELIGIBILITY (85% WORKSHOPS)        */}
      {/* ======================================================== */}
      {subTab === 'attendance_eligibility' && (
        <div className="space-y-6 no-print">
          {/* Eligibility Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-bold">إجمالي طلاب المنظومة</div>
                <div className="text-2xl font-black text-slate-900">{students.length}</div>
                <div className="text-[10px] text-slate-400">جميع البرامج المهنية</div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-emerald-700 font-bold">مستوفون للنسبة (مؤهلون للتقييم)</div>
                <div className="text-2xl font-black text-emerald-900">
                  {
                    students.filter((s) => {
                      const pracRate = Math.max(0, Math.round(((120 - (s.workshopAbsenceHours || 0)) / 120) * 100));
                      const theoRate = Math.max(0, Math.round(((60 - s.totalAbsenceDays) / 60) * 100));
                      return pracRate >= schoolConfig.practicalMinAttendanceRate && theoRate >= schoolConfig.theoreticalMinAttendanceRate;
                    }).length
                  }
                </div>
                <div className="text-[10px] text-emerald-700">حققوا نسبة الحضور المطلوبة (85% ورش)</div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-black">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-amber-800 font-bold">في منطقة الخطر</div>
                <div className="text-2xl font-black text-amber-900">
                  {
                    students.filter((s) => {
                      const pracRate = Math.max(0, Math.round(((120 - (s.workshopAbsenceHours || 0)) / 120) * 100));
                      return pracRate < schoolConfig.practicalMinAttendanceRate + 5 && pracRate >= schoolConfig.practicalMinAttendanceRate;
                    }).length
                  }
                </div>
                <div className="text-[10px] text-amber-700">غياب مقارب للحد القانوني</div>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-black">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-red-700 font-bold">محرومون من التقييم</div>
                <div className="text-2xl font-black text-red-900">
                  {
                    students.filter((s) => {
                      const pracRate = Math.max(0, Math.round(((120 - (s.workshopAbsenceHours || 0)) / 120) * 100));
                      return pracRate < schoolConfig.practicalMinAttendanceRate;
                    }).length
                  }
                </div>
                <div className="text-[10px] text-red-700">تجاوزوا نسبة غياب الورش (أقل من 85%)</div>
              </div>
            </div>
          </div>

          {/* Students Eligibility List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-900 text-slate-100 font-bold">
                  <tr>
                    <th className="p-3 text-center w-10">م</th>
                    <th className="p-3">بيانات الطالب</th>
                    <th className="p-3">القسم / الفصل</th>
                    <th className="p-3 text-center">غياب الورش (ساعات)</th>
                    <th className="p-3 text-center">نسبة حضور الورش % (الحد {schoolConfig.practicalMinAttendanceRate}%)</th>
                    <th className="p-3 text-center">نسبة حضور النظري % (الحد {schoolConfig.theoreticalMinAttendanceRate}%)</th>
                    <th className="p-3 text-center">موقف أحقية التقييم</th>
                    <th className="p-3 text-center no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredStudents.map((student, idx) => {
                    const targetClass = classes.find((c) => c.id === student.classId);
                    const targetDept = departments.find((d) => d.id === student.departmentId);
                    const pracAbs = student.workshopAbsenceHours || 0;
                    const pracRate = Math.max(0, Math.round(((120 - pracAbs) / 120) * 100));
                    const theoAbs = student.totalAbsenceDays || 0;
                    const theoRate = Math.max(0, Math.round(((60 - theoAbs) / 60) * 100));

                    const isPracFail = pracRate < schoolConfig.practicalMinAttendanceRate;
                    const isTheoFail = theoRate < schoolConfig.theoreticalMinAttendanceRate;
                    const isAtRisk =
                      !isPracFail &&
                      !isTheoFail &&
                      (pracRate < schoolConfig.practicalMinAttendanceRate + 5 ||
                        theoRate < schoolConfig.theoreticalMinAttendanceRate + 5);

                    let statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مستوفٍ للتقييم
                      </span>
                    );

                    if (isPracFail || isTheoFail) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> محروم من التقييم
                        </span>
                      );
                    } else if (isAtRisk) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> في خطر الحرمان
                        </span>
                      );
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>كود: {student.studentCode}</span>
                            <span>رقم قومي: {student.nationalId}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{targetDept?.name || 'تخصص عام'}</div>
                          <div className="text-[11px] text-slate-500">{targetClass?.name || 'فصل غير محدد'}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">
                          {pracAbs} ساعة
                          {student.workshopEscapeCount > 0 && (
                            <div className="text-[10px] text-red-600 font-bold">
                              (منها {student.workshopEscapeCount} مرات تزويغ)
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div
                            className={`font-black font-mono text-sm ${
                              isPracFail ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {pracRate}%
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div
                            className={`font-black font-mono text-sm ${
                              isTheoFail ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {theoRate}%
                          </div>
                        </td>
                        <td className="p-3 text-center">{statusBadge}</td>
                        <td className="p-3 text-center no-print">
                          <button
                            onClick={() => setPrintModalStudent(student)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> استمارة التقييم
                          </button>
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

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT COMPETENCY UNIT                        */}
      {/* ======================================================== */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                {editingUnit ? 'تعديل بيانات وحدة الجدارات ومخرجاتها' : 'إضافة وحدة جدارات جديدة ومخرجات التعلم'}
              </h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">كود الوحدة (الوصف الرمزي)</label>
                  <input
                    type="text"
                    value={unitFormCode}
                    onChange={(e) => setUnitFormCode(e.target.value)}
                    placeholder="مثال: ELE-101 أو AUT-202"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">التخصص / القسم الصناعي</label>
                  <select
                    value={unitFormDeptId}
                    onChange={(e) => setUnitFormDeptId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">اسم وحدة الجدارة المهنية</label>
                <input
                  type="text"
                  value={unitFormName}
                  onChange={(e) => setUnitFormName(e.target.value)}
                  placeholder="مثال: تنفيذ التمديدات الكهربائية للأجهزة والمباني"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">الصف الدراسي</label>
                  <select
                    value={unitFormGrade}
                    onChange={(e) => setUnitFormGrade(Number(e.target.value) as GradeLevel)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="1">الصف الأول</option>
                    <option value="2">الصف الثاني</option>
                    <option value="3">الصف الثالث (دبلوم)</option>
                    <option value="4">الفرقة الرابعة</option>
                    <option value="5">الفرقة الخامسة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الفصل الدراسي</label>
                  <select
                    value={unitFormTerm}
                    onChange={(e) => setUnitFormTerm(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="term_1">الفصل الدراسي الأول</option>
                    <option value="term_2">الفصل الدراسي الثاني</option>
                    <option value="full_year">ممتدة طوال العام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">إجمالي الساعات المقررة</label>
                  <input
                    type="number"
                    min={1}
                    value={unitFormHours}
                    onChange={(e) => setUnitFormHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Outcomes Management inside Modal */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-900 font-black">
                    مخرجات التعلم التابعة للوحدة (Learning Outcomes):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOutcomeRow}
                    className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة مخرج آخر
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {unitFormOutcomes.map((outcome, idx) => (
                    <div key={outcome.id || idx} className="flex items-center gap-2">
                      <span className="bg-slate-900 text-amber-400 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold w-12 text-center">
                        LO {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={outcome.title}
                        onChange={(e) => {
                          const updated = [...unitFormOutcomes];
                          updated[idx].title = e.target.value;
                          setUnitFormOutcomes(updated);
                        }}
                        placeholder={`نص عنوان مخرج التعلم ${idx + 1}...`}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                        required
                      />
                      {unitFormOutcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOutcomeRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> حفظ الوحدة والمخرجات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: OFFICIAL STUDENT DOSSIER / PORTFOLIO PRINT      */}
      {/* ======================================================== */}
      {printModalStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl official-border">
            {/* Action buttons on top of modal */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" /> بطاقة تقييم وتحقق وحدات الجدارات للطالب
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> طباعة الاستمارة الرسمية
                </button>
                <button
                  onClick={() => setPrintModalStudent(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable Form Content */}
            <div className="space-y-6 text-slate-950">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start text-xs font-bold">
                <div>
                  <div>جمهورية مصر العربية</div>
                  <div>وزارة التربية والتعليم والتعليم الفني</div>
                  <div>قطاع التعليم الفني والتجهيزات</div>
                  <div>{schoolConfig.name}</div>
                </div>
                <div className="text-center">
                  <div className="border-2 border-slate-900 px-4 py-1 rounded-md text-sm font-black bg-slate-50">
                    استمارة التقييم والتحقق لوحدات الجدارات المهنية
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-1">
                    (نظام الجدارات المطور - العام الدراسي {schoolConfig.academicYear})
                  </div>
                </div>
                <div className="text-left font-mono">
                  <div>التاريخ: {new Date().toISOString().split('T')[0]}</div>
                  <div>الفصل الدراسي: {schoolConfig.currentTerm}</div>
                </div>
              </div>

              {/* Student info box */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                <div>
                  <span className="text-slate-500 block text-[10px]">اسم الطالب:</span>
                  <span className="font-bold text-slate-900">{printModalStudent.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الرقم القومي:</span>
                  <span className="font-mono">{printModalStudent.nationalId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">القسم / التخصص:</span>
                  <span>{departments.find((d) => d.id === printModalStudent.departmentId)?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">الفصل الدراسي:</span>
                  <span>{classes.find((c) => c.id === printModalStudent.classId)?.name}</span>
                </div>
              </div>

              {/* Attendance Verification Box */}
              <div className="border border-slate-900 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-black text-slate-900 border-b border-slate-300 pb-1">
                  أولاً: التحقق من استيفاء شرط الحضور القانوني للتقييم:
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 p-2.5 rounded-lg">
                    <span className="font-bold">نسبة حضور التدريبات العملية والورش: </span>
                    <span className="font-black text-slate-900 font-mono">
                      {Math.max(0, Math.round(((120 - (printModalStudent.workshopAbsenceHours || 0)) / 120) * 100))}%
                    </span>{' '}
                    (الحد الأدنى المطلوب {schoolConfig.practicalMinAttendanceRate}%)
                  </div>
                  <div className="bg-slate-100 p-2.5 rounded-lg">
                    <span className="font-bold">نسبة حضور المواد النظرية: </span>
                    <span className="font-black text-slate-900 font-mono">
                      {Math.max(0, Math.round(((60 - printModalStudent.totalAbsenceDays) / 60) * 100))}%
                    </span>{' '}
                    (الحد الأدنى المطلوب {schoolConfig.theoreticalMinAttendanceRate}%)
                  </div>
                </div>
              </div>

              {/* Student Units & Outcomes Breakdown Table */}
              <div className="space-y-2 text-xs">
                <div className="font-black text-slate-900">
                  ثانياً: سجل نتائج تقييم مخرجات التعلم وتواريخ التقييم الرسمي:
                </div>
                <table className="w-full border border-slate-900 text-center border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                    <tr>
                      <th className="p-2 border-l border-slate-900">كود الوحدة</th>
                      <th className="p-2 border-l border-slate-900 text-right">اسم الوحدة ومخرج التعلم</th>
                      <th className="p-2 border-l border-slate-900">قرار التقييم والنتيجة</th>
                      <th className="p-2 border-l border-slate-900">تاريخ التقييم الأول</th>
                      <th className="p-2 border-l border-slate-900">تاريخ الفترة الثانية</th>
                      <th className="p-2">تاريخ العلاجي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {units
                      .filter((u) => u.departmentId === printModalStudent.departmentId && u.gradeLevel === printModalStudent.gradeLevel)
                      .flatMap((u) =>
                        u.outcomes.map((lo, loIdx) => {
                          const record = getAssessmentRecord(printModalStudent.id, u.id, lo.id);
                          return (
                            <tr key={`${u.id}_${lo.id}`}>
                              <td className="p-2 border-l border-slate-300 font-mono font-bold">{u.code}</td>
                              <td className="p-2 border-l border-slate-300 text-right">
                                <div className="font-bold">{u.name}</div>
                                <div className="text-[10px] text-slate-600">
                                  {lo.code}: {lo.title}
                                </div>
                              </td>
                              <td className="p-2 border-l border-slate-300 font-bold">
                                {getResultBadge(record?.result)}
                              </td>
                              <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                                {record?.firstAttemptDate || '—'}
                              </td>
                              <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                                {record?.secondAttemptDate || '—'}
                              </td>
                              <td className="p-2 font-mono text-[11px]">{record?.remedialDate || '—'}</td>
                            </tr>
                          );
                        })
                      )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="space-y-6">
                  <div>المقيم (معلم الورشة)</div>
                  <div className="text-slate-700 font-medium">
                    ({classes.find((c) => c.id === printModalStudent.classId)?.supervisorTeacherName || currentUser.name || '........................'})
                  </div>
                </div>
                <div className="space-y-6">
                  <div>المحقق الداخلي (مشرف التخصص)</div>
                  <div className="text-slate-700 font-medium">
                    ({departments.find((d) => d.id === printModalStudent.departmentId)?.practicalSupervisorName ||
                      departments.find((d) => d.id === printModalStudent.departmentId)?.scientificSupervisorName ||
                      departments.find((d) => d.id === printModalStudent.departmentId)?.headName ||
                      '........................'})
                  </div>
                </div>
                <div className="space-y-6">
                  <div>المحقق الخارجي المعتمد</div>
                  <div className="text-slate-700 font-medium">(........................)</div>
                </div>
                <div className="space-y-6">
                  <div>يعتمد، مدير عام المدرسة</div>
                  <div className="text-slate-700 font-medium">({schoolConfig.managerName || '........................'})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: OFFICIAL WHOLE CLASS ASSESSMENT SHEET PRINT     */}
      {/* ======================================================== */}
      {printClassSheet && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                @page {
                  size: A4 landscape !important;
                  margin: 6mm 8mm 6mm 8mm !important;
                }
              }
            `
          }} />
          <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-5 shadow-2xl official-border">
            {/* Top Toolbar & Signature Customizer (No Print) */}
            <div className="space-y-3 border-b border-slate-200 pb-4 no-print">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <span>كشف رصد وتقييم مخرجات الجدارات المهنية المعتمد (جاهز للطباعة والـ PDF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة الكشف الرسمي (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintClassSheet(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

              {/* Signature Inputs Strip (Optional Fill) */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl flex flex-wrap items-center gap-3 text-xs">
                <span className="font-black text-amber-950 flex items-center gap-1 shrink-0">
                  ✍️ أسماء الموقعين بالكشف (اختياري / اتركه فارغاً ليظهر كنقاط للتوقيع اليدوي):
                </span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-[300px]">
                  <div>
                    <input
                      type="text"
                      placeholder="معلم المادة والورشة (المقيّم)..."
                      value={printAssessorTeacher}
                      onChange={(e) => setPrintAssessorTeacher(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="المحقق الداخلي (مشرف التخصص)..."
                      value={printInternalVerifier}
                      onChange={(e) => setPrintInternalVerifier(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="المحقق الخارجي المعتمد..."
                      value={printExternalVerifier}
                      onChange={(e) => setPrintExternalVerifier(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Printable Official Document Content */}
            <div className="space-y-4 text-slate-950">
              {/* Official Ministry 3-Column Header */}
              <div className="border-b-2 border-slate-900 pb-3">
                <div className="flex justify-between items-start text-xs font-bold text-slate-900 leading-tight">
                  {/* Right Ministry Info */}
                  <div className="text-right space-y-0.5">
                    <div className="text-[11px] text-slate-700">جمهورية مصر العربية</div>
                    <div className="text-[11px] text-slate-700">وزارة التربية والتعليم والتعليم الفني</div>
                    <div className="text-[11px] text-slate-700">قطاع التعليم الفني والتجهيزات</div>
                    <div>{schoolConfig.directorate} • {schoolConfig.administration}</div>
                    <div className="text-blue-900 font-black text-sm">{schoolConfig.name}</div>
                  </div>

                  {/* Center Official Title */}
                  <div className="text-center space-y-1">
                    <div className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-100 shadow-2xs">
                      كشف رصد وتقييم مخرجات وحدات الجدارات المهنية (معتمد)
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      العام الدراسي: {schoolConfig.academicYear} • {schoolConfig.currentTerm}
                    </div>
                    <div className="text-[11px] font-black text-amber-900 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-md inline-block">
                      الوحدة: {currentUnit?.name || 'جميع الوحدات'} ({currentUnit?.code}) • إجمالي الساعات: {currentUnit?.totalHours || 40} ساعة
                    </div>
                  </div>

                  {/* Left Class Info */}
                  <div className="text-left space-y-0.5" dir="rtl">
                    <div>
                      <span className="text-slate-600">الصف:</span>{' '}
                      <strong>
                        {currentUnit?.gradeLevel === 1
                          ? 'الصف الأول الصناعي'
                          : currentUnit?.gradeLevel === 2
                          ? 'الصف الثاني الصناعي'
                          : currentUnit?.gradeLevel === 3
                          ? 'الصف الثالث الصناعي (الدبلوم)'
                          : `الصف ${currentUnit?.gradeLevel} المتقدم`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-600">التخصص:</span>{' '}
                      <strong>{departments.find((d) => d.id === selectedDeptId)?.name || 'جميع التخصصات'}</strong>
                    </div>
                    <div className="text-blue-900 font-black text-sm">
                      <span className="text-slate-600">الفصل:</span>{' '}
                      <strong>{classes.find((c) => c.id === selectedClassId)?.name || 'جميع فصول التخصص'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata & Demographic Strip */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-[11px] font-bold text-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span>إجمالي الطلاب: <strong className="text-blue-900 font-black">{filteredStudents.length}</strong> طالب</span>
                  <span className="text-slate-400">|</span>
                  <span>الحد الأدنى لحضور الورش: <strong className="text-emerald-700">{schoolConfig.practicalMinAttendanceRate}%</strong></span>
                  <span className="text-slate-400">|</span>
                  <span>معلم المادة والورشة: <strong>{printAssessorTeacher || '........................'}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <span>مشرف العلمي: <strong>{departments.find((d) => d.id === selectedDeptId)?.scientificSupervisorName || '—'}</strong></span>
                  <span className="text-slate-400">|</span>
                  <span>مشرف العملي: <strong>{departments.find((d) => d.id === selectedDeptId)?.practicalSupervisorName || '—'}</strong></span>
                </div>
              </div>

              {/* Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs border-2 border-slate-900 whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900 text-center whitespace-nowrap">
                      <th className="py-1 px-1 border border-slate-900 w-7 whitespace-nowrap">م</th>
                      <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">كود الطالب</th>
                      <th className="py-1 px-2 border border-slate-900 text-right whitespace-nowrap">اسم الطالب رباعي</th>
                      <th className="py-1 px-1.5 border border-slate-900 w-20 text-center whitespace-nowrap">
                        حضور الورش ({schoolConfig.practicalMinAttendanceRate}%)
                      </th>
                      {currentUnit?.outcomes.map((lo, idx) => (
                        <th key={lo.id} className="py-1 px-2 border border-slate-900 text-center whitespace-nowrap">
                          <div className="font-black text-[11px]">{lo.code || `LO ${idx + 1}`}</div>
                          <div className="text-[9.5px] font-normal text-slate-700 line-clamp-1 max-w-[140px] mx-auto" title={lo.title}>
                            {lo.title}
                          </div>
                        </th>
                      ))}
                      <th className="py-1 px-2 border border-slate-900 w-24 text-center whitespace-nowrap">
                        القرار النهائي للوحدة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5 + (currentUnit?.outcomes.length || 0)}
                          className="py-6 text-center text-slate-500 font-bold border border-slate-900"
                        >
                          لا يوجد طلاب مسجلين في هذا الفصل / التخصص
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const pracAbs = student.workshopAbsenceHours || 0;
                        const pracRate = Math.max(0, Math.round(((120 - pracAbs) / 120) * 100));
                        const isPracEligible = pracRate >= schoolConfig.practicalMinAttendanceRate;

                        const isAllPassed = currentUnit?.outcomes.every((lo) => {
                          const res = getAssessmentRecord(student.id, currentUnit.id, lo.id)?.result;
                          return res === 'first_attempt_pass' || res === 'second_attempt_pass';
                        });

                        const isAnyFail = currentUnit?.outcomes.some((lo) => {
                          const res = getAssessmentRecord(student.id, currentUnit.id, lo.id)?.result;
                          return res === 'not_competent';
                        });

                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="py-1 px-1 border border-slate-900 text-center font-mono font-bold text-[11px] whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-1.5 border border-slate-900 text-center font-mono text-[11px] whitespace-nowrap">
                              {student.studentCode}
                            </td>
                            <td className="py-1 px-2 border border-slate-900 font-bold text-slate-950 text-right whitespace-nowrap text-xs">
                              {student.fullName}
                            </td>
                            <td className="py-1 px-1.5 border border-slate-900 text-center font-mono font-bold whitespace-nowrap text-[11px]">
                              <span className={isPracEligible ? 'text-emerald-800' : 'text-red-600'}>
                                {pracRate}% {isPracEligible ? '✓' : '✗'}
                              </span>
                            </td>
                            {currentUnit?.outcomes.map((lo) => {
                              const record = getAssessmentRecord(student.id, currentUnit.id, lo.id);
                              const st = record?.result;
                              return (
                                <td key={lo.id} className="py-1 px-1.5 border border-slate-900 text-center whitespace-nowrap">
                                  {st === 'first_attempt_pass' ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-block px-1.5 py-0.2 rounded font-black text-[10.5px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        اجتاز (1)
                                      </span>
                                      {record?.firstAttemptDate && (
                                        <div className="text-[9px] font-mono text-slate-600">
                                          ({record.firstAttemptDate})
                                        </div>
                                      )}
                                    </div>
                                  ) : st === 'second_attempt_pass' ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-block px-1.5 py-0.2 rounded font-black text-[10.5px] bg-blue-100 text-blue-900 border border-blue-300">
                                        اجتاز (2)
                                      </span>
                                      {record?.secondAttemptDate && (
                                        <div className="text-[9px] font-mono text-slate-600">
                                          ({record.secondAttemptDate})
                                        </div>
                                      )}
                                    </div>
                                  ) : st === 'remedial_program' ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-block px-1.5 py-0.2 rounded font-black text-[10.5px] bg-amber-100 text-amber-900 border border-amber-300">
                                        برنامج علاجي
                                      </span>
                                      {record?.remedialDate && (
                                        <div className="text-[9px] font-mono text-slate-600">
                                          ({record.remedialDate})
                                        </div>
                                      )}
                                    </div>
                                  ) : st === 'not_competent' ? (
                                    <span className="inline-block px-1.5 py-0.2 rounded font-black text-[10.5px] bg-red-100 text-red-900 border border-red-300">
                                      لم يجتاز
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-[11px]">قيد التقييم</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-1 px-2 border border-slate-900 text-center font-bold whitespace-nowrap text-[11px]">
                              {!isPracEligible ? (
                                <span className="inline-block px-2 py-0.5 rounded font-black bg-red-100 text-red-800 border border-red-300">
                                  محروم (غياب)
                                </span>
                              ) : isAllPassed ? (
                                <span className="inline-block px-2 py-0.5 rounded font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                                  جدير (Competent)
                                </span>
                              ) : isAnyFail ? (
                                <span className="inline-block px-2 py-0.5 rounded font-black bg-red-100 text-red-800 border border-red-300">
                                  غير جدير
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  غير مكتمل
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official 4-Signatures Block (A4 Ministry Compliant) */}
              <div className="pt-6 border-t-2 border-slate-900">
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-950 leading-relaxed">
                  <div className="space-y-6">
                    <div>معلم المادة والورشة (المقيّم)</div>
                    <div className="text-slate-700 font-medium">({printAssessorTeacher || '........................'})</div>
                  </div>

                  <div className="space-y-6">
                    <div>المحقق الداخلي (مشرف التخصص)</div>
                    <div className="text-slate-700 font-medium">({printInternalVerifier || '........................'})</div>
                  </div>

                  <div className="space-y-6">
                    <div>المحقق الخارجي المعتمد</div>
                    <div className="text-slate-700 font-medium">({printExternalVerifier || '........................'})</div>
                  </div>

                  <div className="space-y-6">
                    <div>يعتمد، مدير عام المدرسة</div>
                    <div className="text-slate-700 font-medium">({schoolConfig.managerName || '........................'})</div>
                  </div>
                </div>

                <div className="mt-4 text-center text-[10px] text-slate-500 font-medium">
                  طُبع من المنظومة الإلكترونية للتعليم الفني والجدارات بتاريخ: {new Date().toLocaleDateString('ar-EG')} - اعتماد الإدارة المدرسية
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
