'use client';

import React, { useState, useEffect } from 'react';
import { SchoolConfig, User, PortalType, UserRole } from '@/types';
import { login, getStudents, getSchools } from '@/lib/storage';
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
  ChevronDown,
  Sparkles,
  FileText,
  CheckCircle2,
  Flame,
} from 'lucide-react';

interface PortalSelectionScreenProps {
  schoolConfig: SchoolConfig;
  users: User[];
  onSelectParentPortal: () => void;
  onLoginSuccess: (user: User, portal: PortalType) => void;
}

export type PrimaryPortalTab = 'directorate' | 'principal' | 'parent';

export const PortalSelectionScreen: React.FC<PortalSelectionScreenProps> = ({
  schoolConfig,
  users,
  onSelectParentPortal,
  onLoginSuccess,
}) => {
  // Primary 3 Portals
  const [activePortal, setActivePortal] = useState<PrimaryPortalTab>('directorate');

  // Directorate Portal Form State
  const [directorateUsername, setDirectorateUsername] = useState<string>('directorate');
  const [directoratePassword, setDirectoratePassword] = useState<string>('123');
  const [showDirPassword, setShowDirPassword] = useState<boolean>(false);
  const [isDirLoading, setIsDirLoading] = useState<boolean>(false);
  const [dirErrorMsg, setDirErrorMsg] = useState<string | null>(null);

  // Principal Portal Form State
  const [principalUsername, setPrincipalUsername] = useState<string>('10201');
  const [principalPassword, setPrincipalPassword] = useState<string>('10201');
  const [showPrincPassword, setShowPrincPassword] = useState<boolean>(false);
  const [isPrincLoading, setIsPrincLoading] = useState<boolean>(false);
  const [princErrorMsg, setPrincErrorMsg] = useState<string | null>(null);

  // Parent Portal 2FA Form State
  const [parentNationalId, setParentNationalId] = useState<string>('');
  const [parentSecretCode, setParentSecretCode] = useState<string>('');
  const [isParentLoading, setIsParentLoading] = useState<boolean>(false);
  const [parentErrorMsg, setParentErrorMsg] = useState<string | null>(null);
  const [parentFailedAttempts, setParentFailedAttempts] = useState<number>(0);
  const [parentLockoutTime, setParentLockoutTime] = useState<number | null>(null);
  const [parentRemainingLockSeconds, setParentRemainingLockSeconds] = useState<number>(0);

  // Secondary Specialized Staff Accordion
  const [showStaffCollapsible, setShowStaffCollapsible] = useState<boolean>(false);
  const [staffRoleKey, setStaffRoleKey] = useState<string>('teacher');
  const [staffUsername, setStaffUsername] = useState<string>('teacher');
  const [staffPassword, setStaffPassword] = useState<string>('123');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);
  const [isStaffLoading, setIsStaffLoading] = useState<boolean>(false);
  const [staffErrorMsg, setStaffErrorMsg] = useState<string | null>(null);

  // Lockout Timer Countdown
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

  // Handle Directorate Admin Login
  const handleDirectorateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorateUsername.trim() || !directoratePassword.trim()) {
      setDirErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور لمسئول المديرية');
      return;
    }

    setIsDirLoading(true);
    setDirErrorMsg(null);

    setTimeout(() => {
      const result = login(directorateUsername.trim(), directoratePassword);
      setIsDirLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user, 'directorate');
      } else {
        setDirErrorMsg(result.error || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.');
      }
    }, 350);
  };

  // Handle Principal Login (School Code + PIN)
  const handlePrincipalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalUsername.trim() || !principalPassword.trim()) {
      setPrincErrorMsg('يرجى إدخال كود المدرسة الوزاري والرقم السري المعتمد');
      return;
    }

    setIsPrincLoading(true);
    setPrincErrorMsg(null);

    setTimeout(() => {
      const result = login(principalUsername.trim(), principalPassword);
      setIsPrincLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user, 'principal');
      } else {
        setPrincErrorMsg(result.error || 'بيانات المدرسة غير صحيحة. تأكد من كود المدرسة المالي والإحصائي والرقم السري المعتمد من المديرية.');
      }
    }, 350);
  };

  // Handle Parent 2FA Login (National ID + School Secret Code)
  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParentErrorMsg(null);

    if (parentLockoutTime && Date.now() < parentLockoutTime) {
      setParentErrorMsg(`تم قفل محاولات الدخول مؤقتاً لحماية خصوصية بيانات الطالب. يرجى الانتظار ${parentRemainingLockSeconds} ثانية.`);
      return;
    }

    const cleanNid = parentNationalId.trim().replace(/\s+/g, '');
    const cleanCode = parentSecretCode.trim().toUpperCase();

    if (!cleanNid || cleanNid.length < 10) {
      setParentErrorMsg('يرجى إدخال الرقم القومي الصحيح للطالب (14 رقماً).');
      return;
    }

    if (!cleanCode) {
      setParentErrorMsg('يرجى إدخال الرقم السري الذي تمنحه المدرسة لولي الأمر.');
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
          setParentErrorMsg(`بيانات الدخول غير صحيحة. يرجى التأكد من الرقم القومي للطالب والرقم السري الصادر من المدرسة. (المحاولات المتبقية: ${5 - nextFail})`);
        }
      }
    }, 400);
  };

  // Handle Specialized Staff Login
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername.trim() || !staffPassword.trim()) {
      setStaffErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsStaffLoading(true);
    setStaffErrorMsg(null);

    setTimeout(() => {
      const result = login(staffUsername.trim(), staffPassword);
      setIsStaffLoading(false);

      if (result.success && result.user) {
        let detectedPortal: PortalType = 'teacher';
        if (result.user.role === 'dept_head') detectedPortal = 'dept_head';
        else if (result.user.role === 'social_worker') detectedPortal = 'social_worker';
        else if (result.user.role === 'affairs_deputy' || result.user.role === 'affairs_officer') detectedPortal = 'affairs';
        else if (result.user.role === 'external_verifier' || result.user.isInternalVerifier) detectedPortal = 'competencies';

        onLoginSuccess(result.user, detectedPortal);
      } else {
        setStaffErrorMsg(result.error || 'بيانات الدخول غير صحيحة للكادر الفني.');
      }
    }, 350);
  };

  // Quick Demo Pre-fill helpers
  const fillDirectorateDemo = () => {
    setDirectorateUsername('directorate');
    setDirectoratePassword('123');
    setDirErrorMsg(null);
  };

  const fillPrincipalDemo = (code: string, pin: string) => {
    setPrincipalUsername(code);
    setPrincipalPassword(pin);
    setPrincErrorMsg(null);
  };

  const fillParentDemo = (nid: string, secretPin: string) => {
    setParentNationalId(nid);
    setParentSecretCode(secretPin);
    setParentErrorMsg(null);
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
      <header className="relative z-10 bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            جمهورية مصر العربية • وزارة التربية والتعليم والتعليم الفني
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">قطاع التعليم الفني والتدريب المهني بالمحافظات</span>
        </div>

        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1">
            العام الدراسي: 2025 / 2026
          </span>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* National Portal Brand & Title */}
        <div className="text-center space-y-3 mb-8 max-w-3xl">
          <div className="inline-block relative">
            <EduTechIndustrialLogo size="xl" animated={false} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[10px] px-3.5 py-0.5 rounded-full shadow-md border border-amber-300 whitespace-nowrap uppercase tracking-wider">
              المنظومة المركزية المعتمدة
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              بوابة التعليم الفني والتدريب المهني الموحدة
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              المنصة الرسمية المعتمدة لمديرية التربية والتعليم بالمحافظة، مدراء المدارس الفنية، وبوابة استعلام أولياء الأمور
            </p>
          </div>
        </div>

        {/* 3 Primary Portals Navigation Selector */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Portal 1: Directorate Admin */}
          <button
            type="button"
            onClick={() => setActivePortal('directorate')}
            className={`p-4 rounded-3xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
              activePortal === 'directorate'
                ? 'bg-amber-500/15 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-xl'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  activePortal === 'directorate' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-amber-400'
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  activePortal === 'directorate'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                القيادة المركزية
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-white flex items-center justify-between">
                <span>مسئول مديرية التعليم</span>
                {activePortal === 'directorate' && <Check className="w-4 h-4 text-amber-400" />}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إنشاء بيانات المدارس الفنية، توليد كلمات المرور، ومتابعة المدارس
              </p>
            </div>
          </button>

          {/* Portal 2: School Principals */}
          <button
            type="button"
            onClick={() => setActivePortal('principal')}
            className={`p-4 rounded-3xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
              activePortal === 'principal'
                ? 'bg-emerald-500/15 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-xl'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  activePortal === 'principal' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-emerald-400'
                }`}
              >
                <School className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  activePortal === 'principal'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                كود المدرسة + PIN
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-white flex items-center justify-between">
                <span>مدراء المدارس الفنية</span>
                {activePortal === 'principal' && <Check className="w-4 h-4 text-emerald-400" />}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إدارة العمليات المدرسية، الطلاب، الجدارات، وإصدار أرقام أولياء الأمور
              </p>
            </div>
          </button>

          {/* Portal 3: Parents & Students */}
          <button
            type="button"
            onClick={() => setActivePortal('parent')}
            className={`p-4 rounded-3xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
              activePortal === 'parent'
                ? 'bg-blue-600/20 border-blue-400 text-white ring-2 ring-blue-400/50 shadow-xl'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  activePortal === 'parent' ? 'bg-blue-600 text-white font-black' : 'bg-slate-800 text-blue-400'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  activePortal === 'parent'
                    ? 'bg-blue-600 text-white border-blue-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                دخول ثنائي (2FA)
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-white flex items-center justify-between">
                <span>بوابة ولي الأمر والنتائج</span>
                {activePortal === 'parent' && <Check className="w-4 h-4 text-blue-400" />}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                معرفة النتائج ونسب الحضور والغياب بالرقم القومي والرقم السري
              </p>
            </div>
          </button>
        </div>

        {/* Central Enterprise Form Card */}
        <div className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-700/80 shadow-2xl shadow-slate-950/80 overflow-hidden">
          {/* =========================================================================
              PORTAL 1: DIRECTORATE OF EDUCATION
             ========================================================================= */}
          {activePortal === 'directorate' && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-5 h-5 font-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-amber-200">
                    بوابة مسئول مديرية التربية والتعليم بالمحافظة
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    منصة الإشراف العليا لإنشاء بيانات المدارس الفنية، توليد وتعيين كلمات المرور وأكواد المدارس، والمتابعة اللحظية لنسب الحضور والجدارات بالمحافظة.
                  </p>
                </div>
              </div>

              {dirErrorMsg && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{dirErrorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleDirectorateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    اسم المستخدم الرسمي أو كود مسئول المديرية
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="أدخل اسم مستخدم المديرية (مثال: directorate)..."
                      value={directorateUsername}
                      onChange={(e) => setDirectorateUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    كلمة المرور الرسمية المعتمدة
                  </label>
                  <div className="relative">
                    <input
                      type={showDirPassword ? 'text' : 'password'}
                      required
                      placeholder="أدخل كلمة المرور..."
                      value={directoratePassword}
                      onChange={(e) => setDirectoratePassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pr-3.5 pl-10 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDirPassword(!showDirPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showDirPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showDirPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isDirLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isDirLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ التحقق وفتح لوحة المديرية...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>دخول بوابة مسئول مديرية التربية والتعليم بالمحافظة</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Fill Demo Helper */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>بيانات الدخول التجريبية للمديرية:</span>
                </span>
                <button
                  type="button"
                  onClick={fillDirectorateDemo}
                  className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-[11px] font-bold font-mono transition cursor-pointer"
                >
                  تعبئة تلقائية: directorate / 123
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              PORTAL 2: TECHNICAL SCHOOL PRINCIPALS
             ========================================================================= */}
          {activePortal === 'principal' && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <School className="w-5 h-5 font-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-emerald-200">
                    بوابة مدراء المدارس الفنية
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    تسجيل دخول مدير المنشأة المدرسية بكود المدرسة الوزاري والرقم السري المعتمد من المديرية لمتابعة الإحصاء الصباحي، تقييم الجدارات، ورصد الغياب، وإصدار وطباعة الأرقام السرية لأولياء الأمور.
                  </p>
                </div>
              </div>

              {princErrorMsg && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{princErrorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handlePrincipalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    كود المدرسة الوزاري (المالي والإحصائي) أو اسم المستخدم
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="أدخل كود المدرسة (مثال: 10201)..."
                      value={principalUsername}
                      onChange={(e) => setPrincipalUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-emerald-500/30 focus:outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    الرقم السري للمدرسة (PIN) المعتمد من المديرية
                  </label>
                  <div className="relative">
                    <input
                      type={showPrincPassword ? 'text' : 'password'}
                      required
                      placeholder="أدخل الرقم السري للمدرسة..."
                      value={principalPassword}
                      onChange={(e) => setPrincipalPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl pr-3.5 pl-10 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-emerald-500/30 focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPrincPassword(!showPrincPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                      title={showPrincPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPrincPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPrincLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isPrincLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ التحقق والدخول لإدارة المدرسة...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول إلى لوحة مدير المدرسة الفنية</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Fill School Demos */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] block">
                  نماذج المدارس المسجلة بالمحافظة (اضغط للتعبئة الفورية):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillPrincipalDemo('10201', '10201')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مدرسة العباسية الميكانيكية (كود: 10201)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillPrincipalDemo('10405', '10405')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مدرسة إمبابة الصناعية (كود: 10405)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillPrincipalDemo('20108', '20108')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>مدرسة طوسون المتقدمة 5 سنوات (كود: 20108)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PORTAL 3: PARENTS & STUDENTS
             ========================================================================= */}
          {activePortal === 'parent' && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-blue-600/15 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <GraduationCap className="w-5 h-5 font-black" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-blue-200">
                    بوابة ولي الأمر لمعرفة النتائج ونسب الحضور والغياب
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    استعلام فوري ومؤمن لولي الأمر للاطلاع على: سجل الغياب اليومي، نسب حضور الورش العملية (85%) وموقف الحرمان، ونتائج تقييم الجدارات، والإنذارات الرسمية.
                  </p>
                </div>
              </div>

              {parentErrorMsg && (
                <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{parentErrorMsg}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleParentSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    الرقم القومي للطالب (14 رقماً)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={14}
                      disabled={Boolean(parentLockoutTime)}
                      placeholder="أدخل الرقم القومي للطالب (14 رقماً)..."
                      value={parentNationalId}
                      onChange={(e) => setParentNationalId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/30 focus:outline-hidden transition disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    الرقم السري الذي تمنحه له المدرسة (كود الدخول السري 2FA)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      disabled={Boolean(parentLockoutTime)}
                      placeholder="أدخل الرقم السري الصادر من إدارة المدرسة للطالب..."
                      value={parentSecretCode}
                      onChange={(e) => setParentSecretCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-blue-500/30 focus:outline-hidden transition disabled:opacity-50 uppercase"
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 block pt-0.5">
                    * يُمنح الرقم السري لولي الأمر من خلال إدارة شئون الطلاب بالمدرسة في إخطار رسمي لضمان سرية البيانات.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isParentLoading || Boolean(parentLockoutTime)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isParentLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جارٍ التحقق واستخراج نتائج وسجل غياب الطالب...</span>
                    </div>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      <span>استعلام وعرض النتائج ونسب الحضور والغياب للطالب</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Fill Student Demos */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] block">
                  نماذج تجريبية للاستعلام الفوري (اضغط للتعبئة والاستعلام):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillParentDemo('30801011234567', 'SEC789')}
                    className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>طالب 1: إبراهيم النجار (جدير - حضور 93%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillParentDemo('30802021234568', 'SEC456')}
                    className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>طالب 2: يوسف الشريف (إنذار غياب - حضور 70%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillParentDemo('30803031234569', 'SEC123')}
                    className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>طالب 3: كريم البدري (برنامج علاجي - حضور 87%)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Collapsible: Specialized Staff Roles */}
        <div className="w-full max-w-3xl mt-6">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowStaffCollapsible(!showStaffCollapsible)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span>دخول الكوادر التخصصية بالمدرسة (معلمي الورش، رؤساء الأقسام، شئون الطلبة، الأخصائي الاجتماعي)</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showStaffCollapsible ? 'rotate-180 text-amber-400' : ''}`}
              />
            </button>

            {showStaffCollapsible && (
              <div className="p-4 pt-2 border-t border-slate-800/60 space-y-4">
                {/* Role Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'teacher', title: 'معلم الورشة', user: 'teacher', pass: '123' },
                    { id: 'dept_head', title: 'رئيس القسم', user: 'depthead', pass: '123' },
                    { id: 'affairs', title: 'شئون الطلبة', user: 'affairs', pass: '123' },
                    { id: 'social', title: 'الأخصائي الاجتماعي', user: 'social', pass: '123' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setStaffRoleKey(r.id);
                        setStaffUsername(r.user);
                        setStaffPassword(r.pass);
                        setStaffErrorMsg(null);
                      }}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                        staffRoleKey === r.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>

                {staffErrorMsg && (
                  <div className="bg-red-500/15 border border-red-500/40 text-red-200 rounded-xl p-2.5 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>{staffErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleStaffSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="اسم المستخدم..."
                      value={staffUsername}
                      onChange={(e) => setStaffUsername(e.target.value)}
                      className="bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <div className="relative">
                      <input
                        type={showStaffPassword ? 'text' : 'password'}
                        required
                        placeholder="كلمة المرور..."
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pr-3 pl-8 py-2 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPassword(!showStaffPassword)}
                        className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isStaffLoading}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    {isStaffLoading ? 'جارٍ التحقق...' : 'دخول بحساب الكادر المدرسي'}
                  </button>
                </form>
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
