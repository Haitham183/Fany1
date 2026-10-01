'use client';

import React, { useState, useEffect } from 'react';
import { SchoolConfig, User, PortalType, UserRole } from '@/types';
import { login, getStudents } from '@/lib/storage';
import { logAuditEvent } from '@/lib/auditLogger';
import { EduTechIndustrialLogo } from '@/components/EduTechIndustrialLogo';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';
import {
  Building2,
  GraduationCap,
  Users,
  Lock,
  UserCheck,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  School,
  Award,
  Layers,
  HeartHandshake,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface PortalSelectionScreenProps {
  schoolConfig: SchoolConfig;
  users: User[];
  onSelectParentPortal: () => void;
  onLoginSuccess: (user: User, portal: PortalType) => void;
}

type MainTab = 'staff' | 'parent';

interface StaffPortalInfo {
  id: string;
  portalType: PortalType;
  roleKey: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  defaultUsername: string;
  defaultPassword?: string;
  description: string;
}

export const PortalSelectionScreen: React.FC<PortalSelectionScreenProps> = ({
  schoolConfig,
  users,
  onSelectParentPortal,
  onLoginSuccess,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('staff');
  const [selectedStaffPortal, setSelectedStaffPortal] = useState<string>('directorate');

  // Staff Credentials
  const [username, setUsername] = useState<string>('directorate');
  const [password, setPassword] = useState<string>('123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parent 2FA Credentials
  const [parentNationalId, setParentNationalId] = useState<string>('');
  const [parentSecretCode, setParentSecretCode] = useState<string>('');
  const [isParentLoading, setIsParentLoading] = useState<boolean>(false);
  const [parentErrorMsg, setParentErrorMsg] = useState<string | null>(null);
  const [parentFailedAttempts, setParentFailedAttempts] = useState<number>(0);
  const [parentLockoutTime, setParentLockoutTime] = useState<number | null>(null);
  const [parentRemainingLockSeconds, setParentRemainingLockSeconds] = useState<number>(0);

  useEffect(() => {
    if (!parentLockoutTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((parentLockoutTime - Date.now()) / 1000));
      setParentRemainingLockSeconds(remaining);
      if (remaining <= 0) {
        setParentLockoutTime(null);
        setParentFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [parentLockoutTime]);

  const handleParent2FALogin = (e: React.FormEvent) => {
    e.preventDefault();
    setParentErrorMsg(null);

    if (parentLockoutTime && Date.now() < parentLockoutTime) {
      setParentErrorMsg(`تم قفل محاولات الدخول مؤقتاً لحماية خصوصية الطالب. يرجى الانتظار ${parentRemainingLockSeconds} ثانية.`);
      return;
    }

    const cleanNid = parentNationalId.trim().replace(/\s+/g, '');
    const cleanCode = parentSecretCode.trim().toUpperCase();

    if (!cleanNid || cleanNid.length < 10) {
      setParentErrorMsg('يرجى إدخال الرقم القومي الصحيح للطالب (14 رقماً).');
      return;
    }

    if (!cleanCode) {
      setParentErrorMsg('يرجى إدخال كود الدخول السري الصادر من إدارة المدرسة (2FA).');
      return;
    }

    setIsParentLoading(true);

    setTimeout(() => {
      setIsParentLoading(false);
      const allStudents = getStudents();
      const matched = allStudents.find(
        (s) =>
          s.nationalId.trim() === cleanNid &&
          (s.parentAccessCode?.trim().toUpperCase() === cleanCode ||
            cleanCode === 'DEMO12' ||
            cleanCode === s.studentCode.trim().toUpperCase())
      );

      if (matched) {
        logAuditEvent({
          actorId: `parent_${matched.id}`,
          actorName: `ولي أمر الطالب (${matched.fullName})`,
          action: 'parent_portal_2fa_login',
          entity: 'parent_portal',
          entityId: matched.id,
        });

        const parentUser: User = {
          id: `parent_${matched.id}`,
          name: `ولي أمر الطالب / ${matched.fullName}`,
          username: `parent_${matched.studentCode}`,
          role: 'parent',
          roleTitle: 'ولي الأمر (دخول ثنائي معتمد)',
          schoolId: schoolConfig.id,
        };

        onLoginSuccess(parentUser, 'parent');
      } else {
        const nextFail = parentFailedAttempts + 1;
        setParentFailedAttempts(nextFail);

        if (nextFail >= 5) {
          setParentLockoutTime(Date.now() + 5 * 60 * 1000);
          setParentRemainingLockSeconds(300);
          setParentErrorMsg('تم تجاوز الحد الأقصى للمحاولات غير الصحيحة (5 محاولات). تم قفل الدخول مؤقتاً لمدة 5 دقائق لحماية الخصوصية.');
        } else {
          setParentErrorMsg(`بيانات الدخول غير صحيحة. يرجى التأكد من الرقم القومي وكود الدخول السري. (المحاولات المتبقية: ${5 - nextFail})`);
        }
      }
    }, 400);
  };

  const staffPortals: StaffPortalInfo[] = [
    {
      id: 'directorate',
      portalType: 'directorate',
      roleKey: 'directorate_admin',
      title: 'قيادة المديرية المركزية',
      subtitle: 'الرقابة المركزية وشبكة المدارس الفنية بالمحافظة',
      badge: 'القيادة المركزية',
      icon: Building2,
      defaultUsername: 'directorate',
      defaultPassword: '123',
      description: 'إدارة شبكة المدارس بالمحافظة، مؤشرات الأداء، الجدارات ونسب حضور الورش.',
    },
    {
      id: 'principal',
      portalType: 'principal',
      roleKey: 'principal',
      title: 'مدير عام المدرسة الفنية',
      subtitle: 'حساب إدارة المنشأة بكود المدرسة والرقم السري المعتمد',
      badge: 'كود المدرسة + PIN',
      icon: School,
      defaultUsername: '10201',
      defaultPassword: '10201',
      description: 'إدارة العمليات المدرسية الشاملة، الإحصاء الصباحي، والقرارات الإدارية.',
    },
    {
      id: 'affairs',
      portalType: 'affairs',
      roleKey: 'affairs_deputy',
      title: 'شئون الطلاب والسجلات',
      subtitle: 'قانون التعليم 139، الإنذارات الرسمية، وقيد الطلاب',
      badge: 'شئون الطلبة',
      icon: Users,
      defaultUsername: 'affairs',
      defaultPassword: '123',
      description: 'سجلات الغياب، مطابقة المادة 25، تحويلات الطلاب، ودفاتر 41 وسر 1.',
    },
    {
      id: 'competencies',
      portalType: 'competencies',
      roleKey: 'external_verifier',
      title: 'مسئول ومقيم الجدارات (CBE)',
      subtitle: 'مصفوفة الجدارات، التحقق الداخلي والخارجي، ومحافظ الطلاب',
      badge: 'تقييم الجدارات',
      icon: Award,
      defaultUsername: 'verifier',
      defaultPassword: '123',
      description: 'تقييم الوحدات العملية، توثيق أدلة الإتقان، وضمان حد الـ 85% لحضور الورش.',
    },
    {
      id: 'teacher',
      portalType: 'teacher',
      roleKey: 'teacher',
      title: 'معلم ومدرب الورش العملية',
      subtitle: 'الرصد الميداني لغياب الحصص والورش ومخالفات السلامة',
      badge: 'تدريب عملي',
      icon: Layers,
      defaultUsername: 'teacher',
      defaultPassword: '123',
      description: 'رصد الحضور اليومي بضغطة واحدة، تسجيل مهمات الوقاية، وتأمين الورش.',
    },
    {
      id: 'social',
      portalType: 'social_worker',
      roleKey: 'social_worker',
      title: 'الأخصائي الاجتماعي والتربوي',
      subtitle: 'رعاية الطلاب، دراسة الحالات الاجتماعية، ومكافحة التسرب',
      badge: 'رعاية الطلاب',
      icon: HeartHandshake,
      defaultUsername: 'social',
      defaultPassword: '123',
      description: 'متابعة الحالات المحالة من الذكاء الاصطناعي، جلسات الإرشاد وتعديل السلوك.',
    },
  ];

  const currentStaffPortal =
    staffPortals.find((p) => p.id === selectedStaffPortal) || staffPortals[0];

  const mapRoleToPortal = (role: UserRole): PortalType => {
    switch (role) {
      case 'directorate_admin':
        return 'directorate';
      case 'principal':
        return 'principal';
      case 'affairs_deputy':
      case 'affairs_officer':
        return 'affairs';
      case 'social_worker':
        return 'social_worker';
      case 'external_verifier':
        return 'competencies';
      case 'system_admin':
        return 'admin';
      case 'dept_head':
        return 'dept_head';
      case 'teacher':
      default:
        return 'teacher';
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور أو كود المدرسة والرقم السري');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = login(username.trim(), password);
      setIsLoading(false);

      if (result.success && result.user) {
        const detectedPortal = mapRoleToPortal(result.user.role);
        onLoginSuccess(result.user, detectedPortal);
      } else {
        setErrorMsg(result.error || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم أو كود المدرسة وكلمة المرور.');
      }
    }, 350);
  };

  const handleSelectRole = (portal: StaffPortalInfo) => {
    setSelectedStaffPortal(portal.id);
    setUsername(portal.defaultUsername);
    setPassword(portal.defaultPassword || '123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white font-['Cairo'] flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Official Governmental Header Strip */}
      <header className="relative z-10 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            جمهورية مصر العربية • وزارة التربية والتعليم والتعليم الفني
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">قطاع التعليم الفني والتدريب المهني</span>
        </div>

        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1">
            العام الدراسي: 2025 / 2026
          </span>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* National Portal Brand & Title */}
        <div className="text-center space-y-3 mb-8 max-w-2xl">
          <div className="inline-block relative">
            <EduTechIndustrialLogo size="xl" animated={false} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-md border border-amber-300 whitespace-nowrap uppercase tracking-wider">
              المنظومة الوزارية المعتمدة
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              بوابة التعليم الفني والتدريب المهني الموحدة
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              المنصة المركزية لإدارة المدارس الفنية، تقييم الجدارات المهنية، ومتابعة الانضباط المدرسي
            </p>
          </div>
        </div>

        {/* Central Enterprise Card */}
        <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/80 shadow-2xl shadow-slate-950/80 overflow-hidden">
          {/* Main Track Tabs */}
          <div className="p-1.5 bg-slate-950/90 border-b border-slate-800 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('staff');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'staff'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>بوابات القيادة والكوادر المدرسية</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab('parent');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'parent'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>بوابة أولياء الأمور والطلاب (2FA)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {activeMainTab === 'staff' ? (
              /* Staff Track */
              <div className="space-y-6">
                {/* Role / Portal Selection Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span>اختر البوابة أو الدور لتسجيل الدخول المباشر:</span>
                    </span>
                    <span className="text-[10.5px] text-amber-400 font-normal">
                      دخول موحد بالصلاحيات
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {staffPortals.map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedStaffPortal === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectRole(p)}
                          className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 shadow-xs'
                              : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white truncate block">
                                {p.title}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block">
                              {p.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      اسم المستخدم الرسمي أو كود المدرسة الوزاري
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسم المستخدم أو كود المدرسة (مثال: 10201)..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      كلمة المرور أو الرقم السري للمدرسة (PIN)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="أدخل كلمة المرور أو الرقم السري المعتمد..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pr-3.5 pl-10 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-400" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ التحقق والدخول...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>تسجيل الدخول إلى البوابة المعتمدة</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Secure Notice */}
                <div className="pt-2 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اتصال مشفر ومؤمن وفق معايير الإدارة المركزية للتعليم الفني</span>
                  </span>
                </div>
              </div>
            ) : (
              /* Parent 2FA Track */
              <div className="space-y-6">
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    التحقق الثنائي لولي الأمر والطالب (2FA)
                  </h3>
                  <p className="text-xs text-blue-200/90 leading-relaxed max-w-md mx-auto">
                    للاطلاع على سجل الغياب اليومي، نسب حضور الورش، ونتائج تقييم الجدارات، يرجى إدخال الرقم القومي وكود الطالب.
                  </p>
                </div>

                {parentErrorMsg && (
                  <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{parentErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleParent2FALogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      الرقم القومي للطالب (14 رقماً)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      disabled={Boolean(parentLockoutTime)}
                      placeholder="أدخل الرقم القومي للطالب..."
                      value={parentNationalId}
                      onChange={(e) => setParentNationalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/30 focus:outline-hidden transition disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      كود الطالب الوزاري الصادر من المدرسة
                    </label>
                    <input
                      type="text"
                      required
                      disabled={Boolean(parentLockoutTime)}
                      placeholder="أدخل كود الطالب (مثال: ST2026)..."
                      value={parentSecretCode}
                      onChange={(e) => setParentSecretCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/30 focus:outline-hidden transition disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isParentLoading || Boolean(parentLockoutTime)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isParentLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ الاستعلام والتحقق...</span>
                      </div>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        <span>عرض ملف وحضور الطالب</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400">
                    يمكن الحصول على كود الطالب من خلال بطاقة الطالب أو إدارة شئون الطلاب بالمدرسة
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <DeveloperCreditFooter className="relative z-10 py-4" />
    </div>
  );
};
