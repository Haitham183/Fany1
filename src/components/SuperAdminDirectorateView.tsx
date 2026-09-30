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
} from '@/types';
import {
  getSchools,
  getActiveSchoolId,
  setActiveSchoolId,
  saveSchool,
  deleteSchool,
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface SuperAdminDirectorateViewProps {
  currentUser: User;
  students?: Student[];
  departments?: Department[];
  classes?: SchoolClass[];
  attendance?: AttendanceRecord[];
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
  onSelectSchool,
  onNavigateTab,
  onNavigateToSchool,
}) => {
  const [schools, setSchools] = useState<SchoolTenant[]>(() => getSchools());
  const [activeSchoolId, setActiveSchoolIdState] = useState<string>(() => getActiveSchoolId());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirectorate, setFilterDirectorate] = useState('all');

  // New School Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newSchoolDirectorate, setNewSchoolDirectorate] = useState('مديرية التربية والتعليم بالقاهرة');
  const [newSchoolAdmin, setNewSchoolAdmin] = useState('إدارة الوايلي التعليمية');
  const [newSchoolSystem, setNewSchoolSystem] = useState<SchoolSystemType>('3_years');
  const [newSchoolShift, setNewSchoolShift] = useState<SchoolShiftType>('single_morning');
  const [newSchoolDays, setNewSchoolDays] = useState<WorkDaysScheme>('sun_to_thu');
  const [newSchoolPrincipal, setNewSchoolPrincipal] = useState('');
  const [newSchoolPhone, setNewSchoolPhone] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');

  const refreshSchools = () => {
    setSchools(getSchools());
    setActiveSchoolIdState(getActiveSchoolId());
  };

  const handleSwitchSchool = (schoolId: string) => {
    setActiveSchoolId(schoolId);
    setActiveSchoolIdState(schoolId);
    if (onSelectSchool) {
      onSelectSchool(schoolId);
    }
    if (onNavigateToSchool) {
      onNavigateToSchool(schoolId);
    }
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim() || !newSchoolCode.trim()) return;

    saveSchool({
      name: newSchoolName.trim(),
      code: newSchoolCode.trim(),
      directorate: newSchoolDirectorate.trim(),
      administration: newSchoolAdmin.trim(),
      systemType: newSchoolSystem,
      shiftType: newSchoolShift,
      workDaysScheme: newSchoolDays,
      principalName: newSchoolPrincipal.trim(),
      phone: newSchoolPhone.trim(),
      address: newSchoolAddress.trim(),
      isActive: true,
    });

    setIsAddModalOpen(false);
    resetForm();
    refreshSchools();
  };

  const resetForm = () => {
    setNewSchoolName('');
    setNewSchoolCode('');
    setNewSchoolPrincipal('');
    setNewSchoolPhone('');
    setNewSchoolAddress('');
  };

  const handleDeleteSchool = (schoolId: string, schoolName: string) => {
    if (schools.length <= 1) {
      alert('لا يمكن حذف المدرسة الأخيرة في المنظومة.');
      return;
    }
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف مدرسة (${schoolName}) من المنظومة؟`)) {
      deleteSchool(schoolId);
      refreshSchools();
    }
  };

  // Filtered Schools List
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch =
        s.name.includes(searchQuery.trim()) ||
        s.code.includes(searchQuery.trim()) ||
        s.administration.includes(searchQuery.trim()) ||
        s.directorate.includes(searchQuery.trim());
      const matchDir = filterDirectorate === 'all' || s.directorate.includes(filterDirectorate);
      return matchSearch && matchDir;
    });
  }, [schools, searchQuery, filterDirectorate]);

  // Aggregate Stats
  const totalSchoolsCount = schools.length;
  const activeSchoolsCount = schools.filter((s) => s.isActive).length;
  const totalStudentsOverall = students.length;
  const totalDeptsOverall = departments.length;

  return (
    <div className="space-y-6">
      {/* Top Directorate Cockpit Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-800/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-3 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>القيادة المركزية لمدارس التعليم الفني الصناعي (Multi-School Central Engine)</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {activeSchoolsCount} مدارس نشطة
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              لوحة تحكم المشرف العام والمديرية التعليمية
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              إدارة وعزل بيانات المدارس الفنية الصناعية، تتبع مؤشرات الحضور والجدارات المجمعة، والتنقل الفوري بين أنظمة المدارس.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              إضافة مدرسة فنية جديدة
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Summary Directorate KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">إجمالي المدارس المسجلة</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalSchoolsCount}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold mt-0.5">
              100% معزولة أمنياً
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">إجمالي الطلاب المسجلين</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalStudentsOverall}</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-semibold mt-0.5">
              عبر جميع التخصصات
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">الأقسام الصناعية والورش</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalDeptsOverall}</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold mt-0.5">
              منهجية الجدارات CBE
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">المدرسة النشطة حالياً</span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate block max-w-[150px]">
              {schools.find((s) => s.id === activeSchoolId)?.name || 'العباسية الصناعية'}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold mt-0.5">
              كود: {schools.find((s) => s.id === activeSchoolId)?.code || '10201'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المدرسة، الكود الوزاري، أو الإدارة التعليمية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold">المديرية:</span>
          <select
            value={filterDirectorate}
            onChange={(e) => setFilterDirectorate(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">جميع المديريات</option>
            <option value="القاهرة">القاهرة</option>
            <option value="الجيزة">الجيزة</option>
            <option value="الإسكندرية">الإسكندرية</option>
          </select>
        </div>
      </div>

      {/* Schools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const isCurrentActive = school.id === activeSchoolId;

          return (
            <div
              key={school.id}
              className={`p-5 rounded-3xl border transition-all duration-200 space-y-4 flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-950/30 dark:to-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 block">
                        كود المدرسة: {school.code}
                      </span>
                      <h4 className="font-black text-slate-900 dark:text-white text-sm line-clamp-2">
                        {school.name}
                      </h4>
                    </div>
                  </div>

                  {isCurrentActive && (
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex-shrink-0">
                      النشطة حالياً
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{school.directorate} • {school.administration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>المدير: {school.principalName || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      النظام: {school.systemType === '5_years_advanced' ? 'فني متقدم (5 سنوات)' : 'صناعي عام (3 سنوات)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant={isCurrentActive ? 'secondary' : 'primary'}
                  size="sm"
                  className="flex-1 font-bold text-xs"
                  onClick={() => handleSwitchSchool(school.id)}
                >
                  {isCurrentActive ? '✓ تدير هذه المدرسة الآن' : 'الدخول لإدارة هذه المدرسة ➔'}
                </Button>

                {schools.length > 1 && (
                  <button
                    onClick={() => handleDeleteSchool(school.id, school.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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

      {/* Modal to Register a New Technical School */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة مدرسة فنية صناعية جديدة للمنظومة"
      >
        <form onSubmit={handleCreateSchool} className="space-y-4">
          <Input
            label="اسم المدرسة الفنية بالكامل *"
            placeholder="مثال: مدرسة السويس الثانوية الصناعية المتقدمة"
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="كود المدرسة المالي والوزاري *"
              placeholder="مثال: 10408"
              value={newSchoolCode}
              onChange={(e) => setNewSchoolCode(e.target.value)}
              required
            />

            <Input
              label="مدير عام المدرسة"
              placeholder="اسم مدير المدرسة"
              value={newSchoolPrincipal}
              onChange={(e) => setNewSchoolPrincipal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="مديرية التربية والتعليم *"
              placeholder="مثال: مديرية التربية والتعليم بالقاهرة"
              value={newSchoolDirectorate}
              onChange={(e) => setNewSchoolDirectorate(e.target.value)}
              required
            />

            <Input
              label="الإدارة التعليمية *"
              placeholder="مثال: إدارة الساحل التعليمية"
              value={newSchoolAdmin}
              onChange={(e) => setNewSchoolAdmin(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="نظام الدراسة"
              value={newSchoolSystem}
              onChange={(e) => setNewSchoolSystem(e.target.value as SchoolSystemType)}
              options={[
                { value: '3_years', label: 'دبلوم صناعي (3 سنوات)' },
                { value: '5_years_advanced', label: 'فني متقدم (5 سنوات)' },
                { value: 'applied_technology', label: 'تكنولوجيا تطبيقية' },
                { value: 'dual_education', label: 'تعليم مزدوج' },
              ]}
            />

            <Select
              label="نظام الفترات"
              value={newSchoolShift}
              onChange={(e) => setNewSchoolShift(e.target.value as SchoolShiftType)}
              options={[
                { value: 'single_morning', label: 'فترة صباحية واحدة' },
                { value: 'two_shifts', label: 'فترتان (صباحي ومسائي)' },
              ]}
            />

            <Select
              label="أيام العمل الأسبوعية"
              value={newSchoolDays}
              onChange={(e) => setNewSchoolDays(e.target.value as WorkDaysScheme)}
              options={[
                { value: 'sun_to_thu', label: 'الأحد إلى الخميس (5 أيام)' },
                { value: 'sat_to_thu', label: 'السبت إلى الخميس (6 أيام)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="هاتف المدرسة"
              placeholder="مثال: 0224820000"
              value={newSchoolPhone}
              onChange={(e) => setNewSchoolPhone(e.target.value)}
            />

            <Input
              label="عنوان المدرسة"
              placeholder="الشارع / المنطقة / المحافظة"
              value={newSchoolAddress}
              onChange={(e) => setNewSchoolAddress(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" type="submit">
              حفظ وتسجيل المدرسة
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
