'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, SchoolClass, Department, User, UserRole } from '@/types';
import {
  Search,
  Users,
  Wrench,
  Award,
  ShieldAlert,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Building2,
  Sliders,
  LogOut,
  Command,
  X,
  GraduationCap,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onSelectStudentReport?: (studentId: string) => void;
  onSelectClassAttendance?: (classId: string) => void;
  onOpenRoleSwitcher?: () => void;
  onLogout?: () => void;
}

interface CommandAction {
  id: string;
  category: 'actions' | 'navigation' | 'students';
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  badge?: string;
  perform: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  departments,
  currentUser,
  onNavigate,
  onSelectStudentReport,
  onSelectClassAttendance,
  onOpenRoleSwitcher,
  onLogout,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus on input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Base Quick Actions & Navigation
  const allActions = useMemo<CommandAction[]>(() => {
    const list: CommandAction[] = [];

    // Quick Actions
    list.push({
      id: 'action_attendance',
      category: 'actions',
      title: 'رصد حضور وغياب ورشة اليوم',
      subtitle: 'تسجيل سريع لحضور الطلاب والورش العملية',
      icon: Wrench,
      shortcut: 'Alt + A',
      perform: () => {
        onNavigate('attendance');
        onClose();
      },
    });

    list.push({
      id: 'action_competencies',
      category: 'actions',
      title: 'تقييم مخرجات الجدارات (CBE)',
      subtitle: 'رصد بطاقات الملاحظة وفحص المنتج وسحب عينات التحقق',
      icon: Award,
      perform: () => {
        onNavigate('competencies');
        onClose();
      },
    });

    list.push({
      id: 'action_census',
      category: 'actions',
      title: 'الإحصاء الصباحي وسجل 5 مواظبة',
      subtitle: 'مطابقة القوة الصباحية وتصدير الإحصاء للإدارة',
      icon: TrendingUp,
      perform: () => {
        onNavigate('census');
        onClose();
      },
    });

    list.push({
      id: 'action_notices',
      category: 'actions',
      title: 'إصدار ومتابعة الإنذارات وقرارات الفصل (مادة 25)',
      subtitle: 'نماذج الإنذار الأول والثاني والبريد المسجل',
      icon: ShieldAlert,
      perform: () => {
        onNavigate('notices');
        onClose();
      },
    });

    list.push({
      id: 'action_ai',
      category: 'actions',
      title: 'التنبؤ الذكي بالتسرب والرسوب (AI)',
      subtitle: 'كشف مبكر للطلاب المعرضين للرسوب والحرمان',
      icon: Sparkles,
      badge: 'AI ✨',
      perform: () => {
        onNavigate('ai_prediction');
        onClose();
      },
    });

    list.push({
      id: 'action_role_switch',
      category: 'actions',
      title: 'تبديل دور المستخدم / الحساب',
      subtitle: `المستخدم الحالي: ${currentUser.name} (${currentUser.roleTitle})`,
      icon: UserCheck,
      perform: () => {
        if (onOpenRoleSwitcher) onOpenRoleSwitcher();
        onClose();
      },
    });

    // Navigation Pages
    list.push({
      id: 'nav_dashboard',
      category: 'navigation',
      title: 'لوحة القيادة والمتابعة الرئيسية',
      subtitle: 'الرئيسية',
      icon: Users,
      perform: () => {
        onNavigate('dashboard');
        onClose();
      },
    });

    list.push({
      id: 'nav_affairs',
      category: 'navigation',
      title: 'سجل شئون الطلاب والملفات',
      subtitle: 'بيانات الطلاب والقيد والتحويلات',
      icon: FileText,
      perform: () => {
        onNavigate('affairs');
        onClose();
      },
    });

    list.push({
      id: 'nav_departments',
      category: 'navigation',
      title: 'الأقسام الصناعية والتخصصية',
      subtitle: 'متابعة ورش الأقسام والخطط الدراسية',
      icon: Building2,
      perform: () => {
        onNavigate('departments');
        onClose();
      },
    });

    list.push({
      id: 'nav_safety',
      category: 'navigation',
      title: 'سجل السلامة المهنية ومخالفات الورش',
      subtitle: 'مهمات الوقاية وحالات التزويغ',
      icon: ShieldAlert,
      perform: () => {
        onNavigate('safety');
        onClose();
      },
    });

    list.push({
      id: 'nav_settings',
      category: 'navigation',
      title: 'إعدادات المنظومة والقواعد القانونية',
      subtitle: 'بيانات المدرسة والمواعيد والنسب',
      icon: Sliders,
      perform: () => {
        onNavigate('settings');
        onClose();
      },
    });

    return list;
  }, [currentUser, onNavigate, onClose, onOpenRoleSwitcher]);

  // Filtered Actions & Student Results
  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return allActions;
    }

    // Filter predefined actions
    const matchedActions = allActions.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanQuery) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(cleanQuery))
    );

    // Search students (Masked PII)
    const matchedStudents: CommandAction[] = students
      .filter((s) => {
        return (
          s.fullName.toLowerCase().includes(cleanQuery) ||
          s.studentCode.toLowerCase().includes(cleanQuery) ||
          s.nationalId.includes(cleanQuery)
        );
      })
      .slice(0, 8)
      .map((s) => {
        const sClass = classes.find((c) => c.id === s.classId);
        const sDept = departments.find((d) => d.id === s.departmentId);

        return {
          id: `student_${s.id}`,
          category: 'students',
          title: s.fullName,
          subtitle: `فصل: ${sClass?.name || 'عام'} • قسم: ${sDept?.name || 'صناعي'} • غياب: ${s.totalAbsenceDays} يوم`,
          icon: GraduationCap,
          badge: s.warningLevel > 0 ? (s.warningLevel === 3 ? 'قرار فصل' : 'إنذار') : undefined,
          perform: () => {
            if (onSelectStudentReport) {
              onSelectStudentReport(s.id);
            } else {
              onNavigate('student_report');
            }
            onClose();
          },
        };
      });

    return [...matchedStudents, ...matchedActions];
  }, [query, allActions, students, classes, departments, onSelectStudentReport, onNavigate, onClose]);

  // Keyboard Navigation Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].perform();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="لوحة الأوامر والبحث السريع"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] divide-y divide-slate-100 dark:divide-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 gap-3 bg-slate-50/70 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="ابحث عن طالب بالاسم، كود الطالب، أو اكتب أمراً للانتقال الفوري..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
            ESC للإغلاق
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-50 dark:divide-slate-800/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold">لم يتم العثور على نتائج تطابق &quot;{query}&quot;</p>
              <p className="text-[11px] text-slate-400">تأكد من كتابة اسم الطالب أو الأمر بشكل صحيح</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.perform}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : item.category === 'students'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : item.category === 'actions'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded font-black ${
                              isSelected
                                ? 'bg-white text-blue-900'
                                : item.badge.includes('فصل')
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={`text-[11px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {item.shortcut}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 rtl:rotate-180 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Tip */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>استخدم الأسهم <b>↑↓</b> للتنقل</span>
            <span>اضغط <b>Enter</b> للاختيار</span>
          </div>
          <span className="font-mono text-[10px]">التعليم الفني الصناعي المصري (CBE)</span>
        </div>
      </div>
    </div>
  );
};
