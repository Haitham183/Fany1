import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, SchoolConfig, PortalType } from '@/types';
import {
  LayoutDashboard,
  Wrench,
  Users,
  FileText,
  Building2,
  Sliders,
  UserCheck,
  Key,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
  Award,
  TrendingUp,
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  ClipboardList,
  ChevronDown,
  ChevronsUpDown,
  BrainCircuit,
  HeartHandshake,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  currentUser: User;
  onOpenRoleSwitcher: () => void;
  onLogout: () => void;
  noticesCount: number;
  socialCasesCount?: number;
  schoolConfig: SchoolConfig;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activePortal?: PortalType;
  onSwitchPortal?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: any;
  badge: string | null;
  badgeColor?: string;
  visible: boolean;
  href?: string;
}

interface NavSection {
  category: string;
  icon: any;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenRoleSwitcher,
  onLogout,
  noticesCount,
  socialCasesCount = 0,
  schoolConfig,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  activePortal,
  onSwitchPortal,
}) => {
  const isPrincipal = currentUser.role === 'principal';
  const isDeputy = currentUser.role === 'affairs_deputy';
  const isOfficer = currentUser.role === 'affairs_officer';
  const isSocialWorker = currentUser.role === 'social_worker';
  const isDeptHead = currentUser.role === 'dept_head';
  const isCompetencyOfficer = !!currentUser.isInternalVerifier;
  const isTeacher = currentUser.role === 'teacher';
  const isAffairs = isPrincipal || isDeputy || isOfficer;

  // Custom permission checks
  const canAttendance = currentUser.customPermissions?.canTakeAttendance ?? true;
  const canStudents = currentUser.customPermissions?.canManageStudents ?? (isAffairs || isSocialWorker);
  const canNotices = currentUser.customPermissions?.canIssueNotices ?? (isAffairs || isSocialWorker);
  const canSettings = currentUser.customPermissions?.canManageSchoolSettings ?? isPrincipal;
  const canUsers = currentUser.customPermissions?.canManageUsers ?? isPrincipal;
  const canDeptReports = isDeptHead || isPrincipal || isDeputy;
  const canCompetencies = isCompetencyOfficer || (currentUser.customPermissions?.canManageCompetencies ?? true);
  const canSafety = currentUser.customPermissions?.canLogViolations ?? true;
  const canViewReports = currentUser.customPermissions?.canViewReports ?? true;
  const canSocialCases = isSocialWorker || isPrincipal || isDeputy || (currentUser.customPermissions?.canManageSocialCases ?? true);

  const navSections: NavSection[] = [
    {
      category: 'المتابعة والإحصاء',
      icon: LayoutDashboard,
      items: [
        {
          id: 'dashboard',
          label: 'لوحة القيادة والمؤشرات',
          icon: LayoutDashboard,
          badge: null,
          visible: true,
        },
        {
          id: 'census',
          label: 'الإحصاء الصباحي (5 مواظبة)',
          icon: TrendingUp,
          badge: null,
          visible: canViewReports,
        },
        {
          id: 'ai_prediction',
          label: 'التنبؤ الذكي بالتسرب والرسوب',
          icon: BrainCircuit,
          badge: 'AI ✨',
          badgeColor: 'bg-indigo-600 text-cyan-200 font-extrabold animate-pulse',
          visible: canViewReports || canStudents,
        },
      ],
    },
    {
      category: 'الورش والجدارات الفنية',
      icon: Wrench,
      items: [
        {
          id: 'attendance',
          label: 'رصد الحضور والغياب',
          icon: Wrench,
          badge: null,
          visible: canAttendance,
        },
        {
          id: 'competencies',
          label: 'تقييم الجدارات (85%)',
          icon: Award,
          badge: null,
          visible: canCompetencies,
        },
        {
          id: 'safety',
          label: 'السلامة ومخالفات الورش',
          icon: ShieldAlert,
          badge: null,
          visible: canSafety,
        },
        {
          id: 'departments',
          label: 'متابعة ورش التخصص',
          icon: Building2,
          badge: null,
          visible: canDeptReports,
        },
      ],
    },
    {
      category: 'شئون الطلاب والسجلات',
      icon: Users,
      items: [
        {
          id: 'affairs',
          label: 'شئون الطلاب ونقل الفصول',
          icon: Users,
          badge: null,
          visible: canStudents,
        },
        {
          id: 'class_rosters',
          label: 'قوائم الفصول وكشوف A4',
          icon: BookOpen,
          badge: null,
          visible: canStudents || canAttendance || canDeptReports,
        },
        {
          id: 'student_report',
          label: 'ملف وسجل الطالب الشامل',
          icon: GraduationCap,
          badge: null,
          visible: canStudents || canAttendance || canDeptReports || canViewReports,
        },
        {
          id: 'ministry_sheets',
          label: 'السجلات الوزارية (1 سر / 41)',
          icon: FileSpreadsheet,
          badge: null,
          visible: canStudents,
        },
        {
          id: 'social_portal',
          label: 'بوابة الأخصائي الاجتماعي والإرشاد',
          icon: HeartHandshake,
          badge: socialCasesCount > 0 ? `${socialCasesCount}` : null,
          badgeColor: 'bg-teal-600 text-white font-bold',
          visible: canSocialCases,
        },
        {
          id: 'notices',
          label: 'الإنذارات والقرارات الرسمية',
          icon: FileText,
          badge: noticesCount > 0 ? `${noticesCount}` : null,
          badgeColor: 'bg-red-500 text-white animate-pulse',
          visible: canNotices,
        },
        {
          id: 'parent_portal',
          label: 'بوابة استعلام أولياء الأمور',
          icon: ClipboardList,
          badge: null,
          visible: true,
        },
      ],
    },
    {
      category: 'الإدارة والتهيئة',
      icon: Sliders,
      items: [
        {
          id: 'settings',
          label: 'بيانات المدرسة والتخصصات',
          icon: Sliders,
          badge: null,
          visible: canSettings,
        },
        {
          id: 'users',
          label: 'المستخدمين والصلاحيات',
          icon: Key,
          badge: null,
          visible: canUsers,
        },
        {
          id: 'admin_portal',
          label: 'لوحة الأدمن المركزية',
          icon: ShieldCheck,
          badge: null,
          visible: canSettings || canUsers,
          href: '/admin',
        },
      ],
    },
  ];

  // Collapsible Accordion State for Categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('egyptian_school_sidebar_sections_state');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories((prev) => {
      const next = { ...prev, [categoryName]: !prev[categoryName] };
      try {
        localStorage.setItem('egyptian_school_sidebar_sections_state', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    navSections.forEach((s) => (next[s.category] = false));
    setCollapsedCategories(next);
    try {
      localStorage.setItem('egyptian_school_sidebar_sections_state', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    navSections.forEach((s) => {
      // Keep section with active tab open
      const hasActive = s.items.some((item) => item.id === activeTab);
      next[s.category] = !hasActive;
    });
    setCollapsedCategories(next);
    try {
      localStorage.setItem('egyptian_school_sidebar_sections_state', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-expand the category that contains the currently active tab
  useEffect(() => {
    navSections.forEach((section) => {
      const hasActive = section.items.some((item) => item.id === activeTab);
      if (hasActive && collapsedCategories[section.category]) {
        setCollapsedCategories((prev) => ({
          ...prev,
          [section.category]: false,
        }));
      }
    });
  }, [activeTab]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:relative top-0 right-0 z-40 lg:z-10 h-screen lg:h-full bg-slate-900 text-slate-100 flex flex-col justify-between border-l border-slate-800 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out shrink-0 no-print ${
          isOpenMobile
            ? 'translate-x-0 w-72'
            : isCollapsed
            ? 'translate-x-full lg:translate-x-0 lg:w-20'
            : 'translate-x-full lg:translate-x-0 lg:w-72'
        }`}
      >
        {/* Top Header Bar inside Sidebar */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xs shadow-inner">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-black text-xs text-white truncate text-right">
                {schoolConfig.name}
              </span>
            </div>
          ) : (
            <div className="mx-auto text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
          >
            {isCollapsed ? (
              <PanelRightOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Global Accordion Quick Controls (Expand / Collapse All) */}
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[10.5px] font-bold text-slate-400 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-1">
              <ChevronsUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>مجموعات النظام</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="hover:text-amber-300 transition cursor-pointer"
                title="فتح جميع المجموعات"
              >
                فتح الكل
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="hover:text-amber-300 transition cursor-pointer"
                title="طي جميع المجموعات"
              >
                طي الكل
              </button>
            </div>
          </div>
        )}

        {/* Navigation Links Scrollable Area */}
        <div className="p-2 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            const isSectionCollapsed = Boolean(collapsedCategories[section.category]);
            const SectionIcon = section.icon || LayoutDashboard;
            const hasActiveChild = section.items.some((item) => item.id === activeTab);

            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all ${
                  !isCollapsed ? 'bg-slate-950/40 border border-slate-800/60 p-1' : 'space-y-1'
                }`}
              >
                {/* Collapsible Category Header Button */}
                {!isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggleCategory(section.category)}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center justify-between transition group cursor-pointer ${
                      hasActiveChild
                        ? 'text-amber-300 bg-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                    title={isSectionCollapsed ? 'انقر لفتح المجموعة' : 'انقر لتقليص المجموعة'}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SectionIcon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          hasActiveChild ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate text-right">{section.category}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-md font-mono font-bold">
                        {visibleItems.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isSectionCollapsed ? '-rotate-90 text-slate-500' : 'rotate-0 text-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                )}

                {/* Sub-Items List */}
                {(!isSectionCollapsed || isCollapsed) && (
                  <div className="space-y-0.5 pt-0.5 animate-in fade-in duration-150">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={onCloseMobile}
                            title={isCollapsed ? item.label : undefined}
                            className={`w-full flex items-center ${
                              isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 gap-2'
                            } rounded-xl text-xs font-bold transition-all group cursor-pointer relative ${
                              isActive
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black ring-1 ring-amber-400'
                                : 'text-amber-400/90 hover:bg-amber-500/10 hover:text-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                              {!isCollapsed && (
                                <span className="truncate text-right">{item.label}</span>
                              )}
                            </div>

                            {!isCollapsed && item.badge && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap ${
                                  item.badgeColor || 'bg-amber-500 text-slate-950'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}

                            {isCollapsed && item.badge && (
                              <span className="absolute top-2 left-2 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            onCloseMobile();
                          }}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 gap-2'
                          } rounded-xl text-xs font-bold transition-all group cursor-pointer relative ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black ring-1 ring-amber-400'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="truncate text-right">{item.label}</span>
                            )}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 whitespace-nowrap ${
                                item.badgeColor || (isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300')
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {/* Collapsed Dot Indicator */}
                          {isCollapsed && item.badge && (
                            <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Card at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2 shrink-0">
          {!isCollapsed ? (
            <>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="font-bold text-xs text-slate-100 truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-amber-400 font-semibold truncate">{currentUser.roleTitle}</div>
                  </div>
                </div>

                <button
                  onClick={onOpenRoleSwitcher}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg font-bold border border-slate-700 shrink-0 transition cursor-pointer shadow-2xs"
                  title="تبديل المستخدم"
                >
                  تبديل
                </button>
              </div>

              {onSwitchPortal && (
                <button
                  onClick={onSwitchPortal}
                  className="w-full flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 py-2 rounded-xl text-xs font-black transition cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  تبديل البوابة الرئيسية
                </button>
              )}

              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-900/60 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                تسجيل الخروج
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {onSwitchPortal && (
                <button
                  onClick={onSwitchPortal}
                  className="w-10 h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center text-amber-300 border border-amber-500/40 transition"
                  title="تبديل البوابة"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onOpenRoleSwitcher}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-amber-400 transition"
                title={`${currentUser.name} (${currentUser.roleTitle}) - انقر للتبديل`}
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-red-950/60 hover:bg-red-900 flex items-center justify-center text-red-400 transition"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
