'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  SchoolConfig,
  WorkshopViolationRecord,
} from '@/types';
import {
  initializeData,
  getCurrentUser,
  setCurrentUser,
  getUsers,
  getStudents,
  getDepartments,
  getClasses,
  getAttendance,
  getNotices,
  getSchoolConfig,
  getWorkshopViolations,
  getIsAuthenticated,
  login,
  logout,
  resetToDefaultData,
  wipeDatabaseForProduction,
  resetToDemoData,
  exportBackupData,
  importBackupData,
} from '@/lib/storage';
import { SchoolSettingsView } from '@/components/SchoolSettingsView';
import { UserManagementView } from '@/components/UserManagementView';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';
import { setupRealtimeSync, pullAllDataFromCloud } from '@/lib/supabaseSync';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  Sliders,
  Key,
  Users,
  Wrench,
  Award,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Check,
  UserCheck,
  LogIn,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [isClient, setIsClient] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUserState] = useState<User>(() => getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<OfficialNotice[]>([]);
  const [violations, setViolations] = useState<WorkshopViolationRecord[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);

  // Admin Login Form State
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'settings' | 'departments' | 'classes' | 'users' | 'maintenance' | 'gateway'
  >('overview');

  const [isBackupSuccess, setIsBackupSuccess] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const refreshAllData = () => {
    const isAuth = getIsAuthenticated();
    const curr = getCurrentUser();
    const hasAdminRole = isAuth && (curr.role === 'principal' || curr.customPermissions?.canManageSchoolSettings);

    setIsAdminAuthenticated(Boolean(hasAdminRole));
    setCurrentUserState(curr);
    setUsers(getUsers());
    setStudents(getStudents());
    setDepartments(getDepartments());
    setClasses(getClasses());
    setAttendance(getAttendance());
    setNotices(getNotices());
    setViolations(getWorkshopViolations());
    setSchoolConfig(getSchoolConfig());
  };

  useEffect(() => {
    setIsClient(true);
    initializeData();
    refreshAllData();

    // 1. Setup Multi-Device Realtime Cloud Sync
    const cleanupRealtime = setupRealtimeSync(() => {
      refreshAllData();
    });

    // 2. Fetch latest data from Cloud on startup in background
    pullAllDataFromCloud(true).then((res) => {
      if (res.success) {
        refreshAllData();
      }
    });

    const handleStorageUpdate = () => {
      refreshAllData();
    };

    window.addEventListener('egyptian_school_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('egyptian_school_storage_update', handleStorageUpdate);
      cleanupRealtime();
    };
  }, []);

  // Handle Admin Login Submit
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    setTimeout(() => {
      const result = login(loginUsername, loginPassword);
      setIsLoggingIn(false);

      if (!result.success || !result.user) {
        setLoginError(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        return;
      }

      // Check if user has admin/principal rights
      if (result.user.role !== 'principal' && !result.user.customPermissions?.canManageSchoolSettings) {
        setLoginError('عذراً، هذا الحساب ليس لديه صلاحيات الإدارة العليا (الأدمن). يرجى الدخول بحساب مدير عام المدرسة (admin).');
        return;
      }

      setIsAdminAuthenticated(true);
      refreshAllData();
    }, 300);
  };

  const handleAdminLogout = () => {
    logout();
    setIsAdminAuthenticated(false);
    setLoginPassword('');
    refreshAllData();
  };

  // Export Full Database Backup (JSON)
  const handleExportBackup = () => {
    const backupPkg = exportBackupData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPkg, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `نسخة_احتياطية_${schoolConfig?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsBackupSuccess(true);
    setTimeout(() => setIsBackupSuccess(false), 4000);
  };

  // Restore Database Backup
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = importBackupData(event.target?.result as string);
        if (result.success) {
          setRestoreMessage('تم استعادة قاعدة البيانات الشاملة بنجاح تام!');
          refreshAllData();
          setTimeout(() => setRestoreMessage(null), 4000);
        } else {
          alert(result.message || 'ملف النسخة الاحتياطية غير صالح أو تالف');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'تحذير إداري:\nهل ترغب في تفريغ المنظومة وإعادة ضبط المصنع للبدء الفعلي؟ سيتم مسح كافة سجلات الطلاب والغياب وقواعد البيانات.'
      )
    ) {
      await wipeDatabaseForProduction();
    }
  };

  const handleResetDemoData = async () => {
    if (
      window.confirm(
        'هل ترغب في إعادة تعيين وشحن البيانات التجريبية (Demo Data) لأغراض الاختبار والتدريب؟'
      )
    ) {
      await resetToDemoData();
    }
  };

  if (!isClient || !schoolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-['Cairo']">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-base font-bold text-amber-400">جارٍ تهيئة بوابة الأدمن...</p>
        </div>
      </div>
    );
  }

  // If Not Authenticated as Admin, render dedicated Admin Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col justify-between font-['Cairo'] text-white">
        {/* Top Banner */}
        <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني • بوابة الإدارة العليا والتحكم المركزي</span>
        </div>

        {/* Main Admin Login Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-md w-full border-2 border-amber-500/40 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-slate-950 p-6 text-center space-y-3 relative">
              <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-xl mx-auto border-2 border-amber-400/40">
                <ShieldCheck className="w-9 h-9" />
              </div>

              <div>
                <span className="bg-slate-950 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  MASTER ADMIN GATEWAY
                </span>
                <h2 className="text-xl font-black text-slate-950 mt-1">
                  لوحة تحكم الأدمن والمدير العام
                </h2>
                <p className="text-xs text-slate-900 font-bold mt-0.5 truncate">
                  {schoolConfig.name}
                </p>
              </div>
            </div>

            {/* Login Form */}
            <div className="p-6 sm:p-7 space-y-5">
              {loginError && (
                <div className="bg-red-950/80 border border-red-500/60 text-red-200 rounded-xl p-3 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    اسم مستخدم الأدمن (Username)
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="admin"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-sm text-white font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    الرقم السري / كلمة المرور (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-sm text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  {isLoggingIn ? 'جارٍ التحقق والدخول...' : 'تسجيل الدخول للوحة التحكم'}
                </button>
              </form>

              {/* Navigation Back */}
              <div className="pt-4 border-t border-slate-800 text-center">
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition font-medium"
                >
                  <span>الرجوع إلى شاشة الدخول المدرسية العامة</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Developer Signature Card */}
            <div className="mt-4">
              <DeveloperCreditFooter />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-900">
          لوحة تحكم الأدمن المركزية المعتمدة لقطاع التعليم الفني
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalStudents = students.length;
  const totalUsers = users.length;
  const totalDepts = departments.length;
  const totalClasses = classes.length;
  const totalViolations = violations.length;
  const pendingNotices = notices.filter((n) => !n.isDelivered).length;
  const expulsionNotices = notices.filter((n) => n.noticeType === 'expulsion_notice').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo'] selection:bg-amber-500 selection:text-slate-950">
      {/* Top Admin Executive Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-amber-500/20 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  MASTER ADMIN
                </span>
                <h1 className="text-base sm:text-lg font-black text-white truncate max-w-xs sm:max-w-md">
                  لوحة التحكم المركزية والإدارة العليا
                </h1>
              </div>
              <p className="text-xs text-amber-400/90 font-bold truncate">
                {schoolConfig.name} ({schoolConfig.schoolSystemType === '3_years' ? 'نظام 3 سنوات' : schoolConfig.schoolSystemType === '5_years_advanced' ? 'نظام 5 سنوات متقدمة' : 'نظامي 3 و 5 سنوات'})
              </p>
            </div>
          </div>

          {/* Quick Actions & Portal Switcher & Logout */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportBackup}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="تصدير نسخة احتياطية من قاعدة البيانات"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">نسخة احتياطية</span>
            </button>

            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>الواجهة المدرسية</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleAdminLogout}
              className="bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-900/60 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="تسجيل الخروج من لوحة الأدمن"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Navigation Hub (Tabs) */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[69px] z-40 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2 custom-scrollbar">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>نظرة عامة والرقابة المركزية</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>بيانات المدرسة والأقسام</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>الحسابات والصلاحيات ({totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('gateway')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'gateway'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>بوابة السجلات والورش المباشرة</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('maintenance')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeAdminTab === 'maintenance'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي والصيانة</span>
          </button>
        </div>
      </div>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Alerts & Notifications */}
        {isBackupSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">
              تم تنزيل النسخة الاحتياطية الشاملة للمدرسة بنجاح! احتفظ بالملف في مكان آمن.
            </span>
          </div>
        )}

        {restoreMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{restoreMessage}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: OVERVIEW & CENTRAL AUDIT
           ========================================================================= */}
        {activeAdminTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Overview KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">إجمالي الطلاب</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1.5">{totalStudents}</div>
                <div className="text-[10px] text-slate-500 font-semibold">بجميع الفرق والتخصصات</div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">الأقسام والورش</span>
                  <Wrench className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1.5">{totalDepts}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{totalClasses} فصلاً وقاعة</div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">حسابات الكادر</span>
                  <Key className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white mt-1.5">{totalUsers}</div>
                <div className="text-[10px] text-slate-500 font-semibold">مدير، وكلاء، رؤساء، معلمين</div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">الإنذارات الصادرة</span>
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-black text-red-400 mt-1.5">{notices.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold">منها {expulsionNotices} قرار فصل</div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">مخالفات الورش</span>
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400 mt-1.5">{totalViolations}</div>
                <div className="text-[10px] text-slate-500 font-semibold">سلامة مهنية وتزويغ</div>
              </div>

              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">نسبة الجدارات</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1.5">
                  {schoolConfig.practicalMinAttendanceRate}%
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">حد إلزامي للورش</div>
              </div>
            </div>

            {/* Departments Architecture Matrix */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    الهيكل الإداري والفني للأقسام والورش الصناعية
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    توزيع الطلاب، الورش التدريبية، ورؤساء الأقسام المسند إليهم الإشراف والتقييم
                  </p>
                </div>
                <button
                  onClick={() => setActiveAdminTab('settings')}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  تعديل الأقسام والفصول ⚙️
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {departments.map((dept) => {
                  const deptClasses = classes.filter((c) => c.departmentId === dept.id);
                  const deptStudents = students.filter((s) => s.departmentId === dept.id);
                  return (
                    <div
                      key={dept.id}
                      className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 hover:border-amber-500/40 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                            <Wrench className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate" title={dept.name}>{dept.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{dept.code}</div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-amber-400 font-black px-1.5 py-0.5 rounded shrink-0">
                          {deptStudents.length} طالب
                        </span>
                      </div>

                      <div className="text-[10.5px] bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 space-y-1">
                        <div className="space-y-0.5 text-[9.5px]">
                          <div className="flex justify-between gap-1 text-slate-300">
                            <span className="text-blue-400 font-semibold">مشرف العلمي:</span>
                            <span className="truncate">{dept.scientificSupervisorName || 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between gap-1 text-slate-300">
                            <span className="text-emerald-400 font-semibold">مشرف العملي:</span>
                            <span className="truncate">{dept.practicalSupervisorName || 'غير محدد'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between gap-1 text-[10px] pt-1 border-t border-slate-800">
                          <span className="text-slate-500">الفصول والورش:</span>
                          <span className="text-amber-300 font-semibold">{dept.workshopCount} ورش / {deptClasses.length} فصول</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Fast-Launch Hub */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 rounded-3xl p-6 border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-base">بوابات الدخول السريع لكافة وحدات المنظومة</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Link
                  href="/"
                  className="bg-slate-900/90 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-400 transition">
                        الإحصاء الصباحي (A4)
                      </div>
                      <div className="text-[10px] text-slate-400">سجل 5 مواظبة اليومي</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition" />
                </Link>

                <Link
                  href="/"
                  className="bg-slate-900/90 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-400 transition">
                        منظومة الجدارات 85%
                      </div>
                      <div className="text-[10px] text-slate-400">استمارات التقييم والتحقق</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition" />
                </Link>

                <Link
                  href="/"
                  className="bg-slate-900/90 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-400 transition">
                        السجلات الوزارية (1 سر)
                      </div>
                      <div className="text-[10px] text-slate-400">مسودة شيت الغياب وسجل 41</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition" />
                </Link>

                <Link
                  href="/"
                  className="bg-slate-900/90 hover:bg-slate-800 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-amber-400 transition">
                        السلامة وتزويغ الورش
                      </div>
                      <div className="text-[10px] text-slate-400">رصد مخالفات مهمات الوقاية</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: SCHOOL SETTINGS & DEPARTMENTS & CLASSES
           ========================================================================= */}
        {activeAdminTab === 'settings' && (
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200">
            <SchoolSettingsView
              schoolConfig={schoolConfig}
              departments={departments}
              classes={classes}
              currentUser={currentUser}
              onSettingsSaved={refreshAllData}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: USERS & PASSWORDS & PERMISSIONS MATRIX
           ========================================================================= */}
        {activeAdminTab === 'users' && (
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200">
            <UserManagementView
              users={users}
              departments={departments}
              classes={classes}
              currentUser={currentUser}
              onUsersChanged={refreshAllData}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 4: SYSTEM GATEWAY & DIRECT REGISTERS
           ========================================================================= */}
        {activeAdminTab === 'gateway' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-2">
              <h3 className="font-black text-lg text-white">بوابة الوصول المباشر للسجلات والشاشات التنفيذية</h3>
              <p className="text-xs text-slate-400">
                من خلال هذه الروابط، يمكنك الوصول فوراً لأي شاشة داخل المنظومة المدرسية مع كامل الصلاحيات الإدارية:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">الإحصاء الصباحي وسجل 5 مواظبة</h4>
                    <p className="text-[11px] text-slate-400">طباعة التقرير الصباحي المعتمد للإدارة التعليمية</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  فتح شاشة الإحصاء الصباحي
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">منظومة الجدارات ونسب 85%</h4>
                    <p className="text-[11px] text-slate-400">متابعة نسب حضور الورش واستمارة التقييم</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  فتح منظومة الجدارات
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">شيت 1 سر وسجل 41 مستجدين</h4>
                    <p className="text-[11px] text-slate-400">السجلات والدفاتر الوزارية الرسمية A4</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  فتح السجلات الوزارية
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">الإنذارات وقرارات الفصل</h4>
                    <p className="text-[11px] text-slate-400">إصدار وطباعة خطابات الإنذار وإعادة القيد</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  فتح سجل الإنذارات
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">تسجيل الحضور بالورش والفصول</h4>
                    <p className="text-[11px] text-slate-400">الرصد اللحظي السريع للحصص والتدريب العملي</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 rounded-xl text-xs transition"
                >
                  فتح شاشة تسجيل الحضور
                </Link>
              </div>

              <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">شئون الطلاب ونقل الفصول</h4>
                    <p className="text-[11px] text-slate-400">الشيت الأسبوعي واستيراد دفعات الطلاب Excel</p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  فتح شئون الطلاب
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: DATABASE MAINTENANCE & BACKUP
           ========================================================================= */}
        {activeAdminTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  إدارة وصيانة قاعدة البيانات والنسخ الاحتياطي
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  أدوات الأمان والنسخ الاحتياطي السحابي/المحلي للحفاظ على سجلات الطلاب والغياب والدرجات
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Export Backup Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">تصدير وحفظ نسخة احتياطية كاملة (JSON)</h4>
                      <p className="text-[11px] text-slate-400">تنزيل ملف يحتوي على كافة بيانات المدرسة والطلاب</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    يُنصح بتصدير نسخة احتياطية دورية أسبوعياً لحفظ سجلات الغياب والإنذارات الرسمية.
                  </p>

                  <button
                    onClick={handleExportBackup}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل النسخة الاحتياطية الآن</span>
                  </button>
                </div>

                {/* Restore Backup Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">استعادة نسخة احتياطية سابقة</h4>
                      <p className="text-[11px] text-slate-400">رفع ملف JSON تم تصديره مسبقاً لاسترجاعه</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    سيتم استرجاع وتحديث كافة الجداول فورياً عند رفع الملف المعتمد.
                  </p>

                  <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload className="w-4 h-4" />
                    <span>اختيار ملف النسخة الاحتياطية (JSON)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Factory Reset Database */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-300">إعادة تهيئة وتفريغ النظام وضبط المصنع</h4>
                  <p className="text-[11px] text-slate-500">
                    تفريغ كامل لقواعد البيانات وسجلات الطلاب لبدء مدرسة جديدة أو إعادة شحن البيانات التجريبية
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetData}
                    className="bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/60 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>تفريغ وتصفير النظام للإنتاج (0 طلاب)</span>
                  </button>

                  <button
                    onClick={handleResetDemoData}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة شحن التجريبي (Demo)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Developer Signature Footer */}
        <div className="mt-8 pb-4">
          <DeveloperCreditFooter />
        </div>
      </main>
    </div>
  );
}
