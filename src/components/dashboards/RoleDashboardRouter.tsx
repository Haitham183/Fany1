'use client';

import React, { useState } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  UserRole,
} from '@/types';
import { PrincipalDashboard } from './PrincipalDashboard';
import { AffairsDeputyDashboard } from './AffairsDeputyDashboard';
import { DeptHeadDashboard } from './DeptHeadDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { SocialWorkerDashboard } from './SocialWorkerDashboard';
import { ParentDashboard } from './ParentDashboard';
import { Shield, Sparkles, UserCheck } from 'lucide-react';

interface RoleDashboardRouterProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  notices: OfficialNotice[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onNavigateToStudentReport?: (studentId: string) => void;
  onSelectClassForAttendance?: (classId: string) => void;
  onOpenSocialCase?: (caseId: string) => void;
}

export const RoleDashboardRouter: React.FC<RoleDashboardRouterProps> = (props) => {
  const { currentUser } = props;
  const [activeRoleOverride, setActiveRoleOverride] = useState<UserRole | null>(null);

  const effectiveRole = activeRoleOverride || currentUser.role;

  const roleLabels: Record<UserRole, string> = {
    directorate_admin: 'مسؤول المديرية المركزية 🏛️',
    principal: 'مدير المدرسة',
    affairs_deputy: 'وكيل شئون الطلاب',
    affairs_officer: 'مسؤول شئون الطلاب',
    dept_head: 'رئيس قسم صناعي',
    teacher: 'معلم / مدرب ورشة',
    social_worker: 'الأخصائي الاجتماعي',
    parent: 'ولي الأمر',
    external_verifier: 'المحقق الخارجي',
    system_admin: 'مدير النظام',
  };

  const renderDashboard = () => {
    switch (effectiveRole) {
      case 'directorate_admin':
      case 'principal':
      case 'system_admin':
        return <PrincipalDashboard {...props} />;
      case 'affairs_deputy':
      case 'affairs_officer':
        return <AffairsDeputyDashboard {...props} />;
      case 'dept_head':
      case 'external_verifier':
        return <DeptHeadDashboard {...props} />;
      case 'teacher':
        return <TeacherDashboard {...props} />;
      case 'social_worker':
        return <SocialWorkerDashboard {...props} onOpenCase={props.onOpenSocialCase} />;
      case 'parent':
        return <ParentDashboard {...props} />;
      default:
        return <PrincipalDashboard {...props} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Role Switcher Toolbar (Useful for testing & role simulation) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            الدور الفعلي: <span className="text-blue-600 dark:text-blue-400">{currentUser.roleTitle || roleLabels[currentUser.role]}</span>
          </span>
          {activeRoleOverride && (
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              معاينة كـ: {roleLabels[activeRoleOverride]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">معاينة الأدوار:</span>
          {(['principal', 'affairs_deputy', 'dept_head', 'teacher', 'social_worker', 'parent'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRoleOverride(r === currentUser.role ? null : r)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                effectiveRole === r
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {roleLabels[r]}
            </button>
          ))}
          {activeRoleOverride && (
            <button
              onClick={() => setActiveRoleOverride(null)}
              className="text-[11px] text-red-600 hover:underline px-1.5 font-bold cursor-pointer"
            >
              إلغاء المعاينة
            </button>
          )}
        </div>
      </div>

      {/* Render Dynamic Role Dashboard */}
      {renderDashboard()}
    </div>
  );
};
