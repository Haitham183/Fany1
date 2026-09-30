'use client';

import React from 'react';
import { User } from '@/types';
import { getUsers } from '@/lib/storage';
import { ShieldCheck, UserCheck, Briefcase, Wrench, Zap, X, Check, GraduationCap, HeartHandshake, Award } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSelectUser: (user: User) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  const allUsers = getUsers();
  // Ensure directorate_admin only appears if currentUser is directorate_admin
  const users = allUsers.filter((u) => {
    if (u.role === 'directorate_admin' && currentUser.role !== 'directorate_admin') {
      return false;
    }
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'directorate_admin':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      case 'principal':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'affairs_deputy':
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case 'affairs_officer':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'social_worker':
        return <HeartHandshake className="w-5 h-5 text-teal-600" />;
      case 'competency_officer':
        return <Award className="w-5 h-5 text-purple-600" />;
      case 'dept_head':
        return <Zap className="w-5 h-5 text-purple-600" />;
      default:
        return <Wrench className="w-5 h-5 text-amber-600" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'directorate_admin':
        return 'مسئول المديرية المركزية: إدارة المدارس المتعددة، متابعة إحصائيات الغياب والجدارات على مستوى المحافظة، وإضافة المدارس الجديدة.';
      case 'principal':
        return 'مدير المدرسة: صلاحيات إدارية كاملة تشمل إدارة المستخدمين، إعدادات المدرسة، نسب الحضور العامة، واعتماد القرارات والإنذارات.';
      case 'affairs_deputy':
        return 'وكيل شئون الطلاب: الإشراف على لجان الانضباط المدرسي، نقل وتحويل الطلاب بين التخصصات، واعتماد الإنذارات وقرارات الفصل.';
      case 'affairs_officer':
        return 'مسئول شئون الطلاب: رصد شيت الغياب الأسبوعي 1 سر، تسجيل الطلاب الجدد، اعتماد الأعذار الطبية، وتجهيز الإنذارات الرسمية.';
      case 'social_worker':
        return 'الأخصائي الاجتماعي والتربوي: متابعة حالات التنبؤ الذكي بالتسرب، دراسة الحالات الفردية، مواثيق الانضباط، والتواصل مع أولياء الأمور.';
      case 'competency_officer':
        return 'مسئول الجدارات والتقييم: متابعة نسبة حضور الورش 85%، مخرجات التعلم، والبرامج العلاجية للطلاب المتعثرين.';
      case 'dept_head':
        return 'رئيس القسم الصناعي: تسجيل ومتابعة حضور وغياب ورش التخصص، الإشراف الفني على ورش ومعامل القسم والتدريب العملي.';
      default:
        return 'معلم / مدرب ورشة: تسجيل حضور وغياب فصول وورش التدريب العملي.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">فريق العمل والأدوار الوظيفية بالمدرسة</h2>
              <p className="text-xs text-slate-300">
                (مدير المدرسة • وكيل شئون الطلاب • مسئول شئون الطلاب • رؤساء الأقسام)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Options List */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {users.map((user) => {
            const isSelected = currentUser.id === user.id;
            return (
              <div
                key={user.id}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-amber-100' : 'bg-slate-100'
                    }`}
                  >
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {user.roleTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {getRoleDescription(user.role)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>اسم المستخدم: <b>{user.username}</b></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium hover:text-slate-600">
                      دخول به
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>* يتم تخصيص صلاحيات كل دور بدقة داخل المنظومة.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
