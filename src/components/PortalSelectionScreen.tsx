'use client';

import React, { useState } from 'react';
import { SchoolConfig, User, PortalType, UserRole } from '@/types';
import { login } from '@/lib/storage';
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
  KeyRound,
  Cpu,
  Zap,
  BadgeCheck,
  HeartHandshake,
} from 'lucide-react';

interface PortalSelectionScreenProps {
  schoolConfig: SchoolConfig;
  users: User[];
  onSelectParentPortal: () => void;
  onLoginSuccess: (user: User, portal: PortalType) => void;
}

type MainTab = 'staff' | 'parent';

interface StaffPortalInfo {
  id: PortalType;
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

  // Staff selected portal filter / pill
  const [selectedStaffPortal, setSelectedStaffPortal] = useState<PortalType>('principal');

  // Staff Credentials
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Staff Portals Definitions for Pills & Quick Fill
  const staffPortals: StaffPortalInfo[] = [
    {
      id: 'principal',
      roleKey: 'principal',
      title: 'مدير عام المدرسة',
      subtitle: 'الإدارة العليا والرقابة المركزية',
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
      roleKey: 'affairs_deputy',
      title: 'شئون الطلاب والإحصاء',
      subtitle: 'السجلات والإحصاء والإنذارات',
      badge: 'شئون طلاب',
      icon: Users,
      defaultUsername: 'affairs',
      color: {
        pillActive: 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 border-emerald-300 ring-2 ring-emerald-400/50',
        borderActive: 'border-emerald-500/50',
        bgGlow: 'from-emerald-500/20 via-slate-900 to-slate-950',
        accent: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      },
      description: 'سجلات الطلاب، الإحصاء الصباحي (5 مواظبة)، الشيتات الوزارية (1 سر / 41)، وإصدار الإنذارات.',
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

                  {/* Horizontal Segmented Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {staffPortals.map((p) => {
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
                        className="text-[10.5px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 transition cursor-pointer font-bold flex items-center gap-1"
                        title={`تعبئة بيانات حساب ${p.title}`}
                      >
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ================== PARENT & STUDENT INQUIRY TRACK ================== */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 text-center space-y-3 shadow-inner">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 border border-indigo-300/40">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-black text-white">
                    الاستعلام الإلكتروني المباشر للطالب وولي الأمر
                  </h3>
                  <p className="text-xs text-indigo-200/90 leading-relaxed max-w-md mx-auto font-medium">
                    استعلام فوري بدون كلمة مرور باستخدام الرقم القومي (14 رقماً) أو كود الطالب لمتابعة الحضور، ونسب الورش (85%)، وتقييم الجدارات.
                  </p>
                </div>

                {/* Feature Highlights Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>مؤشر استيفاء حضور الورش 85%</span>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>مصفوفة الجدارات والبرامج العلاجية</span>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>الإنذارات الرسمية وتتبع الغياب</span>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center gap-2 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>طباعة بطاقة المتابعة الرسمية A4</span>
                  </div>
                </div>

                {/* Direct Entry Button */}
                <button
                  type="button"
                  onClick={onSelectParentPortal}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-purple-600/25 transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer transform hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Search className="w-4 h-4" />
                  <span>دخول بوابة استعلام ولي الأمر والطالب الفورية</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
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
