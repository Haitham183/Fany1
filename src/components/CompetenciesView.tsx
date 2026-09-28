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
  CompetencyUnitCategory,
  EvidenceType,
  LearningOutcome,
  StudentCompetencyAssessment,
  CompetencyEvaluationResult,
  CompetencyVerificationRecord,
  StudentPortfolioRecord,
  GradeLevel,
  GrievanceRecord,
  AssessmentCalendarEvent,
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
  CheckSquare,
  Square,
  ClipboardList,
  FileText,
  Users,
  ShieldCheck,
  Eye,
  Percent,
  CheckCheck,
  Scale,
  CalendarDays,
} from 'lucide-react';
import {
  getCompetencyUnits,
  saveCompetencyUnit,
  deleteCompetencyUnit,
  getCompetencyAssessments,
  saveCompetencyAssessment,
  bulkSaveCompetencyAssessments,
  getVerificationRecords,
  saveVerificationRecord,
  deleteVerificationRecord,
  getStudentPortfolios,
  saveStudentPortfolio,
  calculateStudentAttendanceStats,
  getGrievances,
  saveGrievance,
  getAssessmentCalendar,
  saveAssessmentCalendarEvent,
  deleteAssessmentCalendarEvent,
} from '@/lib/storage';
import { evaluateCbeUnitState } from '@/lib/cbeStateMachine';
import { generateVerificationSample } from '@/lib/verificationEngine';
import { CBE_TERMS } from '@/lib/terms';

interface CompetenciesViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  currentUser: User;
}

