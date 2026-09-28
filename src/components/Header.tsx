'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { User, SchoolConfig, EarlyWarningAlert, PortalType, Student, SchoolClass, Department } from '@/types';
import { getSmartEarlyWarnings } from '@/lib/storage';
import { getCurrentSyncStatus, SyncStatusDetail } from '@/lib/supabaseSync';
import { EduTechIndustrialLogo } from '@/components/EduTechIndustrialLogo';
import {
  ShieldAlert,
  UserCheck,
  Building2,
  Calendar,
  RotateCcw,
  Sparkles,
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Sliders,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Flame,
  Award,
  ArrowUpRight,
  GraduationCap,
  X,
  ExternalLink,
  LogOut,
  LayoutGrid,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Search,
  FileText,
  Clock,
  User as UserIcon,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  onResetData?: () => void;
  noticesCount: number;
  schoolConfig: SchoolConfig;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenParentPortal?: () => void;
  activePortal?: PortalType;
  onSwitchPortal?: () => void;
  students?: Student[];
  classes?: SchoolClass[];
  departments?: Department[];
  onSelectStudentReport?: (studentId: string) => void;
  onSelectStudentAttendance?: (classId: string) => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenRoleSwitcher,
  onResetData,
  noticesCount,
  schoolConfig,
  onToggleMobileSidebar,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onNavigateToTab,
  onOpenParentPortal,
  activePortal,
  onSwitchPortal,
  students = [],
  classes = [],
  departments = [],
  onSelectStudentReport,
  onSelectStudentAttendance,
  onOpenCommandPalette,
}) => {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusDetail>(() => getCurrentSyncStatus());
  const alertsDropdownRef = useRef<HTMLDivElement>(null);

  // Quick Search Command Bar State
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const todayDateFormatted = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const updateAlerts = () => {
      setAlerts(getSmartEarlyWarnings());
    };
    updateAlerts();

    const handleSyncStatus = (e: any) => {
      if (e.detail) {
        setSyncStatus(e.detail);
      }
    };

    window.addEventListener('egyptian_school_storage_update', updateAlerts);
    window.addEventListener('egyptian_school_sync_status', handleSyncStatus as EventListener);
    return () => {
      window.removeEventListener('egyptian_school_storage_update', updateAlerts);
      window.removeEventListener('egyptian_school_sync_status', handleSyncStatus as EventListener);
    };
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenCommandPalette) {
          onOpenCommandPalette();
        } else {
          setIsQuickSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
      if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered Students for Quick Search
  const searchResults = useMemo(() => {
    if (!students || !quickSearchQuery.trim()) return [];
    const q = quickSearchQuery.trim().toLowerCase();
    return students
      .filter((s) => {
        const clsName = classes.find((c) => c.id === s.classId)?.name?.toLowerCase() || '';
        const deptName = departments.find((d) => d.id === s.departmentId)?.name?.toLowerCase() || '';
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          (s.nationalId && s.nationalId.includes(q)) ||
          clsName.includes(q) ||
          deptName.includes(q)
        );
      })
      .slice(0, 6);
  }, [students, classes, departments, quickSearchQuery]);

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningAlertsCount = alerts.filter((a) => a.severity === 'warning').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'principal':
        return { label: 'مدير المدرسة', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'affairs_deputy':
        return { label: 'وكيل شئون الطلاب', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'affairs_officer':
        return { label: 'مسئول شئون الطلاب', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'dept_head':
        return { label: 'رئيس قسم صناعي', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'teacher':
        return { label: 'معلم / مدرب ورشة', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'مستخدم', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800 no-print">
      {/* Top Ministry Banner */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800 text-xs text-slate-400 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">{schoolConfig.administration || 'التعليم الفني الصناعي'}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time Cloud Sync Live Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border transition ${
              syncStatus.status === 'syncing'
                ? 'bg-blue-950/70 border-blue-500/50 text-blue-300'
                : syncStatus.status === 'synced'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : syncStatus.status === 'offline'
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                : syncStatus.status === 'error'
                ? 'bg-red-950/70 border-red-500/50 text-red-300'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
            title={syncStatus.message}
          >
            {syncStatus.status === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
            ) : syncStatus.status === 'synced' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : syncStatus.status === 'offline' ? (
              <CloudOff className="w-3 h-3 text-amber-400" />
            ) : syncStatus.status === 'error' ? (
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
            ) : (
              <Cloud className="w-3 h-3 text-emerald-400" />
            )}
            <span>
              {syncStatus.status === 'syncing'
                ? 'جارٍ الحفظ بالسحابة...'
                : syncStatus.status === 'synced'
                ? 'مزامنة سحابية تلقائية 🟢'
                : syncStatus.status === 'offline'
                ? 'وضع غير متصل (أوفلاين) 📴'
                : syncStatus.status === 'error'
                ? 'خطأ بالمزامنة'
                : 'متصل بالسحابة 🟢'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{todayDateFormatted}</span>
          </div>
          <span className="bg-emerald-950 text-emerald-400 text-[11px] px-2 py-0.5 rounded border border-emerald-800 font-medium">
            العام الدراسي {schoolConfig.academicYear}
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Right Side: School Logo & Title & Directorate */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 lg:hidden cursor-pointer shrink-0"
            title="القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Collapse / Expand Button (Icon Only - Sleek) */}
          <button
            onClick={onToggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700/80 transition cursor-pointer shrink-0"
            title={isSidebarCollapsed ? 'فتح القائمة الجانبية' : 'طي القائمة الجانبية'}
          >
            {isSidebarCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <PanelRightClose className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* School Emblem / Logo */}
          <EduTechIndustrialLogo size="sm" animated={false} className="shrink-0" />

          {/* School Details */}
          <div className="min-w-0 hidden md:block">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-white leading-normal truncate">
                {schoolConfig.name}
              </h1>
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" /> نظام الجدارات المطور
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {schoolConfig.directorate} {schoolConfig.administration ? `• ${schoolConfig.administration}` : ''} • المنظومة الإلكترونية للغياب والورش
            </p>
          </div>
        </div>

        {/* Center: Fast Student Search Command Bar */}
        <div className="flex-1 max-w-md mx-2 relative" ref={searchContainerRef}>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-amber-400" />
            </div>
            {onOpenCommandPalette ? (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="w-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-400 hover:text-white flex items-center justify-between transition cursor-pointer group"
              >
                <span className="truncate">بحث سريع عن طالب، أمر، أو قسم...</span>
                <kbd className="font-mono text-[10px] bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded shrink-0">
                  Ctrl K
                </kbd>
              </button>
            ) : (
              <>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={quickSearchQuery}
                  onChange={(e) => {
                    setQuickSearchQuery(e.target.value);
                    setIsQuickSearchOpen(true);
                  }}
                  onFocus={() => setIsQuickSearchOpen(true)}
                  placeholder="بحث سريع عن طالب بالاسم أو الكود... (Ctrl+K)"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-9 pl-10 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 transition"
                />
                {quickSearchQuery && (
                  <button
                    onClick={() => setQuickSearchQuery('')}
                    className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Live Search Results Popup */}
          {isQuickSearchOpen && quickSearchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden text-right animate-in fade-in zoom-in duration-150">
              <div className="p-2 bg-slate-950 border-b border-slate-800 text-[10.5px] font-bold text-slate-400 flex items-center justify-between">
                <span>نتائج البحث عن: "{quickSearchQuery}"</span>
                <span className="text-amber-400">{searchResults.length} طالب</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 custom-scrollbar p-1.5 space-y-1">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    لا يوجد طالب يطابق معايير البحث.
                  </div>
                ) : (
                  searchResults.map((student) => {
                    const cls = classes.find((c) => c.id === student.classId);
                    const dept = departments.find((d) => d.id === student.departmentId);

                    return (
                      <div
                        key={student.id}
                        className="p-2.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{student.fullName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>كود: <span className="font-mono text-amber-300">{student.studentCode}</span></span>
                            <span>•</span>
                            <span className="text-slate-300">{cls?.name || 'فصل غير محدد'}</span>
                            <span>•</span>
                            <span className="text-slate-400">{dept?.name || 'تخصص عام'}</span>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {onSelectStudentReport && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudentReport(student.id);
                                setIsQuickSearchOpen(false);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                              title="فتح ملف وسجل الطالب الشامل"
                            >
                              <FileText className="w-3 h-3" />
                              <span>الملف</span>
                            </button>
                          )}

                          {onSelectStudentAttendance && student.classId && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectStudentAttendance(student.classId);
                                setIsQuickSearchOpen(false);
                              }}
                              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-2 py-1 rounded-lg text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                              title="الذهاب لصفحة الحضور لفصل الطالب"
                            >
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>الحضور</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Left Side: User Role Switcher, Alerts & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Smart Early Warning Notification Bell */}
          <div className="relative" ref={alertsDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAlertsOpen((prev) => !prev)}
              className={`relative p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                criticalAlertsCount > 0
                  ? 'bg-red-950/80 border-red-800 text-red-200 hover:bg-red-900/90 ring-1 ring-red-500/50'
                  : alerts.length > 0
                  ? 'bg-amber-950/80 border-amber-800 text-amber-200 hover:bg-amber-900/90'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="محرك التنبيهات الاستباقية الذكية للمخاطر"
            >
              <Bell
                className={`w-4 h-4 ${
                  criticalAlertsCount > 0 ? 'text-red-400 animate-bounce' : 'text-amber-400'
                }`}
              />
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Smart Alerts Dropdown Drawer */}
            {isAlertsOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-black text-xs text-white">
                      محرك التنبيهات الاستباقية الذكية ({alerts.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAlertsOpen(false)}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-800 custom-scrollbar p-2 space-y-1.5">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      ✨ لا توجد أي حالات حرجة أو تنبيهات استباقية حالياً. الوضع الانضباطي مستقر تماماً.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                          alert.severity === 'critical'
                            ? 'bg-red-950/40 border-red-900/60 hover:bg-red-950/60'
                            : alert.severity === 'warning'
                            ? 'bg-amber-950/40 border-amber-900/60 hover:bg-amber-950/60'
                            : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-black">
                            {alert.severity === 'critical' ? (
                              <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            ) : alert.severity === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span
                              className={
                                alert.severity === 'critical'
                                  ? 'text-red-300'
                                  : alert.severity === 'warning'
                                  ? 'text-amber-300'
                                  : 'text-blue-300'
                              }
                            >
                              {alert.title}
                            </span>
                          </div>

                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                              alert.severity === 'critical'
                                ? 'bg-red-900 text-red-200'
                                : alert.severity === 'warning'
                                ? 'bg-amber-900 text-amber-200'
                                : 'bg-blue-900 text-blue-200'
                            }`}
                          >
                            {alert.severity === 'critical'
                              ? 'عاجل جداً'
                              : alert.severity === 'warning'
                              ? 'تنبيه مبكر'
                              : 'معلومة'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {alert.message}
                        </p>

                        {alert.targetTab && onNavigateToTab && (
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => {
                                onNavigateToTab(alert.targetTab!);
                                setIsAlertsOpen(false);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10.5px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{alert.actionLabel || 'اتخاذ إجراء'}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Portal Badge */}
          {activePortal && (
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-800/90 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-black shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>
                {activePortal === 'principal'
                  ? 'بوابة مدير المدرسة'
                  : activePortal === 'affairs'
                  ? 'بوابة شئون الطلاب'
                  : activePortal === 'competencies'
                  ? 'بوابة مسئول الجدارات'
                  : activePortal === 'dept_head'
                  ? 'بوابة رئيس القسم'
                  : activePortal === 'teacher'
                  ? 'بوابة معلم الورش'
                  : 'البوابة المدرسية'}
              </span>
            </div>
          )}

          {/* Switch Portal Button */}
          {onSwitchPortal && (
            <button
              onClick={onSwitchPortal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-md"
              title="الرجوع لشاشة اختيار البوابات الرئيسية"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تبديل البوابة</span>
            </button>
          )}

          {/* Active User Card & Switch Button */}
          <button
            onClick={onOpenRoleSwitcher}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-right px-3 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer group shadow-sm"
            title="انقر لتغيير الصلاحية أو المستخدم"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-amber-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="text-xs hidden sm:block">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-normal ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <span className="text-[10px] text-amber-400/90 group-hover:underline">
                تبديل الدور ⟲
              </span>
            </div>
          </button>

          {/* Admin Master Dashboard Link Button (Visible to Principal) */}
          {(currentUser.role === 'principal' || currentUser.customPermissions?.canManageSchoolSettings) && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="فتح لوحة تحكم الأدمن المركزية"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">لوحة الأدمن</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
