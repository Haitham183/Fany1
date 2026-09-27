'use client';

import React, { useState } from 'react';
import {
  WorkshopViolationRecord,
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  SafetyViolationType,
} from '@/types';
import {
  logWorkshopViolation,
  deleteWorkshopViolation,
  getWorkshopViolations,
} from '@/lib/storage';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Printer,
  Search,
  Filter,
  Flame,
  AlertTriangle,
  UserX,
  EyeOff,
  Footprints,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

interface WorkshopSafetyViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  currentUser: User;
  onDataChanged: () => void;
}

export const WorkshopSafetyView: React.FC<WorkshopSafetyViewProps> = ({
  students,
  classes,
  departments,
  schoolConfig,
  currentUser,
  onDataChanged,
}) => {
  const isFullAdmin =
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  const defaultDept = !isFullAdmin && currentUser.departmentId ? currentUser.departmentId : 'all';

  const [violations, setViolations] = useState<WorkshopViolationRecord[]>(() =>
    getWorkshopViolations()
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDept);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formViolationType, setFormViolationType] = useState<SafetyViolationType>('no_uniform');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formActionTaken, setFormActionTaken] = useState<string>('تنبيه كتابي واستدعاء ولي الأمر');

  const refreshLocalViolations = () => {
    setViolations(getWorkshopViolations());
    onDataChanged();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل من سجلات السلامة؟')) {
      deleteWorkshopViolation(id);
      refreshLocalViolations();
    }
  };

  const handleCreateViolation = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === formStudentId);
    if (!student) {
      alert('يرجى اختيار الطالب');
      return;
    }

    const targetClass = classes.find((c) => c.id === student.classId);
    const targetDept = departments.find((d) => d.id === student.departmentId);

    const titleMap: Record<SafetyViolationType, string> = {
      no_uniform: 'عدم ارتداء الأفرول / الزي المخصص للورشة',
      no_safety_shoes: 'عدم ارتداء حذاء الأمان (Safety Shoes)',
      no_safety_glasses: 'عدم ارتداء نظارة الحماية أثناء العمل على الماكينة',
      tools_misuse: 'استخدام خاطئ للعدد والآلات يعرض الطالب وزملائه للخطر',
      workshop_escape: 'الهروب والتزويغ من فترة تدريب الورشة بعد طابور الصباح',
      behavioral: 'سلوك غير منضبط داخل الورشة الصناعية',
    };

    logWorkshopViolation({
      studentId: student.id,
      studentName: student.fullName,
      classId: student.classId,
      className: targetClass?.name || 'فصل غير محدد',
      departmentId: student.departmentId,
      departmentName: targetDept?.name || 'قسم غير محدد',
      date: new Date().toISOString().split('T')[0],
      violationType: formViolationType,
      violationTitle: titleMap[formViolationType],
      description: formDescription || titleMap[formViolationType],
      instructorName: currentUser.name,
      actionTaken: formActionTaken,
    });

    setIsAddModalOpen(false);
    setFormStudentId('');
    setFormDescription('');
    refreshLocalViolations();
  };

  // Filtered List
  const filteredViolations = violations.filter((v) => {
    if (selectedDeptId !== 'all' && v.departmentId !== selectedDeptId) return false;
    if (selectedType !== 'all' && v.violationType !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.studentName.toLowerCase().includes(q);
      const matchDesc = v.description.toLowerCase().includes(q);
      const matchAction = v.actionTaken.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchAction) return false;
    }
    return true;
  });

  const escapeCount = violations.filter((v) => v.violationType === 'workshop_escape').length;
  const uniformCount = violations.filter((v) => v.violationType === 'no_uniform' || v.violationType === 'no_safety_shoes').length;
  const toolsCount = violations.filter((v) => v.violationType === 'tools_misuse' || v.violationType === 'no_safety_glasses').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-red-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-red-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> السلامة والصحة المهنية وتأمين بيئة العمل
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-red-400">
            سجل مخالفات مهمات الوقاية والتزويغ والهروب من الورش
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            متابعة انضباط الطلاب داخل الورش الصناعية (الأفرول، حذاء الأمان) ورصد حالات التزويغ والهروب بعد الحصة الأولى.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة السجل الرسمي
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> رصد مخالفة جديدة
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold">إجمالي المخالفات المرصودة</div>
            <div className="text-2xl font-black text-slate-900">{violations.length}</div>
            <div className="text-[10px] text-slate-400">سجل السلامة والورش</div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-black">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-purple-700 font-bold">حالات التزويغ من الورش</div>
            <div className="text-2xl font-black text-purple-900">{escapeCount}</div>
            <div className="text-[10px] text-purple-700">هروب بعد الحصة الأولى</div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-black">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-amber-800 font-bold">مخالفات الزي وحذاء الأمان</div>
            <div className="text-2xl font-black text-amber-900">{uniformCount}</div>
            <div className="text-[10px] text-amber-700">عدم ارتداء مهمات الحماية</div>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-black">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-red-700 font-bold">مخالفات تشغيل العدد والماكينات</div>
            <div className="text-2xl font-black text-red-900">{toolsCount}</div>
            <div className="text-[10px] text-red-700">استخدام غير آمن للمعدات</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم الطالب أو الوصف أو الإجراء..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedDeptId}
              disabled={!isFullAdmin && departments.length <= 1}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold p-2 text-slate-800 focus:ring-2 focus:ring-red-500 disabled:opacity-80"
            >
              {isFullAdmin && <option value="all">جميع الأقسام والورش</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold p-2 text-slate-800 focus:ring-2 focus:ring-red-500"
          >
            <option value="all">جميع أنواع المخالفات</option>
            <option value="workshop_escape">التزويغ والهروب من الورشة</option>
            <option value="no_uniform">عدم ارتداء الأفرول</option>
            <option value="no_safety_shoes">عدم ارتداء حذاء الأمان</option>
            <option value="no_safety_glasses">عدم ارتداء النظارة الواقية</option>
            <option value="tools_misuse">استخدام خاطئ للعدد والماكينات</option>
            <option value="behavioral">مخالفة سلوكية</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          تم العثور على: <span className="text-red-600 font-black">{filteredViolations.length}</span> مخالفة
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="bg-slate-900 text-slate-100 font-bold">
              <tr>
                <th className="p-3 text-center w-10">م</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">اسم الطالب</th>
                <th className="p-3">الورشة / القسم</th>
                <th className="p-3">نوع المخالفة</th>
                <th className="p-3">التفاصيل والوصف</th>
                <th className="p-3">الإجراء المتخذ</th>
                <th className="p-3">المعلم الراصد</th>
                <th className="p-3 text-center no-print">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    لا توجد مخالفات مسجلة مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center text-slate-400 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {v.date}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-sm">{v.studentName}</div>
                      <div className="text-[10px] text-slate-500">{v.className}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{v.departmentName}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          v.violationType === 'workshop_escape'
                            ? 'bg-purple-100 text-purple-800'
                            : v.violationType === 'tools_misuse'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.violationTitle}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={v.description}>
                      {v.description}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        {v.actionTaken}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{v.instructorName}</td>
                    <td className="p-3 text-center no-print">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Violation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" /> رصد مخالفة سلامة وصحة مهنية / تزويغ من الورشة
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateViolation} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">اختر الطالب المخالف:</label>
                <select
                  required
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- اضغط لاختيار الطالب --</option>
                  {[...students]
                    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true }))
                    .map((s) => {
                      const c = classes.find((cls) => cls.id === s.classId);
                      const d = departments.find((dept) => dept.id === s.departmentId);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({c?.name || 'بدون فصل'} - {d?.name || 'بدون تخصص'})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">نوع المخالفة المرصودة:</label>
                <select
                  value={formViolationType}
                  onChange={(e) => setFormViolationType(e.target.value as SafetyViolationType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                >
                  <option value="workshop_escape">الهروب والتزويغ من الورشة بعد الحصة الأولى</option>
                  <option value="no_uniform">عدم ارتداء الأفرول / الزي المخصص</option>
                  <option value="no_safety_shoes">عدم ارتداء حذاء الأمان (Safety Shoes)</option>
                  <option value="no_safety_glasses">عدم ارتداء النظارات الواقية أثناء العمل</option>
                  <option value="tools_misuse">استخدام خاطئ للعدد والماكينات</option>
                  <option value="behavioral">مخالفة سلوكية داخل الورشة</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">تفاصيل ووصف الواقعة:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="مثال: تم ضبط الطالب أثناء محاولة مغادرة ورشة النجارة دون إذن بعد الحصة الثانية..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">الإجراء المتخذ ضد الطالب:</label>
                <input
                  type="text"
                  required
                  value={formActionTaken}
                  onChange={(e) => setFormActionTaken(e.target.value)}
                  placeholder="مثال: استدعاء ولي الأمر وتنبيه كتابي وتدوين 6 ساعات غياب..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  تسجيل المخالفة فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