type CompetencySubTab =
  | 'assessment'
  | 'units_catalog'
  | 'attendance_eligibility'
  | 'internal_verification'
  | 'student_portfolios'
  | 'grievances'
  | 'assessment_calendar';

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
  const [subTab, setSubTab] = useState<CompetencySubTab>('assessment');

  // Competency Units & Assessments State from Storage
  const [units, setUnits] = useState<CompetencyUnit[]>([]);
  const [assessments, setAssessments] = useState<StudentCompetencyAssessment[]>([]);
  const [verificationRecords, setVerificationRecords] = useState<CompetencyVerificationRecord[]>([]);
  const [portfolios, setPortfolios] = useState<StudentPortfolioRecord[]>([]);

  // Filters for Assessment Tab
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDept);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>(1);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Unit Creation / Editing
  const [isUnitModalOpen, setIsUnitModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<CompetencyUnit | null>(null);
  const [unitFormCode, setUnitFormCode] = useState<string>('');
  const [unitFormName, setUnitFormName] = useState<string>('');
  const [unitFormCategory, setUnitFormCategory] = useState<CompetencyUnitCategory>('technical_core');
  const [unitFormDeptId, setUnitFormDeptId] = useState<string>(departments[0]?.id || 'dept_elec');
  const [unitFormGrade, setUnitFormGrade] = useState<GradeLevel>(1);
  const [unitFormTerm, setUnitFormTerm] = useState<'term_1' | 'term_2' | 'full_year'>('term_1');
  const [unitFormHours, setUnitFormHours] = useState<number>(40);
  const [unitFormDescription, setUnitFormDescription] = useState<string>('');
  const [unitFormOutcomes, setUnitFormOutcomes] = useState<{
    id: string;
    code: string;
    title: string;
    weightHours?: number;
    requiredEvidences?: EvidenceType[];
  }[]>([
    { id: 'lo_1', code: 'LO 1', title: 'تطبيق إجراءات واشتراطات السلامة المهنية', requiredEvidences: ['performance_checklist'] },
    { id: 'lo_2', code: 'LO 2', title: 'تنفيذ المهارة الأساسية باستخدام العدد والمعدات', requiredEvidences: ['performance_checklist', 'product_inspection'] },
    { id: 'lo_3', code: 'LO 3', title: 'فحص واختبار جودة المنتج الفني المنجز', requiredEvidences: ['product_inspection', 'knowledge_questioning'] },
  ]);

  // Evidence Detail Modal for a specific Student & Outcome
  const [evidenceModalData, setEvidenceModalData] = useState<{
    student: Student;
    unit: CompetencyUnit;
    outcome: LearningOutcome;
    assessment?: StudentCompetencyAssessment;
  } | null>(null);

  // New Verification Session Modal State
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [verFormType, setVerFormType] = useState<'internal' | 'external'>('internal');
  const [verFormUnitId, setVerFormUnitId] = useState<string>('');
  const [verFormDeptId, setVerFormDeptId] = useState<string>(departments[0]?.id || 'dept_elec');
  const [verFormGrade, setVerFormGrade] = useState<GradeLevel>(1);
  const [verFormSamplePercentage, setVerFormSamplePercentage] = useState<number>(15);
  const [verFormVerifierName, setVerFormVerifierName] = useState<string>(currentUser.name);
  const [verFormVerifierRole, setVerFormVerifierRole] = useState<'internal_verifier' | 'external_verifier' | 'market_representative'>('internal_verifier');
  const [verFormStatus, setVerFormStatus] = useState<'conforming' | 'non_conforming' | 'conditional_pass'>('conforming');
  const [verFormNotes, setVerFormNotes] = useState<string>('تم فحص عينة ملفات الإنجاز ومطابقة بطاقات الملاحظة وفحص المنتج مع قرارات المقيم.');
  const [verFormCorrectiveActions, setVerFormCorrectiveActions] = useState<string>('');

  // Modal for Official Print / Dossier
  const [printModalStudent, setPrintModalStudent] = useState<Student | null>(null);
  const [printClassSheet, setPrintClassSheet] = useState<boolean>(false);
  const [printVerificationRecord, setPrintVerificationRecord] = useState<CompetencyVerificationRecord | null>(null);
  const [printDocMode, setPrintDocMode] = useState<'assessment_sheet' | 'observation_checklist' | 'product_inspection' | 'verification_report'>('assessment_sheet');
  const [printAssessorTeacher, setPrintAssessorTeacher] = useState<string>('');
  const [printInternalVerifier, setPrintInternalVerifier] = useState<string>('');
  const [printExternalVerifier, setPrintExternalVerifier] = useState<string>('');

  // Success Notification banner
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Grievances & Assessment Calendar State
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<AssessmentCalendarEvent[]>([]);
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [grievanceFormStudentId, setGrievanceFormStudentId] = useState('');
  const [grievanceFormUnitId, setGrievanceFormUnitId] = useState('');
  const [grievanceFormOutcomeId, setGrievanceFormOutcomeId] = useState('');
  const [grievanceFormReason, setGrievanceFormReason] = useState('');

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarFormTitle, setCalendarFormTitle] = useState('');
  const [calendarFormUnitId, setCalendarFormUnitId] = useState('');
  const [calendarFormEventType, setCalendarFormEventType] = useState<'attempt_1' | 'attempt_2' | 'remedial_attempt_3' | 'second_round' | 'internal_verification' | 'external_verification'>('attempt_1');
  const [calendarFormStartDate, setCalendarFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarFormEndDate, setCalendarFormEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarFormNotes, setCalendarFormNotes] = useState('');

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
    const loadedVerifications = getVerificationRecords();
    const loadedPortfolios = getStudentPortfolios();
    const loadedGrievances = getGrievances();
    const loadedCalendar = getAssessmentCalendar();
    setUnits(loadedUnits);
    setAssessments(loadedAssessments);
    setVerificationRecords(loadedVerifications);
    setPortfolios(loadedPortfolios);
    setGrievances(loadedGrievances);
    setCalendarEvents(loadedCalendar);

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

  const showSuccessNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  // Filtered classes based on selected department and grade
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDeptId !== 'all' && c.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && c.gradeLevel !== selectedGrade) return false;
      return true;
    });
  }, [classes, selectedDeptId, selectedGrade]);

  // Filtered units matching dept, grade, and category
  const availableUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedDeptId !== 'all' && u.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && u.gradeLevel !== selectedGrade) return false;
      if (selectedCategoryFilter !== 'all' && u.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [units, selectedDeptId, selectedGrade, selectedCategoryFilter]);

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
      hasPerformanceEvidence: existing?.hasPerformanceEvidence ?? (newResult === 'first_attempt_pass' || newResult === 'second_attempt_pass'),
      hasProductEvidence: existing?.hasProductEvidence ?? (newResult === 'first_attempt_pass' || newResult === 'second_attempt_pass'),
      hasKnowledgeEvidence: existing?.hasKnowledgeEvidence ?? (newResult === 'first_attempt_pass' || newResult === 'second_attempt_pass'),
      firstAttemptDate: firstDate,
      secondAttemptDate: secondDate,
      remedialDate: remDate,
      assessorTeacherName: currentUser.name,
    };

    saveCompetencyAssessment(updatedAssessment);
    loadCompetencyData();
  };

  // Unit CRUD handlers
  const handleOpenAddUnitModal = () => {
    setEditingUnit(null);
    setUnitFormCode(`MOD-${Math.floor(100 + Math.random() * 900)}`);
    setUnitFormName('');
    setUnitFormCategory('technical_core');
    setUnitFormDeptId(selectedDeptId !== 'all' ? selectedDeptId : departments[0]?.id || 'dept_elec');
    setUnitFormGrade(typeof selectedGrade === 'number' ? selectedGrade : 1);
    setUnitFormTerm('term_1');
    setUnitFormHours(40);
    setUnitFormDescription('');
    setUnitFormOutcomes([
      { id: `lo_${Date.now()}_1`, code: 'LO 1', title: 'تجهيز مهمات وأدوات العمل والالتزام باشتراطات السلامة', requiredEvidences: ['performance_checklist'] },
      { id: `lo_${Date.now()}_2`, code: 'LO 2', title: 'تنفيذ خطوات العمليات المهارية بدقة طبقا لبطاقة التعليمات', requiredEvidences: ['performance_checklist', 'product_inspection'] },
      { id: `lo_${Date.now()}_3`, code: 'LO 3', title: 'فحص واختبار جودة المنتج النهائي وإعداد تقرير التسليم', requiredEvidences: ['product_inspection', 'knowledge_questioning'] },
    ]);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnitModal = (unit: CompetencyUnit) => {
    setEditingUnit(unit);
    setUnitFormCode(unit.code);
    setUnitFormName(unit.name);
    setUnitFormCategory(unit.category || 'technical_core');
    setUnitFormDeptId(unit.departmentId);
    setUnitFormGrade(unit.gradeLevel);
    setUnitFormTerm(unit.term);
    setUnitFormHours(unit.totalHours);
    setUnitFormDescription(unit.description || '');
    setUnitFormOutcomes(
      unit.outcomes && unit.outcomes.length > 0
        ? unit.outcomes.map((o) => ({ ...o }))
        : [
            { id: `lo_${Date.now()}_1`, code: 'LO 1', title: 'المخرج الأول للوحدة', requiredEvidences: ['performance_checklist'] },
            { id: `lo_${Date.now()}_2`, code: 'LO 2', title: 'المخرج الثاني للوحدة', requiredEvidences: ['product_inspection'] },
          ]
    );
    setIsUnitModalOpen(true);
  };

  const handleAddOutcomeRow = () => {
    const nextIdx = unitFormOutcomes.length + 1;
    setUnitFormOutcomes([
      ...unitFormOutcomes,
      { id: `lo_${Date.now()}_${nextIdx}`, code: `LO ${nextIdx}`, title: '', requiredEvidences: ['performance_checklist'] },
    ]);
  };

  const handleRemoveOutcomeRow = (idx: number) => {
    if (unitFormOutcomes.length <= 1) return;
    setUnitFormOutcomes(unitFormOutcomes.filter((_, i) => i !== idx));
  };

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
        requiredEvidences: o.requiredEvidences || ['performance_checklist'],
      }));

    if (cleanOutcomes.length === 0) {
      alert('يرجى إدخال مخرج تعلم واحد على الأقل للوحدة');
      return;
    }

    const unitPayload: Omit<CompetencyUnit, 'id'> & { id?: string } = {
      id: editingUnit ? editingUnit.id : undefined,
      code: unitFormCode.trim() || 'MOD-101',
      name: unitFormName.trim(),
      category: unitFormCategory,
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
    showSuccessNotification('تم حفظ بيانات وحدة الجدارات ومصفوفة مخرجاتها بنجاح');
  };

  const handleDeleteUnit = (unitId: string, unitName: string) => {
    if (confirm(`هل أنت متأكد من حذف وحدة "${unitName}" وكافة تقييمات مخرجاتها؟`)) {
      deleteCompetencyUnit(unitId);
      loadCompetencyData();
      showSuccessNotification('تم حذف وحدة الجدارات بنجاح');
    }
  };

  // Internal / External Verification Sample Generator & Submit (Reproducible Seeded PRNG)
  const handleCreateVerificationSession = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUnit = units.find((u) => u.id === (verFormUnitId || selectedUnitId));
    const targetDept = departments.find((d) => d.id === (targetUnit?.departmentId || verFormDeptId));

    if (!targetUnit) {
      alert('يرجى اختيار الوحدة المراد تدقيقها');
      return;
    }

    // Get students of this department & grade
    const unitStudents = students.filter(
      (s) => s.departmentId === targetUnit.departmentId && s.gradeLevel === targetUnit.gradeLevel
    );

    if (unitStudents.length === 0) {
      alert('لا يوجد طلاب مسجلون بهذا التخصص والفرقة لأخذ عينة');
      return;
    }

    // Use reproducible seeded sampling engine
    const sampleResult = generateVerificationSample({
      students: unitStudents,
      sampleRate: verFormSamplePercentage / 100,
      verifierType: verFormType,
      verifierName: verFormVerifierName,
      unitId: targetUnit.id,
      departmentId: targetUnit.departmentId,
      gradeLevel: targetUnit.gradeLevel,
    });

    const newRecord: CompetencyVerificationRecord = {
      id: `ver_${Date.now()}`,
      verificationType: verFormType,
      unitId: targetUnit.id,
      unitName: targetUnit.name,
      unitCode: targetUnit.code,
      departmentId: targetUnit.departmentId,
      departmentName: targetDept?.name || 'القسم الفني',
      gradeLevel: targetUnit.gradeLevel,
      date: new Date().toISOString().split('T')[0],
      verifierName: verFormVerifierName,
      verifierRole: verFormVerifierRole,
      totalStudentsAudited: sampleResult.sampledStudents.length,
      samplePercentage: verFormSamplePercentage,
      sampleStudentIds: sampleResult.sampleStudentIds,
      sampleStudentNames: sampleResult.sampleStudentNames,
      sampleSeed: sampleResult.seed,
      status: verFormStatus,
      assessorDecisionAgreed: verFormStatus === 'conforming',
      correctiveActions: verFormCorrectiveActions,
      feedbackNotes: verFormNotes,
      isSigned: true,
    };

    saveVerificationRecord(newRecord);
    loadCompetencyData();
    setIsVerificationModalOpen(false);
    showSuccessNotification(`تم اعتماد محضر جلسة التحقق وتوثيق العينة العشوائية بنجاح (Seed: ${sampleResult.seed})`);
  };

  // Grievance Handlers
  const handleCreateGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceFormStudentId || !grievanceFormUnitId || !grievanceFormReason.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة للتظلم');
      return;
    }

    const student = students.find((s) => s.id === grievanceFormStudentId);
    const unit = units.find((u) => u.id === grievanceFormUnitId);
    const outcome = unit?.outcomes.find((o) => o.id === grievanceFormOutcomeId);

    const newGrievance: GrievanceRecord = {
      id: `grv_${Date.now()}`,
      studentId: grievanceFormStudentId,
      studentName: student?.fullName || '',
      studentCode: student?.studentCode || '',
      departmentId: student?.departmentId || '',
      gradeLevel: student?.gradeLevel || 1,
      unitId: grievanceFormUnitId,
      unitCode: unit?.code || '',
      unitName: unit?.name || '',
      outcomeId: grievanceFormOutcomeId || undefined,
      outcomeCode: outcome?.code || undefined,
      submissionDate: new Date().toISOString().split('T')[0],
      reason: grievanceFormReason.trim(),
      status: 'under_review',
      assessorTeacherName: currentUser.name,
    };

    saveGrievance(newGrievance);
    loadCompetencyData();
    setIsGrievanceModalOpen(false);
    setGrievanceFormReason('');
    showSuccessNotification('تم قيد تظلم تقييم الجدارة بنجاح وجارٍ العرض على لجنة التحقق');
  };

  const handleUpdateGrievanceStatus = (grvId: string, status: 'accepted' | 'rejected', notes: string) => {
    const grv = grievances.find((g) => g.id === grvId);
    if (!grv) return;

    saveGrievance({
      ...grv,
      status,
      decisionNotes: notes,
      committeeDecisionDate: new Date().toISOString().split('T')[0],
      resolvedBy: currentUser.name,
    });
    loadCompetencyData();
    showSuccessNotification(`تم ${status === 'accepted' ? 'قبول' : 'رفض'} التظلم واعتماد قرار اللجنة`);
  };

  // Assessment Calendar Handlers
  const handleSaveCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarFormTitle.trim() || !calendarFormUnitId) {
      alert('يرجى ملء بيانات الحدث والوحدة');
      return;
    }

    const targetUnit = units.find((u) => u.id === calendarFormUnitId);

    const event: AssessmentCalendarEvent = {
      id: `cal_${Date.now()}`,
      unitId: calendarFormUnitId,
      unitCode: targetUnit?.code || '',
      unitName: targetUnit?.name || '',
      departmentId: targetUnit?.departmentId || departments[0]?.id || '',
      gradeLevel: targetUnit?.gradeLevel || 1,
      title: calendarFormTitle.trim(),
      eventType: calendarFormEventType,
      startDate: calendarFormStartDate,
      endDate: calendarFormEndDate,
      status: 'scheduled',
      notes: calendarFormNotes.trim() || undefined,
      createdBy: currentUser.name,
    };

    saveAssessmentCalendarEvent(event);
    loadCompetencyData();
    setIsCalendarModalOpen(false);
    setCalendarFormTitle('');
    setCalendarFormNotes('');
    showSuccessNotification('تم حفظ وإدراج موعد التقييم بالخطة الزمنية');
  };

  const handleDeleteCalendarEvent = (id: string) => {
    if (confirm('هل ترغب في حذف هذا الموعد من الخطة الزمنية؟')) {
      deleteAssessmentCalendarEvent(id);
      loadCompetencyData();
      showSuccessNotification('تم حذف موعد التقييم');
    }
  };

  // Unit Stats
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
    <div className="space-y-5">
      {/* Toast Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white font-bold p-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in duration-200 no-print">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            {saveSuccessMsg}
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-amber-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> منظومة التعليم الفني القائم على منهجية الجدارات المهنية
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10.5px] px-2 py-0.2 rounded-full font-mono font-bold border border-emerald-500/30">
              العام الدراسي {schoolConfig.academicYear}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-amber-400">
            إدارة البرامج المهنية، مخرجات التعلم، والتحقق الداخلي والخارجي
          </h2>
          <p className="text-[11px] text-slate-300 max-w-3xl leading-relaxed">
            رصد نتائج تقييم مخرجات التعلم، أدلة التعلم الثلاثة (أداء، منتج، تساؤل)، لجان التحقق، وتدقيق نسب الحضور بالورش (85%).
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
              setPrintDocMode('assessment_sheet');
              setPrintClassSheet(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة شيت رصد الوحدة (A4)
          </button>

          <button
            onClick={() => {
              setVerFormUnitId(currentUnit?.id || '');
              setIsVerificationModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer border border-purple-400/30"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-200" /> جلسة تحقق داخلي
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 no-print overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setSubTab('assessment')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'assessment'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-amber-700" />
          <span>رصد تقييم مخرجات التعلم</span>
          <span className="bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {filteredStudents.length} طالب
          </span>
        </button>

        <button
          onClick={() => setSubTab('units_catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'units_catalog'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-700" />
          <span>دليل وبنك وحدات الجدارات</span>
          <span className="bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {units.length} وحدة
          </span>
        </button>

        <button
          onClick={() => setSubTab('attendance_eligibility')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'attendance_eligibility'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-700" />
          <span>أهلية التقييم ونسبة حضور الورش (85%)</span>
        </button>

        <button
          onClick={() => setSubTab('internal_verification')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'internal_verification'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>التحقق الداخلي والخارجي (IV / EV)</span>
          <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
            {verificationRecords.length} جلسة
          </span>
        </button>

        <button
          onClick={() => setSubTab('student_portfolios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'student_portfolios'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-teal-600" />
          <span>ملفات إنجاز الطلاب (Portfolio)</span>
        </button>

        <button
          onClick={() => setSubTab('grievances')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'grievances'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4 text-rose-600" />
          <span>سجل التظلمات ({grievances.length})</span>
        </button>

        <button
          onClick={() => setSubTab('assessment_calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
            subTab === 'assessment_calendar'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <span>الخطة الزمنية وجدول التقييمات ({calendarEvents.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: SUMMATIVE ASSESSMENT MATRIX                   */}
      {/* ======================================================== */}
      {subTab === 'assessment' && (
        <div className="space-y-4 no-print">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                  <option value="4">الفرقة الرابعة</option>
                  <option value="5">الفرقة الخامسة</option>
                </select>
              </div>

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

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث عن طالب</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="اسم الطالب أو الكود..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Units Selector Strip */}
            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-black text-slate-900 mb-2 flex items-center justify-between">
                <span>اختر وحدة الجدارات المراد رصدها:</span>
                <span className="text-slate-500 font-normal text-[11px]">متاح {availableUnits.length} وحدة للتخصص والصف</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableUnits.map((u) => {
                  const isSelected = u.id === (currentUnit?.id || '');
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                          : 'bg-slate-50 hover:bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                            {u.code}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            u.category === 'employability'
                              ? 'bg-purple-100 text-purple-900'
                              : u.category === 'supporting'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {u.category === 'employability' ? 'جدارات توظيف' : u.category === 'supporting' ? 'مساندة' : 'فنية تخصصية'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[220px]">{u.name}</div>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono font-bold shrink-0">
                        {u.outcomes.length} مخرجات
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          {currentUnit && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                <div className="text-[10.5px] text-slate-500 font-bold">إجمالي التقييمات</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{currentUnitStats.total}</div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <div className="text-[10.5px] text-emerald-700 font-bold">اجتاز محاولة 1 🟢</div>
                <div className="text-base font-black text-emerald-900 mt-0.5">{currentUnitStats.firstPass}</div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                <div className="text-[10.5px] text-blue-700 font-bold">اجتاز محاولة 2 🔵</div>
                <div className="text-base font-black text-blue-900 mt-0.5">{currentUnitStats.secondPass}</div>
              </div>

              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-center">
                <div className="text-[10.5px] text-orange-700 font-bold">برنامج علاجي 🟠</div>
                <div className="text-base font-black text-orange-900 mt-0.5">{currentUnitStats.remedial}</div>
              </div>

              <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                <div className="text-[10.5px] text-red-700 font-bold">لم يجتز (غير جدير) 🔴</div>
                <div className="text-base font-black text-red-900 mt-0.5">{currentUnitStats.notComp}</div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                <div className="text-[10.5px] text-amber-800 font-bold">نسبة الجدارة والاجتياز</div>
                <div className="text-base font-black text-amber-950 mt-0.5">{currentUnitStats.passRate}%</div>
              </div>
            </div>
          )}

          {/* Assessment Table */}
          {currentUnit ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-3 text-center w-10">م</th>
                      <th className="p-3 w-48">بيانات الطالب</th>
                      <th className="p-3 text-center w-24">حضور الورش</th>
                      {currentUnit.outcomes.map((outcome) => (
                        <th key={outcome.id} className="p-3 text-center border-r border-slate-800">
                          <div className="font-mono text-amber-400 font-black">{outcome.code}</div>
                          <div className="text-[10.5px] font-normal text-slate-300 max-w-[180px] truncate mx-auto" title={outcome.title}>
                            {outcome.title}
                          </div>
                        </th>
                      ))}
                      <th className="p-3 text-center w-28">القرار النهائي</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 font-medium">
                    {filteredStudents.map((student, sIdx) => {
                      const attStats = calculateStudentAttendanceStats(student, undefined, schoolConfig);
                      const pracRate = attStats.workshopAttendanceRate;
                      const isEligible = attStats.isPracticalEligible;

                      const outcomesResults = currentUnit.outcomes.map((o) => {
                        const rec = getAssessmentRecord(student.id, currentUnit.id, o.id);
                        return {
                          outcomeId: o.id,
                          result: rec?.result,
                          hasPerformanceEvidence: rec?.hasPerformanceEvidence,
                          hasProductEvidence: rec?.hasProductEvidence,
                          hasKnowledgeEvidence: rec?.hasKnowledgeEvidence,
                        };
                      });

                      const cbeSummary = evaluateCbeUnitState({
                        studentId: student.id,
                        unitId: currentUnit.id,
                        outcomesCount: currentUnit.outcomes.length,
                        outcomesResults,
                        workshopAttendanceRate: pracRate,
                      });

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition">
                          <td className="p-2.5 text-center text-slate-400 font-mono font-bold">{sIdx + 1}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{student.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>كود: {student.studentCode}</span>
                              <span>•</span>
                              <span>{student.nationalId}</span>
                            </div>
                          </td>

                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[10.5px] ${
                                isEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800 font-black'
                              }`}
                              title={`نسبة حضور الورش: ${pracRate}%`}
                            >
                              {pracRate}%
                            </span>
                          </td>

                          {currentUnit.outcomes.map((outcome) => {
                            const rec = getAssessmentRecord(student.id, currentUnit.id, outcome.id);
                            const result = rec?.result || 'pending';

                            return (
                              <td key={outcome.id} className="p-2 text-center border-r border-slate-100">
                                <div className="flex flex-col items-center gap-1.5">
                                  {/* Quick Result Selector */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleUpdateStudentResult(student, outcome, 'first_attempt_pass')}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                        result === 'first_attempt_pass'
                                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                      }`}
                                      title="اجتاز من التقييم الأول (جدير)"
                                    >
                                      1 م
                                    </button>

                                    <button
                                      onClick={() => handleUpdateStudentResult(student, outcome, 'second_attempt_pass')}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                        result === 'second_attempt_pass'
                                          ? 'bg-blue-600 text-white shadow-xs font-black'
                                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                      }`}
                                      title="اجتاز من التقييم الثاني (فرصة ثانية)"
                                    >
                                      2 م
                                    </button>

                                    <button
                                      onClick={() => handleUpdateStudentResult(student, outcome, 'remedial_program')}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                        result === 'remedial_program'
                                          ? 'bg-orange-600 text-white shadow-xs font-black'
                                          : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-700'
                                      }`}
                                      title="برنامج علاجي (فرصة ثالثة)"
                                    >
                                      علاج
                                    </button>
                                  </div>

                                  {/* Evidence Icons */}
                                  <button
                                    onClick={() =>
                                      setEvidenceModalData({
                                        student,
                                        unit: currentUnit,
                                        outcome,
                                        assessment: rec,
                                      })
                                    }
                                    className="text-[10px] text-slate-500 hover:text-amber-700 flex items-center gap-1 font-bold underline cursor-pointer"
                                  >
                                    <CheckSquare className="w-3 h-3 text-amber-600" />
                                    <span>الأدلة (أداء/منتج/معرفة)</span>
                                  </button>
                                </div>
                              </td>
                            );
                          })}

                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                cbeSummary.finalStatus === 'competent'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : cbeSummary.finalStatus === 'ineligible_attendance'
                                  ? 'bg-red-100 text-red-900 border border-red-300'
                                  : cbeSummary.finalStatus === 'remedial_required'
                                  ? 'bg-orange-100 text-orange-900 border border-orange-300'
                                  : cbeSummary.finalStatus === 'second_round_required'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : cbeSummary.finalStatus === 'not_competent'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                              title={cbeSummary.actionRequiredText}
                            >
                              {cbeSummary.statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              لا توجد وحدات جدارات مطابقة للفلتر المحدد
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: UNITS CATALOG & MATRIX                        */}
      {/* ======================================================== */}
      {subTab === 'units_catalog' && (
        <div className="space-y-4 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">تصفية حسب نوع الجدارة:</span>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                جميع الأنواع ({units.length})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('technical_core')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  selectedCategoryFilter === 'technical_core'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                جدارات فنية وتخصصية
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('employability')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  selectedCategoryFilter === 'employability'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                جدارات التوظيف وريادة الأعمال
              </button>
            </div>

            <button
              onClick={handleOpenAddUnitModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة وحدة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUnits.map((u) => {
              const dept = departments.find((d) => d.id === u.departmentId);
              return (
                <div key={u.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-black text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {u.code}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditUnitModal(u)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="تعديل الوحدة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUnit(u.id, u.name)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="حذف الوحدة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-snug">{u.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{u.description || 'لا يوجد وصف'}</p>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>القسم / التخصص:</span>
                        <span className="font-bold text-slate-800">{dept?.name || 'عام'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الصف والساعات:</span>
                        <span className="font-bold text-slate-800">الصف {u.gradeLevel} • {u.totalHours} ساعة تدريبية</span>
                      </div>
                    </div>

                    {/* Outcomes List */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <span className="font-bold text-slate-700 block text-[10.5px]">مخرجات التعلم ({u.outcomes.length}):</span>
                      {u.outcomes.map((o) => (
                        <div key={o.id} className="text-[11px] text-slate-700 flex items-start gap-1">
                          <span className="font-bold text-amber-700 font-mono shrink-0">{o.code}:</span>
                          <span className="truncate">{o.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDeptId(u.departmentId);
                      setSelectedGrade(u.gradeLevel);
                      setSelectedUnitId(u.id);
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
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: ATTENDANCE ELIGIBILITY (85% WORKSHOPS)        */}
      {/* ======================================================== */}
      {subTab === 'attendance_eligibility' && (
        <div className="space-y-4 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-bold">إجمالي المقيدين</div>
                <div className="text-xl font-black text-slate-900">{students.length} طالب</div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-emerald-800 font-bold">مستوفون لشرط 85%</div>
                <div className="text-xl font-black text-emerald-950">
                  {students.filter((s) => (s.workshopAbsenceHours || 0) < 18).length}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-black">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-amber-800 font-bold">في منطقة الخطر</div>
                <div className="text-xl font-black text-amber-950">
                  {students.filter((s) => (s.workshopAbsenceHours || 0) >= 12 && (s.workshopAbsenceHours || 0) < 18).length}
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-black">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-red-800 font-bold">محرومون من التقييم</div>
                <div className="text-xl font-black text-red-950">
                  {students.filter((s) => (s.workshopAbsenceHours || 0) >= 18).length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3 text-center w-10">م</th>
                    <th className="p-3">بيانات الطالب</th>
                    <th className="p-3">القسم والفصل</th>
                    <th className="p-3 text-center">غياب الورش (ساعات)</th>
                    <th className="p-3 text-center">نسبة الحضور بالورش %</th>
                    <th className="p-3 text-center">حالة الأهلية للتقييم</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredStudents.map((s, idx) => {
                    const attStats = calculateStudentAttendanceStats(s, undefined, schoolConfig);
                    const pracAbs = attStats.workshopAbsentHours;
                    const pracRate = attStats.workshopAttendanceRate;
                    const isEligible = attStats.isPracticalEligible;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{s.fullName}</td>
                        <td className="p-3 text-slate-600">{classes.find((c) => c.id === s.classId)?.name}</td>
                        <td className="p-3 text-center font-mono font-bold">{pracAbs} ساعة</td>
                        <td className="p-3 text-center font-mono font-black">{pracRate}%</td>
                        <td className="p-3 text-center">
                          {isEligible ? (
                            <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[10.5px]">
                              ✓ مؤهل للتقييم
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-900 font-black px-2.5 py-0.5 rounded-full text-[10.5px]">
                              ✕ محروم لتجاوز الغياب
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setPrintModalStudent(s);
                              setPrintDocMode('observation_checklist');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                          >
                            بطاقة الملاحظة A4
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
      {/* SUB-TAB 4: INTERNAL & EXTERNAL VERIFICATION HUB          */}
      {/* ======================================================== */}
      {subTab === 'internal_verification' && (
        <div className="space-y-4 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-0.5">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>محاضر وسجلات التحقق الداخلي والخارجي للوحدات</span>
              </h4>
              <p className="text-xs text-slate-500">
                تدقيق عينات عشوائية (10-20%) من ملفات الإنجاز وقرارات المقيمين واعتماد مطابقتها للمعايير.
              </p>
            </div>

            <button
              onClick={() => {
                setVerFormUnitId(currentUnit?.id || '');
                setIsVerificationModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> تنفيذ جلسة تحقق جديدة
            </button>
          </div>

          <div className="space-y-3">
            {verificationRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                لم يتم تسجيل أي محاضر تحقق داخلي أو خارجي بعد. اضغط على الزر أعلاه لبدء أول جلسة تدقيق.
              </div>
            ) : (
              verificationRecords.map((rec) => (
                <div key={rec.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rec.verificationType === 'external'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-purple-100 text-purple-900 border border-purple-200'
                      }`}>
                        {rec.verificationType === 'external' ? 'تحقق خارجي (وزاري / سوق عمل)' : 'تحقق داخلي (مدرسي)'}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm">{rec.unitName} ({rec.unitCode})</h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-mono">{rec.date}</span>
                      <button
                        onClick={() => {
                          setPrintVerificationRecord(rec);
                          setPrintDocMode('verification_report');
                        }}
                        className="bg-slate-900 text-white hover:bg-slate-800 font-bold px-3 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" /> طباعة المحضر A4
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">القائم بالتحقق:</span>
                      <strong className="block text-slate-800">{rec.verifierName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">حجم العينة المدققة:</span>
                      <strong className="block text-slate-800">{rec.totalStudentsAudited} طلاب ({rec.samplePercentage}%)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">قرار التحقق:</span>
                      <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10.5px] ${
                        rec.status === 'conforming'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {rec.status === 'conforming' ? '✓ مطابق لقرارات المقيمين' : 'يحتاج إجراءات تصحيحية'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-1">الطلاب في العينة العشوائية:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.sampleStudentNames.map((name, i) => (
                        <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {rec.feedbackNotes && (
                    <div className="text-xs text-slate-600">
                      <strong>ملاحظات وتوصيات المحقق:</strong> {rec.feedbackNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 5: STUDENT PORTFOLIOS TRACKER                    */}
      {/* ======================================================== */}
      {subTab === 'student_portfolios' && (
        <div className="space-y-4 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                <span>سجل متابعة واكتمال ملفات إنجاز الطلاب (Portfolio)</span>
              </h4>
              <p className="text-xs text-slate-500">
                تدقيق احتواء البورتفوليو على الفهرس، إقرار السلامة، بطاقات الملاحظة، بطاقات فحص المنتج، وأدلة التساؤل.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3 text-center w-10">م</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3 text-center">الفهرس</th>
                    <th className="p-3 text-center">إقرار السلامة</th>
                    <th className="p-3 text-center">بطاقات الملاحظة</th>
                    <th className="p-3 text-center">فحص المنتجات</th>
                    <th className="p-3 text-center">أدلة المعرفة</th>
                    <th className="p-3 text-center">إثبات 85%</th>
                    <th className="p-3 text-center">نسبة الاكتمال</th>
                    <th className="p-3 text-center">حالة البورتفوليو</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {portfolios.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                      <td className="p-3 text-center">{p.hasIndex ? '🟢' : '⚪'}</td>
                      <td className="p-3 text-center">{p.hasSafetyPledge ? '🟢' : '⚪'}</td>
                      <td className="p-3 text-center">{p.hasObservationCards ? '🟢' : '⚪'}</td>
                      <td className="p-3 text-center">{p.hasProductInspectionCards ? '🟢' : '⚪'}</td>
                      <td className="p-3 text-center">{p.hasKnowledgeTests ? '🟢' : '⚪'}</td>
                      <td className="p-3 text-center">{p.hasAttendanceProof ? '🟢' : '🔴'}</td>
                      <td className="p-3 text-center font-mono font-bold">{p.completionPercentage}%</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.completionPercentage >= 90
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {p.completionPercentage >= 90 ? 'جاهز للمحقق الخارجي' : 'قيد الاستكمال'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 6: GRIEVANCES REGISTER                           */}
      {/* ======================================================== */}
      {subTab === 'grievances' && (
        <div className="space-y-4 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Scale className="w-5 h-5 text-rose-600" />
                <span>سجل تظلمات تقييم الجدارات المهنية وقرارات لجان التحقق</span>
              </h4>
              <p className="text-xs text-slate-500">
                قيد تظلمات الطلاب على نتائج التقييم وعرضها على لجنة التحقق للبت فيها رسمياً وفق اللائحة.
              </p>
            </div>

            <button
              onClick={() => {
                setGrievanceFormStudentId(filteredStudents[0]?.id || '');
                setGrievanceFormUnitId(currentUnit?.id || units[0]?.id || '');
                setIsGrievanceModalOpen(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> تقديم تظلم جديد
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-900 text-white font-bold">
                  <tr>
                    <th className="p-3 text-center w-10">م</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">الوحدة الدراسية</th>
                    <th className="p-3">المخرج / السبب</th>
                    <th className="p-3 text-center">تاريخ التقديم</th>
                    <th className="p-3 text-center">حالة التظلم</th>
                    <th className="p-3 text-center">قرار اللجنة</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {grievances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد تظلمات مسجلة حالياً.
                      </td>
                    </tr>
                  ) : (
                    grievances.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{g.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">كود: {g.studentCode}</div>
                        </td>
                        <td className="p-3 font-semibold">{g.unitName} ({g.unitCode})</td>
                        <td className="p-3">
                          {g.outcomeCode && <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono mr-1">{g.outcomeCode}</span>}
                          <span className="text-slate-700">{g.reason}</span>
                        </td>
                        <td className="p-3 text-center font-mono">{g.submissionDate}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-900'
                              : g.status === 'rejected'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {g.status === 'accepted' ? 'مقبول' : g.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-600">
                          {g.decisionNotes || '-'}
                        </td>
                        <td className="p-3 text-center">
                          {g.status === 'under_review' && (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleUpdateGrievanceStatus(g.id, 'accepted', 'تمت مراجعة ملف الإنجاز وبطاقة الملاحظة وقبول التظلم')}
                                className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() => handleUpdateGrievanceStatus(g.id, 'rejected', 'القرارات مطابقة لمعايير التقييم وأدلة التعلم')}
                                className="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 7: ASSESSMENT CALENDAR & TIMELINE                */}
      {/* ======================================================== */}
      {subTab === 'assessment_calendar' && (
        <div className="space-y-4 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <span>الخطة الزمنية وجدول مواعيد التقييمات والفرص والتحقق</span>
              </h4>
              <p className="text-xs text-slate-500">
                مواعيد التقييم الأول، الفرصة الثانية، البرنامج العلاجي (الفرصة 3)، الدور الثاني، وجلسات التحقق.
              </p>
            </div>

            <button
              onClick={() => {
                setCalendarFormUnitId(currentUnit?.id || units[0]?.id || '');
                setIsCalendarModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> إضافة موعد تقييم
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarEvents.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
                لم يتم تسجيل أي مواعيد بالخطة الزمنية بعد.
              </div>
            ) : (
              calendarEvents.map((evt) => (
                <div key={evt.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                      evt.eventType === 'attempt_1'
                        ? 'bg-emerald-100 text-emerald-900'
                        : evt.eventType === 'attempt_2'
                        ? 'bg-blue-100 text-blue-900'
                        : evt.eventType === 'remedial_attempt_3'
                        ? 'bg-orange-100 text-orange-900'
                        : evt.eventType === 'second_round'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-purple-100 text-purple-900'
                    }`}>
                      {evt.eventType === 'attempt_1'
                        ? 'تقييم أول (فرصة 1)'
                        : evt.eventType === 'attempt_2'
                        ? 'تقييم ثانٍ (فرصة 2)'
                        : evt.eventType === 'remedial_attempt_3'
                        ? 'برنامج علاجي (فرصة 3)'
                        : evt.eventType === 'second_round'
                        ? 'تقييم الدور الثاني'
                        : 'جلسة تحقق'}
                    </span>
                    <button
                      onClick={() => handleDeleteCalendarEvent(evt.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h5 className="font-bold text-slate-900 text-sm">{evt.title}</h5>
                  <div className="text-xs text-slate-600">الوحدة: {evt.unitName} ({evt.unitCode})</div>
                  <div className="text-xs font-mono text-slate-500">من {evt.startDate} إلى {evt.endDate}</div>
                  {evt.notes && <p className="text-[11px] text-slate-500 mt-1">{evt.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUBMIT GRIEVANCE                                  */}
      {/* ======================================================== */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-600" />
                <span>قيد تظلم تقييم جدارة</span>
              </h3>
              <button onClick={() => setIsGrievanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateGrievance} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">الطالب المتظلم *</label>
                <select
                  value={grievanceFormStudentId}
                  onChange={(e) => setGrievanceFormStudentId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  <option value="">اختر الطالب...</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الوحدة الدراسية *</label>
                <select
                  value={grievanceFormUnitId}
                  onChange={(e) => setGrievanceFormUnitId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">سبب التظلم وأوجه الاعتراض *</label>
                <textarea
                  required
                  rows={3}
                  value={grievanceFormReason}
                  onChange={(e) => setGrievanceFormReason(e.target.value)}
                  placeholder="مثال: يرى الطالب استيفاءه لكافة معايير بطاقة الملاحظة للمخرج الثاني ويرغب في إعادة فحص منتجه الفني"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsGrievanceModalOpen(false)} className="bg-slate-100 px-4 py-2 rounded-xl">إلغاء</button>
                <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer">قيد التظلم</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASSESSMENT CALENDAR EVENT                         */}
      {/* ======================================================== */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <span>إدراج موعد تقييم بالخطة الزمنية</span>
              </h3>
              <button onClick={() => setIsCalendarModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCalendarEvent} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">عنوان الموعد أو التقييم *</label>
                <input
                  type="text"
                  required
                  value={calendarFormTitle}
                  onChange={(e) => setCalendarFormTitle(e.target.value)}
                  placeholder="مثال: التقييم النهائي لوحدة السلامة المهنية"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الوحدة المقررة *</label>
                <select
                  value={calendarFormUnitId}
                  onChange={(e) => setCalendarFormUnitId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.code} - {u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">نوع الاستحقاق / الفرصة</label>
                <select
                  value={calendarFormEventType}
                  onChange={(e) => setCalendarFormEventType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="attempt_1">تقييم أول (الفرصة الأولى)</option>
                  <option value="attempt_2">تقييم ثانٍ (الفرصة الثانية)</option>
                  <option value="remedial_attempt_3">برنامج علاجي (الفرصة الثالثة)</option>
                  <option value="second_round">تقييم الدور الثاني</option>
                  <option value="internal_verification">جلسة تحقق داخلي</option>
                  <option value="external_verification">جلسة تحقق خارجي</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={calendarFormStartDate}
                    onChange={(e) => setCalendarFormStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    required
                    value={calendarFormEndDate}
                    onChange={(e) => setCalendarFormEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ملاحظات وتعليمات</label>
                <textarea
                  rows={2}
                  value={calendarFormNotes}
                  onChange={(e) => setCalendarFormNotes(e.target.value)}
                  placeholder="ملاحظات تنظيمية للورش والمقيمين"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCalendarModalOpen(false)} className="bg-slate-100 px-4 py-2 rounded-xl">إلغاء</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer">حفظ الموعد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EVIDENCE OF LEARNING CHECKLIST                    */}
      {/* ======================================================== */}
      {evidenceModalData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-600" />
                <span>توثيق أدلة التعلم لمخرج الجدارة</span>
              </h3>
              <button
                onClick={() => setEvidenceModalData(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div><strong>الطالب:</strong> {evidenceModalData.student.fullName}</div>
              <div><strong>الوحدة:</strong> {evidenceModalData.unit.name} ({evidenceModalData.unit.code})</div>
              <div><strong>المخرج:</strong> {evidenceModalData.outcome.code}: {evidenceModalData.outcome.title}</div>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={evidenceModalData.assessment?.hasPerformanceEvidence ?? true}
                  onChange={(e) => {
                    if (evidenceModalData.assessment) {
                      saveCompetencyAssessment({
                        ...evidenceModalData.assessment,
                        hasPerformanceEvidence: e.target.checked,
                      });
                      loadCompetencyData();
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <span className="font-bold block text-slate-900">1. دليل الأداء (Performance Evidence)</span>
                  <span className="text-slate-500 text-[11px]">استيفاء بطاقة الملاحظة وقائمة الرصد العملي بالورشة</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={evidenceModalData.assessment?.hasProductEvidence ?? true}
                  onChange={(e) => {
                    if (evidenceModalData.assessment) {
                      saveCompetencyAssessment({
                        ...evidenceModalData.assessment,
                        hasProductEvidence: e.target.checked,
                      });
                      loadCompetencyData();
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-bold block text-slate-900">2. دليل المنتج (Product Evidence)</span>
                  <span className="text-slate-500 text-[11px]">فحص ومطابقة المنتج الفني المنجز لأبعاد ومعايير الرسم الهندسي</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={evidenceModalData.assessment?.hasKnowledgeEvidence ?? true}
                  onChange={(e) => {
                    if (evidenceModalData.assessment) {
                      saveCompetencyAssessment({
                        ...evidenceModalData.assessment,
                        hasKnowledgeEvidence: e.target.checked,
                      });
                      loadCompetencyData();
                    }
                  }}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <div>
                  <span className="font-bold block text-slate-900">3. دليل التساؤل المعرفي (Knowledge Evidence)</span>
                  <span className="text-slate-500 text-[11px]">اجتياز الاستبيان الشفهي أو الاختبار التحريري القصير</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setEvidenceModalData(null);
                  showSuccessNotification('تم تحديث أدلة التعلم بنجاح وإيداعها في ملف إنجاز الطالب');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md"
              >
                تأكيد وحفظ الأدلة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE INTERNAL VERIFICATION SESSION              */}
      {/* ======================================================== */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>جلسة تحقق داخلي / خارجي وتدقيق العينات</span>
              </h3>
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVerificationSession} className="space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">نوع جلسة التحقق</label>
                  <select
                    value={verFormType}
                    onChange={(e) => setVerFormType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="internal">تحقق داخلي (Internal Verification)</option>
                    <option value="external">تحقق خارجي (External Verification)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">الوحدة الخاضعة للتدقيق</label>
                  <select
                    value={verFormUnitId || currentUnit?.id || ''}
                    onChange={(e) => setVerFormUnitId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.code} - {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">اسم المحقق / المقيم</label>
                  <input
                    type="text"
                    required
                    value={verFormVerifierName}
                    onChange={(e) => setVerFormVerifierName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">نسبة العينة العشوائية (%)</label>
                  <select
                    value={verFormSamplePercentage}
                    onChange={(e) => setVerFormSamplePercentage(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  >
                    <option value="10">10% من إجمالي الطلاب</option>
                    <option value="15">15% من إجمالي الطلاب</option>
                    <option value="20">20% من إجمالي الطلاب</option>
                    <option value="25">25% من إجمالي الطلاب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">قرار وموقف التحقق</label>
                <select
                  value={verFormStatus}
                  onChange={(e) => setVerFormStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="conforming">مطابق بنسبة 100% لقرارات المقيمين والأدلة</option>
                  <option value="conditional_pass">مطابق مشروط باستكمال بعض الأدلة</option>
                  <option value="non_conforming">غير مطابق - إعادة تقييم العينة</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">الملاحظات والتغذية الراجعة</label>
                <textarea
                  rows={2}
                  value={verFormNotes}
                  onChange={(e) => setVerFormNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer"
                >
                  سحب العينة واعتماد المحضر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRINT VIEW: OFFICIAL A4 COMPETENCY SHEETS & FORMS        */}
      {/* ======================================================== */}
      {(printClassSheet || printModalStudent || printVerificationRecord) && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl official-border">
            {/* Modal Controls (No Print) */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 no-print">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <span>معاينة مستند الجدارات الرسمي للطباعة والتصدير A4</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" /> طباعة المستند (A4)
                </button>
                <button
                  onClick={() => {
                    setPrintClassSheet(false);
                    setPrintModalStudent(null);
                    setPrintVerificationRecord(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="text-black bg-white p-4 space-y-4">
              {/* Official Ministry Header */}
              <div className="border-b-2 border-black pb-3">
                <div className="flex justify-between items-start text-xs font-bold leading-relaxed">
                  <div className="text-right space-y-0.5">
                    <div>جمهورية مصر العربية</div>
                    <div>وزارة التربية والتعليم والتعليم الفني</div>
                    <div>{schoolConfig.directorate}</div>
                    <div>{schoolConfig.administration}</div>
                    <div className="text-amber-900 font-black text-sm">{schoolConfig.name}</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="inline-block border-2 border-black px-4 py-1 rounded-md text-sm font-black bg-slate-50">
                      {printVerificationRecord
                        ? 'محضر اجتماع لجنة التحقق الداخلي المعتمد'
                        : printModalStudent
                        ? 'بطاقة ملاحظة وتقييم مخرجات التعلم وأدلة الجدارة'
                        : `استمارة رصد نتائج تقييم وحدة: (${currentUnit?.name || ''})`}
                    </div>
                    <div className="text-xs font-bold">
                      منظومة البرامج الدراسية المبنية على منهجية الجدارات المهنية
                    </div>
                    <div className="text-[11px] font-mono">العام الدراسي: {schoolConfig.academicYear}</div>
                  </div>

                  <div className="text-left space-y-0.5 font-mono text-xs">
                    <div>تاريخ الإصدار: {new Date().toISOString().split('T')[0]}</div>
                    <div>كود الوحدة: {currentUnit?.code || 'ELE-101'}</div>
                    <div>الساعات المقررة: {currentUnit?.totalHours || 40} س</div>
                  </div>
                </div>
              </div>

              {/* Document Body: Assessment Table or Verification */}
              {printVerificationRecord ? (
                <div className="space-y-3 text-xs">
                  <div className="border border-black p-3 rounded-md space-y-1">
                    <div><b>الوحدة المدققة:</b> {printVerificationRecord.unitName} ({printVerificationRecord.unitCode})</div>
                    <div><b>المحقق:</b> {printVerificationRecord.verifierName} ({printVerificationRecord.verifierRole})</div>
                    <div><b>حجم العينة:</b> {printVerificationRecord.totalStudentsAudited} طلاب ({printVerificationRecord.samplePercentage}%)</div>
                    <div><b>قرار المطابقة:</b> {printVerificationRecord.status === 'conforming' ? 'مطابق تماماً' : 'غير مطابق'}</div>
                  </div>

                  <div className="border border-black p-3 rounded-md">
                    <div className="font-bold mb-1">الطلاب في العينة العشوائية:</div>
                    <p>{printVerificationRecord.sampleStudentNames.join(' • ')}</p>
                  </div>

                  <div className="border border-black p-3 rounded-md">
                    <div className="font-bold mb-1">توصيات وملاحظات المحقق الداخلي:</div>
                    <p>{printVerificationRecord.feedbackNotes}</p>
                  </div>
                </div>
              ) : printModalStudent && currentUnit ? (
                <div className="space-y-3 text-xs">
                  <div className="border border-black p-3 rounded-md space-y-1">
                    <div><b>اسم الطالب:</b> {printModalStudent.fullName} | <b>كود الطالب:</b> {printModalStudent.studentCode} | <b>الرقم القومي:</b> {printModalStudent.nationalId}</div>
                    <div><b>التخصص:</b> {departments.find((d) => d.id === printModalStudent.departmentId)?.name} | <b>الصف:</b> {printModalStudent.gradeLevel} | <b>الفصل:</b> {classes.find((c) => c.id === printModalStudent.classId)?.name}</div>
                  </div>

                  <table className="w-full text-center border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-black">
                        <th className="p-1.5 border-l border-black">كود المخرج</th>
                        <th className="p-1.5 border-l border-black text-right">عنوان مخرج التعلم</th>
                        <th className="p-1.5 border-l border-black">دليل الأداء</th>
                        <th className="p-1.5 border-l border-black">دليل المنتج</th>
                        <th className="p-1.5 border-l border-black">دليل التساؤل</th>
                        <th className="p-1.5 border-l border-black">قرار التقييم</th>
                        <th className="p-1.5">توقيع المقيم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUnit.outcomes.map((o) => {
                        const rec = getAssessmentRecord(printModalStudent.id, currentUnit.id, o.id);
                        return (
                          <tr key={o.id} className="border-b border-black">
                            <td className="p-1.5 border-l border-black font-mono font-bold">{o.code}</td>
                            <td className="p-1.5 border-l border-black text-right font-medium">{o.title}</td>
                            <td className="p-1.5 border-l border-black font-bold">مستوفٍ [✓]</td>
                            <td className="p-1.5 border-l border-black font-bold">مستوفٍ [✓]</td>
                            <td className="p-1.5 border-l border-black font-bold">مستوفٍ [✓]</td>
                            <td className="p-1.5 border-l border-black font-bold">
                              {rec?.result === 'first_attempt_pass'
                                ? 'جدير (1)'
                                : rec?.result === 'second_attempt_pass'
                                ? 'جدير (2)'
                                : 'قيد التقييم'}
                            </td>
                            <td className="p-1.5 font-mono text-[10px]">{currentUser.name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  <table className="w-full text-center border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-black">
                        <th className="p-1.5 border-l border-black w-8">م</th>
                        <th className="p-1.5 border-l border-black text-right">اسم الطالب رباعي</th>
                        <th className="p-1.5 border-l border-black">نسبة حضور الورش</th>
                        {currentUnit?.outcomes.map((o) => (
                          <th key={o.id} className="p-1.5 border-l border-black">
                            <div>{o.code}</div>
                          </th>
                        ))}
                        <th className="p-1.5">قرار الوحدة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.slice(0, 30).map((s, idx) => {
                        const attStats = calculateStudentAttendanceStats(s, undefined, schoolConfig);
                        const pracRate = attStats.workshopAttendanceRate;
                        return (
                          <tr key={s.id} className="border-b border-black">
                            <td className="p-1.5 border-l border-black font-bold">{idx + 1}</td>
                            <td className="p-1.5 border-l border-black text-right font-bold">{s.fullName}</td>
                            <td className="p-1.5 border-l border-black font-mono font-bold">{pracRate}%</td>
                            {currentUnit?.outcomes.map((o) => {
                              const rec = getAssessmentRecord(s.id, currentUnit.id, o.id);
                              return (
                                <td key={o.id} className="p-1.5 border-l border-black font-bold text-[11px]">
                                  {rec?.result === 'first_attempt_pass'
                                    ? 'جدير 1'
                                    : rec?.result === 'second_attempt_pass'
                                    ? 'جدير 2'
                                    : rec?.result === 'remedial_program'
                                    ? 'علاج'
                                    : '-'}
                                </td>
                              );
                            })}
                            <td className="p-1.5 font-black text-emerald-900">جدير</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Official 4-Signatures Block */}
              <div className="pt-6 border-t-2 border-black grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <div className="space-y-6">
                  <div>المعلم المقيم</div>
                  <div className="font-medium text-slate-700">({printAssessorTeacher || currentUser.name})</div>
                </div>
                <div className="space-y-6">
                  <div>المحقق الداخلي</div>
                  <div className="font-medium text-slate-700">({printInternalVerifier || '........................'})</div>
                </div>
                <div className="space-y-6">
                  <div>المحقق الخارجي / سوق العمل</div>
                  <div className="font-medium text-slate-700">(ممثل قطاع الصناعة)</div>
                </div>
                <div className="space-y-6">
                  <div>يعتمد / مدير عام المدرسة</div>
                  <div className="font-medium text-slate-700">({schoolConfig.managerName || '........................'})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
