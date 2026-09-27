'use client';

import React, { useState } from 'react';
import { Department, SchoolClass, Student, User, AttendanceRecord } from '@/types';
import {
  Wrench,
  Zap,
  Car,
  Snowflake,
  Cog,
  Cpu,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface DepartmentReportsViewProps {
  departments: Department[];
  classes: SchoolClass[];
  students: Student[];
  attendance: AttendanceRecord[];
  currentUser: User;
}

export const DepartmentReportsView: React.FC<DepartmentReportsViewProps> = ({
  departments,
  classes,
  students,
  attendance,
  currentUser,
}) => {
  const isFullAdmin =
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  // If currentUser has departmentId and not full admin, lock to their department
  const defaultDeptId =
    !isFullAdmin && currentUser.departmentId
      ? currentUser.departmentId
      : departments[0]?.id || '';

  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDeptId);

  const selectedDepartment = departments.find((d) => d.id === selectedDeptId) || departments[0];
  const deptClasses = classes.filter((c) => c.departmentId === selectedDepartment?.id);
  const deptStudents = students.filter((s) => s.departmentId === selectedDepartment?.id);

  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Car':
        return <Car className="w-6 h-6 text-blue-500" />;
      case 'Snowflake':
        return <Snowflake className="w-6 h-6 text-cyan-500" />;
      case 'Cog':
        return <Cog className="w-6 h-6 text-slate-600" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-emerald-500" />;
      default:
        return <Wrench className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-purple-700/50 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-purple-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> الإشراف الفني والتدريب المهني
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            متابعة ورش الأقسام التخصصية والتدريب العملي
          </h2>
          <p className="text-[11px] text-purple-100 max-w-2xl leading-relaxed">
            متابعة حضور الطلاب في الورش العملية، واستيفاء ساعات التدريب اللازمة لاجتياز تقييم الجدارات.
          </p>
        </div>

        {/* Department Selector */}
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20">
          <select
            value={selectedDeptId}
            disabled={!isFullAdmin && departments.length <= 1}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden disabled:opacity-80"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Department Overview */}
      {selectedDepartment && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner">
                {getDeptIcon(selectedDepartment.iconName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedDepartment.name}
                  </h3>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-mono font-bold">
                    {selectedDepartment.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {selectedDepartment.description}
                </p>
              </div>
            </div>

            <div className="text-right bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-blue-700 font-bold text-[11px]">مشرف القسم العلمي (نظري):</span>
                <span className="font-bold text-slate-900 text-xs">{selectedDepartment.scientificSupervisorName || 'غير محدد'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-1">
                <span className="text-emerald-700 font-bold text-[11px]">مشرف القسم العملي (ورش):</span>
                <span className="font-bold text-slate-900 text-xs">{selectedDepartment.practicalSupervisorName || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-bold">إجمالي طلاب التخصص</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{deptStudents.length} طالب</div>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-700 font-bold">عدد الورش والمعامل المجهزة</div>
                <div className="text-2xl font-black text-emerald-900 mt-0.5">{selectedDepartment.workshopCount} ورش تدريب</div>
              </div>
              <Wrench className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-700 font-bold">عدد الفصول المسكنة بالقسم</div>
                <div className="text-2xl font-black text-amber-900 mt-0.5">{deptClasses.length} فصول</div>
              </div>
              <Building2 className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          {/* Department Classes & Workshops Roster */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-600" />
              فصول وورش القسم ومدرسيها المشرفين
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deptClasses.map((cls) => {
                const clsStudents = students.filter((s) => s.classId === cls.id);
                const absentsInClass = clsStudents.reduce((acc, curr) => acc + curr.totalAbsenceDays, 0);

                return (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-purple-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{cls.name}</h5>
                        <div className="text-xs text-slate-500">{cls.gradeName}</div>
                      </div>
                      <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-lg font-bold border border-purple-200">
                        {clsStudents.length} طالب
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">مقر التدريب:</span>
                        <span className="font-bold text-slate-800">{cls.roomNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">المعلم المشرف:</span>
                        <span className="font-bold text-slate-800">{cls.supervisorTeacherName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
