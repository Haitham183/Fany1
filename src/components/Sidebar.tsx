'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { User, SchoolConfig, PortalType, SchoolTenant } from '@/types';
import { tabToPath } from '@/lib/tabRouter';
import {
  LayoutDashboard,
  Wrench,
  Users,
  FileText,
  Building2,
  Sliders,
  UserCheck,
  LogOut,
  ShieldAlert,
  Award,
  TrendingUp,
  BookOpen,
  GraduationCap,
  BrainCircuit,
  HeartHandshake,
  PanelRightClose,
  PanelRightOpen,
  ArrowRightLeft,
  CalendarCheck,
  Layers,
  Sparkles,
  Search,
  School,
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
  onOpenCommandPalette?: () => void;
  inspectingSchool?: SchoolTenant | null;
  onExitInspection?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number | null;
  badgeColor?: string;
  visible: boolean;
}

interface NavSection {
  title: string;
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
  onOpenCommandPalette,
  inspectingSchool = null,
  onExitInspection,
}) => {
  const role = currentUser.role;

  // Build role-tailored focused sections
  const sections = useMemo<NavSection[]>(() => {
    const list: NavSection[] = [];

    // 0. DIRECTORATE ADMIN MENU (Super Admin / Directorate Level)
    if (role === 'directorate_admin') {
      if (inspectingSchool) {
        // Mode A: Active Field Inspection of a Specific School
        list.push({
          title: `تفتيش مدرسة: ${inspectingSchool.name}`,
          items: [
            {
              id: 'dashboard',
              label: 'لوحة فحص المدرسة الميدانية',
              icon: LayoutDashboard,
              badge: 'تفتيش',
              badgeColor: 'bg-amber-500 text-slate-950 font-bold',
              visible: true,
            },
            {
              id: 'census',
              label: 'إحصاء 5 ومواظبة الطلاب',
              icon: TrendingUp,
              visible: true,
            },
            {
              id: 'competencies',
              label: 'فحص نسب حضور الورش والجدارات',
              icon: Award,
              visible: true,
            },
            {
              id: 'official_sheets',
              label: 'مراجعة دفاتر 41 وسر 1',
              icon: FileText,
              visible: true,
            },
            {
              id: 'departments',
              label: 'تفتيش أقسام وورش المدرسة',
              icon: Building2,
              visible: true,
            },
          ],
        });

        list.push({
          title: 'الإنهاء والعودة للمنظومة',
          items: [
            {
              id: 'directorate',
              label: 'العودة لغرفة القيادة المركزية ⮌',
              icon: School,
              badge: 'خروج',
              badgeColor: 'bg-slate-900 text-white font-black',
              visible: true,
            },
          ],
        });
      } else {
        // Mode B: Standard Directorate Central Command Cockpit (Pure Directorate Tools, Zero School Tabs)
        list.push({
          title: 'القيادة المركزية والتحكم في المدارس',
          items: [
            {
              id: 'directorate',
              label: 'غرفة العمليات والمؤشرات المركزية 🏛️',
              icon: School,
              badge: 'مركزي',
              badgeColor: 'bg-amber-500 text-slate-950 font-bold',
              visible: true,
            },
            {
              id: 'directorate_schools',
              label: 'شبكة وإدارة المدارس الفنية',
              icon: Building2,
              visible: true,
            },
            {
              id: 'directorate_competencies',
              label: 'رقابة الجدارات ونسب الورش 85%',
              icon: Award,
              visible: true,
            },
            {
              id: 'directorate_attendance',
              label: 'مرصد الغياب ومواظبة 5',
              icon: TrendingUp,
              visible: true,
            },
            {
              id: 'directorate_circulars',
              label: 'القرارات والكتب الدورية للمدارس',
              icon: FileText,
              visible: true,
            },
            {
              id: 'directorate_inspection',
              label: 'سجل التفتيش والمتابعة الميدانية',
              icon: ShieldAlert,
              visible: true,
            },
          ],
        });
      }

      return list;
    }

    // 1. TEACHER MENU (Focused on Workshop, CBE, Rosters, Safety)
    if (role === 'teacher') {
      list.push({
        title: 'مهام المعلم والورشة',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة قيادة المعلم',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'attendance',
            label: 'تحضير ورشة اليوم ⚡',
            icon: CalendarCheck,
            visible: true,
          },
          {
            id: 'competencies',
            label: 'تقييم الجدارات والأدلة',
            icon: Award,
            visible: true,
          },
          {
            id: 'class_rosters',
            label: 'قوائم الطلاب المعتمدة',
            icon: BookOpen,
            visible: true,
          },
          {
            id: 'safety',
            label: 'سجل السلامة والتزويغ',
            icon: ShieldAlert,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 2. SOCIAL WORKER MENU (Focused on Cases, Counseling, AI Dropout Risk)
    if (role === 'social_worker') {
      list.push({
        title: 'الرعاية والإرشاد النفسي',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة الأخصائي الاجتماعي',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'social_portal',
            label: 'سجل دراسات الحالة والمقابلات',
            icon: HeartHandshake,
            badge: socialCasesCount > 0 ? socialCasesCount : null,
            badgeColor: 'bg-teal-600 text-white',
            visible: true,
          },
          {
            id: 'ai_prediction',
            label: 'التنبؤ الذكي بالتسرب (AI)',
            icon: BrainCircuit,
            badge: 'AI ✨',
            badgeColor: 'bg-indigo-600 text-cyan-200',
            visible: true,
          },
          {
            id: 'safety',
            label: 'مخالفات السلوك والتزويغ',
            icon: ShieldAlert,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 3. DEPT HEAD MENU (Focused on Department, Competencies, PRNG Sampling, Safety)
    if (role === 'dept_head') {
      list.push({
        title: 'إدارة التخصص الصناعي',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة رئيس القسم',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'departments',
            label: 'متابعة ورش ومعامل القسم',
            icon: Building2,
            visible: true,
          },
          {
            id: 'competencies',
            label: 'مصفوفة الجدارات والتحقق',
            icon: Award,
            visible: true,
          },
          {
            id: 'safety',
            label: 'سلامة الورش والماكينات',
            icon: ShieldAlert,
            visible: true,
          },
          {
            id: 'class_rosters',
            label: 'قوائم فصول التخصص',
            icon: BookOpen,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 4. EXTERNAL VERIFIER MENU (Audit CBE, Workshops 85%, Sampling)
    if (role === 'external_verifier') {
      list.push({
        title: 'مهام المحقق والتحقق المهني',
        items: [
          {
            id: 'competencies',
            label: 'مصفوفة الجدارات والتحقق الخارجي',
            icon: Award,
            badge: 'تدقيق',
            badgeColor: 'bg-purple-600 text-white',
            visible: true,
          },
          {
            id: 'departments',
            label: 'تفقد ورش ومعامل التخصصات',
            icon: Building2,
            visible: true,
          },
          {
            id: 'dashboard',
            label: 'لوحة تدقيق العينات والمؤشرات',
            icon: LayoutDashboard,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 5. AFFAIRS DEPUTY (Discipline Committee, Article 25, Expulsions, Transfers, Census)
    if (role === 'affairs_deputy') {
      list.push({
        title: 'الانضباط والمادة 25',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة وكيل شئون الطلاب',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'notices',
            label: 'الإنذارات وقرارات الفصل',
            icon: ShieldAlert,
            badge: noticesCount > 0 ? noticesCount : null,
            badgeColor: 'bg-red-600 text-white',
            visible: true,
          },
          {
            id: 'transfers',
            label: 'اعتماد تحويلات ونقل الطلاب',
            icon: ArrowRightLeft,
            visible: true,
          },
          {
            id: 'census',
            label: 'الإحصاء الصباحي (5 مواظبة)',
            icon: TrendingUp,
            visible: true,
          },
          {
            id: 'official_sheets',
            label: 'دفتر 41 وسجلات الوزارة',
            icon: FileText,
            visible: true,
          },
        ],
      });

      list.push({
        title: 'سجلات الطلاب والقيد',
        items: [
          {
            id: 'affairs',
            label: 'سجل وقيد الطلاب',
            icon: Users,
            visible: true,
          },
          {
            id: 'class_rosters',
            label: 'قوائم الفصول المعتمدة',
            icon: BookOpen,
            visible: true,
          },
          {
            id: 'student_report',
            label: 'ملف الطالب والشهادات',
            icon: GraduationCap,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 6. AFFAIRS OFFICER (Register 41, Sheet 1 Ser, Census, Drafting Notices)
    if (role === 'affairs_officer') {
      list.push({
        title: 'السجلات والشيتات الوزارية',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة مسئول الشيتات والسجلات',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'official_sheets',
            label: 'دفتر 41 وشيتات سر 1 وسجل 5',
            icon: FileText,
            visible: true,
          },
          {
            id: 'census',
            label: 'الإحصاء الصباحي (5 مواظبة)',
            icon: TrendingUp,
            visible: true,
          },
          {
            id: 'notices',
            label: 'مسودات الإنذارات والمراسلات',
            icon: ShieldAlert,
            badge: noticesCount > 0 ? noticesCount : null,
            badgeColor: 'bg-red-600 text-white',
            visible: true,
          },
        ],
      });

      list.push({
        title: 'قيد وبحث الطلاب',
        items: [
          {
            id: 'affairs',
            label: 'سجل وبيانات الطلاب',
            icon: Users,
            visible: true,
          },
          {
            id: 'class_rosters',
            label: 'قوائم الفصول المعتمدة',
            icon: BookOpen,
            visible: true,
          },
          {
            id: 'student_report',
            label: 'ملف الطالب والشهادات',
            icon: GraduationCap,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 7. SYSTEM ADMIN (IT Setup, Users, Settings)
    if (role === 'system_admin') {
      list.push({
        title: 'إدارة النظام التقني',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة تحكم النظام التقني',
            icon: LayoutDashboard,
            visible: true,
          },
          {
            id: 'users',
            label: 'حسابات فريق العمل والصلاحيات',
            icon: UserCheck,
            visible: true,
          },
          {
            id: 'settings',
            label: 'إعدادات المنظومة وهوية المدرسة',
            icon: Sliders,
            visible: true,
          },
        ],
      });
      return list;
    }

    // 8. PRINCIPAL (Full School Executive Leadership)
    list.push({
      title: 'مركز القيادة والمتابعة',
      items: [
        {
          id: 'dashboard',
          label: 'لوحة القيادة والقرارات',
          icon: LayoutDashboard,
          visible: true,
        },
        {
          id: 'census',
          label: 'الإحصاء الصباحي (5 مواظبة)',
          icon: TrendingUp,
          visible: true,
        },
        {
          id: 'notices',
          label: 'الإنذارات وقرارات الفصل',
          icon: ShieldAlert,
          badge: noticesCount > 0 ? noticesCount : null,
          badgeColor: 'bg-red-600 text-white',
          visible: true,
        },
        {
          id: 'ai_prediction',
          label: 'التنبؤ الذكي بالتسرب (AI)',
          icon: BrainCircuit,
          badge: 'AI ✨',
          badgeColor: 'bg-indigo-600 text-cyan-200',
          visible: true,
        },
      ],
    });

    list.push({
      title: 'العمليات الميدانية والورش',
      items: [
        {
          id: 'departments',
          label: 'الأقسام الصناعية والورش',
          icon: Building2,
          visible: true,
        },
        {
          id: 'competencies',
          label: 'منظومة الجدارات (CBE)',
          icon: Award,
          visible: true,
        },
        {
          id: 'attendance',
          label: 'رصد الحضور والغياب',
          icon: Wrench,
          visible: true,
        },
        {
          id: 'affairs',
          label: 'شئون الطلاب والقيد',
          icon: Users,
          visible: true,
        },
        {
          id: 'official_sheets',
          label: 'دفاتر 41 وسر 1 الوزارية',
          icon: FileText,
          visible: true,
        },
      ],
    });

    list.push({
      title: 'الإدارة والنظام',
      items: [
        {
          id: 'settings',
          label: 'إعدادات المدرسة والقواعد',
          icon: Sliders,
          visible: true,
        },
        {
          id: 'users',
          label: 'حسابات فريق العمل',
          icon: UserCheck,
          visible: true,
        },
      ],
    });

    return list;
  }, [role, noticesCount, socialCasesCount, inspectingSchool]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 right-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-s border-slate-200/80 dark:border-slate-800 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpenMobile ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}`}
      >
        {/* Quick Search Shortcut Trigger */}
        {!isCollapsed && onOpenCommandPalette && (
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={onOpenCommandPalette}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition cursor-pointer group"
            >
              <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span>بحث سريع بالأوامر</span>
              </span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
          {sections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {sec.title}
                </div>
              )}

              {sec.items
                .filter((item) => item.visible)
                .map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={tabToPath(item.id)}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                            item.badgeColor || (isActive ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-800')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Footer: User Role Pill & Collapse Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
              <div className="min-w-0">
                <span className="font-black text-slate-900 dark:text-white text-xs truncate block">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate block">
                  {currentUser.roleTitle}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onOpenRoleSwitcher}
                  title="تبديل الدور"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenRoleSwitcher}
                title="تبديل الدور"
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collapse Sidebar Button on Desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            {isCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
            {!isCollapsed && <span>طي القائمة</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
