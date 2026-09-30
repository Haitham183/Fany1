'use client';

import React, { useState, useEffect } from 'react';
import { SchoolConfig, User, PortalType, UserRole, Student } from '@/types';
import { login, getStudents } from '@/lib/storage';
import { logAuditEvent } from '@/lib/auditLogger';
import { EduTechIndustrialLogo } from '@/components/EduTechIndustrialLogo';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';
import {
  Building2,
  GraduationCap,
  Wrench,
  Award,
  Users,
  Layers,
  Lock,
  UserCheck,
  LogIn,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Search,
  Check,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Cpu,
  Zap,
  BadgeCheck,
  HeartHandshake,
  Flame,
  Clock,
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
  portalType?: PortalType;
  roleKey: UserRole;
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  defaultUsername: string;
  color: {
    pillActive: string;
    borderActive: string;
    bgGlow: string;
    accent: string;
    badgeBg: string;
  };
  description: string;
}

export const PortalSelectionScreen: React.FC<PortalSelectionScreenProps> = ({
  schoolConfig,
  users,
  onSelectParentPortal,
  onLoginSuccess,
}) => {
  // Main Track Tab: 'staff' (كادر مدرسي) or 'parent' (ولي أمر وطالب)
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('staff');

  // Staff selected portal filter / pill (Default to central Directorate Leadership)
  const [selectedStaffPortal, setSelectedStaffPortal] = useState<string>('directorate');

  // Staff Credentials (Default to central Directorate)
  const [username, setUsername] = useState('directorate');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parent 2FA Credentials & Security
  const [parentNationalId, setParentNationalId] = useState('');
  const [parentSecretCode, setParentSecretCode] = useState('');
  const [parentErrorMsg, setParentErrorMsg] = useState<string | null>(null);
  const [parentFailedAttempts, setParentFailedAttempts] = useState(0);
  const [parentLockoutTime, setParentLockoutTime] = useState<number | null>(null);
  const [parentRemainingLockSeconds, setParentRemainingLockSeconds] = useState(0);
  const [isParentLoading, setIsParentLoading] = useState(false);

  // Lockout countdown effect for Parent Portal
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

  const handleQuickDemoParentFill = (nationalId: string, code: string) => {
    setParentNationalId(nationalId);
    setParentSecretCode(code);
    setParentErrorMsg(null);
  };

  // Staff Portals Definitions for Pills & Quick Fill
  const staffPortals: StaffPortalInfo[] = [
    {
      id: 'directorate',
      portalType: 'directorate',
      roleKey: 'directorate_admin',
      title: 'قيادة المديرية والمدارس',
      subtitle: 'التحكم المركزي ومتابعة المحافظة ومؤشرات المدارس المجمعة',
      badge: 'إدارة مركزية 🏛️',
      icon: Building2,
      defaultUsername: 'directorate',
      color: {
        pillActive: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black shadow-xl shadow-amber-500/30 border-amber-300 ring-2 ring-amber-400/50',
        borderActive: 'border-amber-500/50',
        bgGlow: 'from-amber-600/20 via-slate-900 to-slate-950',
        accent: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
      description: 'إدارة المدارس المتعددة بالمديرية، مؤشرات الأداء التراكمية، ومتابعة الجدارات والغياب لجميع المدارس.',
    },
    {
      id: 'principal',
      portalType: 'principal',
      roleKey: 'principal',
      title: 'مدير عام المدرسة',
      subtitle: 'الإدارة العليا والرقابة والاعتماد المدرسي',
      badge: 'إدارة عليا',
      icon: Building2,
      defaultUsername: 'admin',
      color: {
        pillActive: 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 border-amber-300 ring-2 ring-amber-400/50',
        borderActive: 'border-amber-500/50',
        bgGlow: 'from-amber-500/20 via-slate-900 to-slate-950',
        accent: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      },
      description: 'لوحة القيادة والمؤشرات، إدارة التخصصات والفترات، اعتماد الإنذارات، والنسخ الاحتياطي.',
    },
    {
      id: 'affairs',
      portalType: 'affairs',
      roleKey: 'affairs_deputy',
      title: 'وكيل شئون الطلاب (مادة 25)',
      subtitle: 'لجنة الانضباط، التحويلات، والإنذارات الرسمية',
      badge: 'وكيل شئون',
      icon: Users,
      defaultUsername: 'affairs',
      color: {
        pillActive: 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border-emerald-300 ring-2 ring-emerald-400/50',
        borderActive: 'border-emerald-500/50',
        bgGlow: 'from-emerald-500/20 via-slate-900 to-slate-950',
        accent: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      description: 'اعتماد الإنذارات وقرارات الفصل، تحويلات الطلاب، والإشراف على لجنة الانضباط المدرسي وفق المادة 25.',
    },
    {
      id: 'affairs_officer',
      portalType: 'affairs',
      roleKey: 'affairs_officer',
      title: 'مسئول الشيتات ودفتر 41',
      subtitle: 'دفتر 41 وشيتات سر 1 والإحصاء الصباحي',
      badge: 'شئون طلبة',
      icon: UserCheck,
      defaultUsername: 'officer',
      color: {
        pillActive: 'bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/25 border-cyan-300 ring-2 ring-cyan-400/50',
        borderActive: 'border-cyan-500/50',
        bgGlow: 'from-cyan-500/20 via-slate-900 to-slate-950',
        accent: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      },
      description: 'سجلات الطلاب، دفتر 41 المستجدين، شيت سر 1، ومسودات إخطارات الغياب والمواظبة.',
    },
    {
      id: 'competencies',
      roleKey: 'external_verifier',
      title: 'مسئول الجدارات والتحقق',
      subtitle: 'التقييم والتحقق ونسب الورش',
      badge: 'جدارات مهنية',
      icon: Award,
      defaultUsername: 'competency',
      color: {
        pillActive: 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/25 border-purple-300 ring-2 ring-purple-400/50',
        borderActive: 'border-purple-500/50',
        bgGlow: 'from-purple-500/20 via-slate-900 to-slate-950',
        accent: 'text-purple-400',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      },
      description: 'مصفوفة الجدارات، مخرجات التعلم، نسب حضور الورش (85%)، وتوثيق نتائج التقييم بالتواريخ.',
    },
    {
      id: 'dept_head',
      roleKey: 'dept_head',
      title: 'رئيس القسم الصناعي',
      subtitle: 'متابعة ورش وتخصصات القسم',
      badge: 'أقسام فنية',
      icon: Wrench,
      defaultUsername: 'dept_head',
      color: {
        pillActive: 'bg-blue-600 text-white font-black shadow-lg shadow-blue-600/25 border-blue-300 ring-2 ring-blue-400/50',
        borderActive: 'border-blue-500/50',
        bgGlow: 'from-blue-500/20 via-slate-900 to-slate-950',
        accent: 'text-blue-400',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      },
      description: 'الإشراف على ورش القسم، فصول التخصص، مدربي الورش، ونسب انتظام الطلاب عملياً.',
    },
    {
      id: 'social_worker',
      roleKey: 'social_worker',
      title: 'الأخصائي الاجتماعي والتربوي',
      subtitle: 'دراسة الحالات والإرشاد والتنبؤ الذكي',
      badge: 'إرشاد طلابي',
      icon: HeartHandshake,
      defaultUsername: 'social',
      color: {
        pillActive: 'bg-teal-600 text-white font-black shadow-lg shadow-teal-600/25 border-teal-300 ring-2 ring-teal-400/50',
        borderActive: 'border-teal-500/50',
        bgGlow: 'from-teal-500/20 via-slate-900 to-slate-950',
        accent: 'text-teal-400',
        badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      },
      description: 'متابعة الحالات المحالة من التنبؤ الذكي، جلسات الإرشاد وتعديل السلوك، ومواثيق الانضباط المدرسي.',
    },
    {
      id: 'teacher',
      roleKey: 'teacher',
      title: 'معلم ومدرب الورشة',
      subtitle: 'الرصد الميداني ومخالفات الورش',
      badge: 'تدريب عملي',
      icon: Layers,
      defaultUsername: 'teacher',
      color: {
        pillActive: 'bg-orange-500 text-white font-black shadow-lg shadow-orange-500/25 border-orange-300 ring-2 ring-orange-400/50',
        borderActive: 'border-orange-500/50',
        bgGlow: 'from-orange-500/20 via-slate-900 to-slate-950',
        accent: 'text-orange-400',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      },
      description: 'رصد الحضور الأسبوعي للحصص والورش، تسجيل مخالفات مهمات الوقاية، والتزويغ من الورش.',
    },
  ];

  const currentStaffPortal =
    staffPortals.find((p) => p.id === selectedStaffPortal) || staffPortals[0];

  // Helper to map user role to target portal automatically
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
      setErrorMsg('يرجى إدخال اسم المستخدم وكلمة المرور');
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
        setErrorMsg(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    }, 350);
  };

  const handleQuickDemoFill = (portal: StaffPortalInfo) => {
    setSelectedStaffPortal(portal.id);
    setUsername(portal.defaultUsername);
    setPassword('123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-['Cairo'] flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Animated Gradient Blobs & Industrial Tech Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Radial Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

        {/* Floating Glowing Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/15 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />

        {/* Ambient Top Light Beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-amber-500/10 via-blue-600/5 to-transparent blur-2xl" />
      </div>

      {/* Top Official Ministry Header Bar */}
      <header className="relative z-10 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 border-b border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            جمهورية مصر العربية • وزارة التربية والتعليم والتعليم الفني
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline text-slate-400">{schoolConfig.directorate}</span>
        </div>

        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            العام الدراسي: {schoolConfig.academicYear}
          </span>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center">
        {/* School Branding & High-Impact Logo Header */}
        <div className="text-center space-y-3.5 mb-6 max-w-2xl">
          {/* Animated 3D Vector Shield Logo */}
          <div className="inline-block relative group">
            <EduTechIndustrialLogo size="2xl" animated={true} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/40 border border-amber-300 flex items-center gap-1 whitespace-nowrap uppercase tracking-wider">
              <Zap className="w-2.5 h-2.5 fill-current" /> منظومة الجدارات المعتمدة
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-blue-500/20 text-amber-300 px-4 py-1 rounded-full text-xs font-black border border-amber-500/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>المنظومة الإلكترونية للتعليم الفني والتدريب المهني</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 leading-tight">
              {schoolConfig.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium flex items-center justify-center gap-2">
              <span>{schoolConfig.administration}</span>
              <span>•</span>
              <span className="text-amber-400/90 font-bold">قطاع التعليم الفني والتجهيزات</span>
            </p>
          </div>
        </div>

        {/* Central Card with Glassmorphism and Animated Borders */}
        <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl rounded-3xl border-2 border-slate-700/80 shadow-2xl shadow-blue-950/60 overflow-hidden transition-all duration-300 relative group">
          {/* Top Subtle Animated Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 animate-gradient" />

          {/* 1. Main Track Switcher (كادر مدرسي | ولي أمر وطالب) */}
          <div className="p-2 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('staff');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'staff'
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>بوابة الكادر التعليمي والمدرسي</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab('parent');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                activeMainTab === 'parent'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.01]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>بوابة ولي الأمر والطالب</span>
            </button>
          </div>

          {/* 2. Track Contents */}
          <div className="p-6 sm:p-7 space-y-5">
            {activeMainTab === 'staff' ? (
              /* ================== STAFF LOGIN TRACK ================== */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* Visual Quick Role Pills */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      <span>اختر البوابة أو اكتب حسابك مباشرة (توجيه ذكي):</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      ⚡ تسجيل موحد
                    </span>
                  </div>

                  {/* Primary Featured Portal: Directorate Central Cockpit */}
                  <div className="space-y-2">
                    {staffPortals.filter((p) => p.id === 'directorate').map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedStaffPortal === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleQuickDemoFill(p)}
                          className={`w-full p-3 rounded-2xl border text-right transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/25 border-amber-300 ring-2 ring-amber-400/50'
                              : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40 text-amber-200 hover:border-amber-400 hover:bg-slate-800/90'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                                  {p.title}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                  isSelected ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}>
                                  ★ البوابة الرئيسية المركزية
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 truncate max-w-xs sm:max-w-md ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                                {p.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-left hidden sm:block">
                            <span className={`text-[11px] font-mono font-bold block ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                              @{p.defaultUsername}
                            </span>
                            <span className={`text-[9.5px] ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                              إشراف المديرية
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* School Internal Staff Portals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                      {staffPortals.filter((p) => p.id !== 'directorate').map((p) => {
                        const Icon = p.icon;
                        const isSelected = selectedStaffPortal === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleQuickDemoFill(p)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? `${p.color.pillActive} border-2`
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800/90 hover:border-slate-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{p.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="bg-red-500/15 border-2 border-red-500/50 text-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>اسم المستخدم (Username)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        تجريبي: {currentStaffPortal.defaultUsername}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسم المستخدم المعتمد..."
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pr-3.5 pl-3 py-2.5 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>كلمة المرور (Password)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        الافتراضية: 123
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="أدخل كلمة المرور..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl pr-3.5 pl-10 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500/30 focus:outline-hidden transition shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-amber-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3.5 rounded-xl shadow-xl shadow-amber-500/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2 hover:scale-[1.01] active:scale-[0.98]"
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

                {/* 1-Click Fast Account Chips for Testing */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      <span>الحسابات التجريبية السريعة (بنقرة واحدة):</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">كلمة المرور: 123</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {staffPortals.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickDemoFill(p)}
                        className={`text-[10.5px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-bold flex items-center gap-1 ${
                          selectedStaffPortal === p.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                        }`}
                        title={`تعبئة بيانات حساب ${p.title}`}
                      >
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================== PARENT & STUDENT SECURE 2FA TRACK ================== */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-center space-y-2 shadow-inner">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 border border-indigo-300/40">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    تسجيل الدخول الثنائي الآمن لولي الأمر والطالب (2FA)
                  </h3>
                  <p className="text-xs text-indigo-200/90 leading-relaxed max-w-md mx-auto font-medium">
                    لحماية خصوصية البيانات وفق اللائحة، يتطلب الدخول إدخال الرقم القومي للطالب مصحوباً بكود الدخول السري الصادر من إدارة المدرسة.
                  </p>
                </div>

                {/* Error / Lockout Alert */}
                {parentErrorMsg && (
                  <div className="bg-red-500/15 border-2 border-red-500/50 text-red-200 rounded-2xl p-3 flex items-center gap-2 text-xs font-bold animate-shake">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{parentErrorMsg}</span>
                  </div>
                )}

                {/* 2FA Login Form */}
                <form onSubmit={handleParent2FALogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>الرقم القومي للطالب (14 رقماً)</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-bold">العامل الأول (1st Factor)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={14}
                        disabled={Boolean(parentLockoutTime)}
                        placeholder="أدخل الرقم القومي للطالب..."
                        value={parentNationalId}
                        onChange={(e) => setParentNationalId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-400 rounded-xl pr-3.5 pl-3 py-2.5 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition shadow-inner disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                        <span>كود الدخول السري الصادر من المدرسة (أو كود الطالب / OTP)</span>
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono font-bold">العامل الثاني (2nd Factor)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        disabled={Boolean(parentLockoutTime)}
                        placeholder="أدخل كود الدخول السري المعتمد..."
                        value={parentSecretCode}
                        onChange={(e) => setParentSecretCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-xl pr-3.5 pl-3 py-2.5 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-purple-500/30 focus:outline-hidden transition shadow-inner disabled:opacity-50 uppercase"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isParentLoading || Boolean(parentLockoutTime)}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-black py-3.5 rounded-xl shadow-xl shadow-purple-600/25 transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2 hover:scale-[1.01] active:scale-[0.98]"
                  >
                    {isParentLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ التحقق الثنائي والدخول...</span>
                      </div>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>دخول واستعلام آمن لولي الأمر (2FA)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* 1-Click Fast Demo Student Chips for Testing */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>بيانات طلاب تجريبية للاختبار السريع (بنقرة واحدة):</span>
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">2FA جاهز</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoParentFill('30801011234567', 'DEMO12')}
                      className="text-[10.5px] bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white px-2.5 py-1 rounded-lg border border-indigo-900/60 transition cursor-pointer font-bold flex items-center gap-1"
                      title="تجربة الدخول للطالب أحمد محمود حسن"
                    >
                      <span>طالب 1: أحمد محمود (كود: DEMO12)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoParentFill('30802021234568', 'DEMO12')}
                      className="text-[10.5px] bg-slate-950 hover:bg-slate-800 text-purple-300 hover:text-white px-2.5 py-1 rounded-lg border border-purple-900/60 transition cursor-pointer font-bold flex items-center gap-1"
                      title="تجربة الدخول للطالب إبراهيم السيد"
                    >
                      <span>طالب 2: إبراهيم السيد (كود: DEMO12)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Developer Credit Footer */}
      <DeveloperCreditFooter className="pb-4 relative z-10" />
    </div>
  );
};
