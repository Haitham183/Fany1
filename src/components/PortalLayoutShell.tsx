'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  SchoolConfig,
  SchoolTenant,
  PortalType,
  SocialCaseRecord,
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
  getIsAuthenticated,
  getSocialCases,
  getWorkshopViolations,
  logout,
  wipeDatabaseForProduction,
  getSchools,
  setActiveSchoolId,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ShieldAlert } from 'lucide-react';
import { setupRealtimeSync, pullAllDataFromCloud } from '@/lib/supabaseSync';
import { RoleSwitcherModal } from '@/components/RoleSwitcherModal';
import { DashboardView } from '@/components/DashboardView';
import { TeacherAttendanceTaker } from '@/components/TeacherAttendanceTaker';
import { StudentAffairsView } from '@/components/StudentAffairsView';
import { OfficialNoticesView } from '@/components/OfficialNoticesView';
import { DepartmentReportsView } from '@/components/DepartmentReportsView';
import { SchoolSettingsView } from '@/components/SchoolSettingsView';
import { UserManagementView } from '@/components/UserManagementView';
import { DailyCensusView } from '@/components/DailyCensusView';
import { CompetenciesView } from '@/components/CompetenciesView';
import { WorkshopSafetyView } from '@/components/WorkshopSafetyView';
import { OfficialMinistrySheetsView } from '@/components/OfficialMinistrySheetsView';
import { ClassRostersView } from '@/components/ClassRostersView';
import { StudentReportCardView } from '@/components/StudentReportCardView';
import { ParentPortalView } from '@/components/ParentPortalView';
import { AiPredictionDashboard } from '@/components/AiPredictionDashboard';
import { SocialWorkerPortalView } from '@/components/SocialWorkerPortalView';
import { PermissionsMatrixView } from '@/components/PermissionsMatrixView';
import { AuditLogsView } from '@/components/AuditLogsView';
import { initOfflineSyncEngine } from '@/lib/offlineSyncEngine';
import { PortalSelectionScreen } from '@/components/PortalSelectionScreen';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';
import { OfflineSyncBanner } from '@/components/OfflineSyncBanner';
import { ToastProvider } from '@/components/ui';
import { CommandPaletteModal } from '@/components/CommandPaletteModal';
import { SuperAdminDirectorateView } from '@/components/SuperAdminDirectorateView';
import { SchoolSwitcherModal } from '@/components/SchoolSwitcherModal';
import {
  normalizeTabId,
  canRoleAccessTab,
  getDefaultTabForRole,
  tabToPath,
  pathToTab,
  CanonicalTabId,
} from '@/lib/tabRouter';

interface PortalLayoutShellProps {
  initialTab?: string;
  initialSubTab?: string;
  initialStudentId?: string;
}

export function PortalLayoutShell(props: PortalLayoutShellProps) {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-['Cairo'] transition-opacity duration-200">
            <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-600">جارٍ تهيئة البوابة...</p>
            </div>
          </div>
        }
      >
        <PortalShellContent {...props} />
      </Suspense>
    </ToastProvider>
  );
}

function PortalShellContent({
  initialTab,
  initialSubTab,
  initialStudentId,
}: PortalLayoutShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isClient, setIsClient] = useState<boolean>(() => typeof window !== 'undefined');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getIsAuthenticated();
  });
  const [activePortal, setActivePortal] = useState<PortalType | null>(null);
  const [currentUser, setCurrentUserState] = useState<User>(() => getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => (typeof window !== 'undefined' ? getUsers() : []));
  const [students, setStudents] = useState<Student[]>(() => (typeof window !== 'undefined' ? getStudents() : []));
  const [departments, setDepartments] = useState<Department[]>(() => (typeof window !== 'undefined' ? getDepartments() : []));
  const [classes, setClasses] = useState<SchoolClass[]>(() => (typeof window !== 'undefined' ? getClasses() : []));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => (typeof window !== 'undefined' ? getAttendance() : []));
  const [notices, setNotices] = useState<OfficialNotice[]>(() => (typeof window !== 'undefined' ? getNotices() : []));
  const [socialCases, setSocialCases] = useState<SocialCaseRecord[]>(() => (typeof window !== 'undefined' ? getSocialCases() : []));
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(() => (typeof window !== 'undefined' ? getSchoolConfig() : null));
  const [inspectingSchool, setInspectingSchool] = useState<SchoolTenant | null>(null);

  // Compute activeTab from pathname or props
  const computedTabFromPath = useMemo(() => {
    if (initialTab) return normalizeTabId(initialTab);
    return pathToTab(pathname || '');
  }, [initialTab, pathname]);

  const [activeTab, setActiveTab] = useState<CanonicalTabId>(computedTabFromPath);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | undefined>(
    initialStudentId || searchParams?.get('id') || undefined
  );

  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isSchoolSwitcherOpen, setIsSchoolSwitcherOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const isFullAdmin =
    currentUser.role === 'directorate_admin' ||
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  // Scoped departments based on user role and departmentId
  const authorizedDepartments = useMemo(() => {
    if (isFullAdmin || currentUser.role === 'social_worker' || !currentUser.departmentId) return departments;
    return departments.filter((d) => d.id === currentUser.departmentId);
  }, [departments, isFullAdmin, currentUser.departmentId, currentUser.role]);

  // Scoped classes based on user role, assigned classes, and departmentId
  const authorizedClasses = useMemo(() => {
    if (isFullAdmin || currentUser.role === 'social_worker') return classes;
    if (currentUser.role === 'dept_head' && currentUser.departmentId) {
      return classes.filter((c) => c.departmentId === currentUser.departmentId);
    }
    if (currentUser.role === 'teacher') {
      if (currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
        return classes.filter((c) => currentUser.assignedClassIds!.includes(c.id));
      }
      if (currentUser.departmentId) {
        return classes.filter((c) => c.departmentId === currentUser.departmentId);
      }
    }
    if (currentUser.departmentId) {
      return classes.filter((c) => c.departmentId === currentUser.departmentId);
    }
    return classes;
  }, [classes, isFullAdmin, currentUser]);

  // Scoped students based on authorized classes and department
  const authorizedStudents = useMemo(() => {
    if (isFullAdmin || currentUser.role === 'social_worker') return students;
    const classIds = new Set(authorizedClasses.map((c) => c.id));
    return students.filter((s) => {
      if (currentUser.departmentId && s.departmentId !== currentUser.departmentId) return false;
      if (currentUser.role === 'teacher' && currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
        return classIds.has(s.classId);
      }
      return true;
    });
  }, [students, isFullAdmin, authorizedClasses, currentUser]);

  const refreshAllData = () => {
    setCurrentUserState(getCurrentUser());
    setIsAuthenticated(getIsAuthenticated());
    setUsers(getUsers());
    setStudents(getStudents());
    setDepartments(getDepartments());
    setClasses(getClasses());
    setAttendance(getAttendance());
    setNotices(getNotices());
    setSocialCases(getSocialCases());
    setSchoolConfig(getSchoolConfig());
  };

  useEffect(() => {
    setIsClient(true);
    initializeData();
    refreshAllData();

    // 1. Initialize PWA Offline Engine & Sync Queue Listeners
    initOfflineSyncEngine();

    // 2. Setup Multi-Device Realtime Cloud Sync
    const cleanupRealtime = setupRealtimeSync(() => {
      refreshAllData();
    });

    // 3. Fetch latest data from Cloud on startup in background
    pullAllDataFromCloud(true).then((res) => {
      if (res.success) {
        refreshAllData();
      }
    });

    const handleStorageUpdate = () => {
      refreshAllData();
    };

    const handleTenantChange = () => {
      refreshAllData();
    };

    window.addEventListener('egyptian_school_storage_update', handleStorageUpdate);
    window.addEventListener('egyptian_school_tenant_change', handleTenantChange);
    return () => {
      window.removeEventListener('egyptian_school_storage_update', handleStorageUpdate);
      window.removeEventListener('egyptian_school_tenant_change', handleTenantChange);
      cleanupRealtime();
    };
  }, []);

  // Sync tab with pathname changes
  useEffect(() => {
    const tabFromPath = pathToTab(pathname || '');
    setActiveTab(tabFromPath);
    const paramId = searchParams?.get('id');
    if (paramId) {
      setSelectedReportStudentId(paramId);
    }
  }, [pathname, searchParams]);

  // Listen for browser Back/Forward navigation to seamlessly switch tabs
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const currentTab = pathToTab(window.location.pathname);
      setActiveTab(currentTab);
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('id');
      if (idParam) {
        setSelectedReportStudentId(idParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Role Access Guard: ensure current user can access the target route
  useEffect(() => {
    if (!isClient) return;
    const authStatus = getIsAuthenticated();
    const user = getCurrentUser();

    // If Parent Portal, allow guest access without staff authentication
    if (activeTab === 'parent_portal') {
      return;
    }

    if (!authStatus) {
      return;
    }

    // Directorate admin without inspecting school should NEVER open single school tabs
    if (user.role === 'directorate_admin' && !inspectingSchool && !activeTab.startsWith('directorate')) {
      router.replace('/directorate');
      setActiveTab('directorate');
      return;
    }

    // Role-based access validation
    if (!canRoleAccessTab(user.role, activeTab)) {
      const defaultTab = getDefaultTabForRole(user.role);
      const defaultPath = tabToPath(defaultTab);
      router.replace(defaultPath);
      setActiveTab(defaultTab);
    }
  }, [activeTab, isClient, currentUser.role, inspectingSchool, router]);

  const handleNavigate = (
    rawTab: string,
    overrideInspectingSchool?: SchoolTenant | null,
    overrideUser?: User,
    paramId?: string
  ) => {
    let normalized = normalizeTabId(rawTab);
    const activeInspection = overrideInspectingSchool !== undefined ? overrideInspectingSchool : inspectingSchool;
    const effectiveUser = overrideUser || currentUser;

    // If navigating back to central directorate command windows, exit inspection mode
    if (
      normalized === 'directorate' ||
      normalized === 'directorate_schools' ||
      normalized === 'directorate_competencies' ||
      normalized === 'directorate_attendance' ||
      normalized === 'directorate_circulars' ||
      normalized === 'directorate_inspection'
    ) {
      if (inspectingSchool) {
        setInspectingSchool(null);
      }
    }

    // Directorate admin without inspecting school should NEVER open single school tabs
    if (effectiveUser.role === 'directorate_admin' && !activeInspection && !normalized.startsWith('directorate')) {
      normalized = 'directorate';
    }

    // Strictly validate if the user's role is authorized to open this tab
    if (!canRoleAccessTab(effectiveUser.role, normalized)) {
      normalized = getDefaultTabForRole(effectiveUser.role);
    }

    setActiveTab(normalized);
    let targetPath = tabToPath(normalized);
    if (paramId && normalized === 'student_report') {
      targetPath = `${targetPath}?id=${encodeURIComponent(paramId)}`;
    }

    // Smooth SPA navigation: Update URL without destroying or unmounting the shell layout
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: normalized, paramId }, '', targetPath);
      }
    } else {
      router.push(targetPath);
    }
  };

  const handleExitInspection = () => {
    setInspectingSchool(null);
    handleNavigate('directorate');
  };

  const handleSelectUser = (user: User) => {
    setInspectingSchool(null);
    setCurrentUser(user);
    setCurrentUserState(user);

    if (user.role === 'directorate_admin') {
      handleNavigate('directorate', null, user);
    } else if (user.role === 'teacher') {
      handleNavigate('attendance', null, user);
    } else if (user.role === 'dept_head') {
      handleNavigate('departments', null, user);
    } else if (user.role === 'external_verifier' || !!user.isInternalVerifier) {
      handleNavigate('competencies', null, user);
    } else if (user.role === 'social_worker') {
      handleNavigate('social_portal', null, user);
    } else if (user.role === 'affairs_deputy' || user.role === 'affairs_officer') {
      handleNavigate('affairs', null, user);
    } else {
      handleNavigate('dashboard', null, user);
    }
  };

  const handleLogout = () => {
    setInspectingSchool(null);
    logout();
    setIsAuthenticated(false);
    setActivePortal(null);
    router.push('/');
  };

  const handleSwitchPortal = () => {
    setInspectingSchool(null);
    logout();
    setIsAuthenticated(false);
    setActivePortal(null);
    router.push('/');
  };

  const handlePortalLoginSuccess = (user: User, portal: PortalType) => {
    setInspectingSchool(null);
    setCurrentUserState(user);
    setActivePortal(portal);
    setIsAuthenticated(true);

    if (portal === 'directorate' || user.role === 'directorate_admin') {
      handleNavigate('directorate', null, user);
    } else if (portal === 'teacher' || user.role === 'teacher') {
      handleNavigate('attendance', null, user);
    } else if (portal === 'dept_head' || user.role === 'dept_head') {
      handleNavigate('departments', null, user);
    } else if (portal === 'competencies' || !!user.isInternalVerifier) {
      handleNavigate('competencies', null, user);
    } else if (portal === 'social_worker' || user.role === 'social_worker') {
      handleNavigate('social_portal', null, user);
    } else if (portal === 'affairs' || user.role === 'affairs_deputy' || user.role === 'affairs_officer') {
      handleNavigate('affairs', null, user);
    } else {
      handleNavigate('dashboard', null, user);
    }
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'تحذير إداري:\nهل ترغب في إعادة تهيئة قاعدة البيانات وتفريغ كافة السجلات للبدء الفعلي لمدرسة جديدة؟'
      )
    ) {
      await wipeDatabaseForProduction();
    }
  };

  if (!isClient || !schoolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-['Cairo'] transition-opacity duration-200">
        <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">جارٍ تجهيز المنظومة المدرسية...</p>
        </div>
      </div>
    );
  }

  // Standalone Parent Portal direct access route
  if (activeTab === 'parent_portal' && !isAuthenticated) {
    return (
      <ParentPortalView
        onBackToLogin={() => router.push('/')}
        isStandalone={true}
      />
    );
  }

  // If unauthenticated, render Unified Portal Selection Gateway
  if (!isAuthenticated) {
    return (
      <PortalSelectionScreen
        schoolConfig={schoolConfig}
        users={users}
        onSelectParentPortal={() => router.push('/parent')}
        onLoginSuccess={handlePortalLoginSuccess}
      />
    );
  }

  const pendingNoticesCount = notices.filter((n) => !n.isDelivered).length;
  const pendingSocialCasesCount = socialCases.filter((c) => c.status === 'pending').length;

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-['Cairo'] selection:bg-amber-500 selection:text-slate-950 overflow-hidden">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        onResetData={handleResetData}
        noticesCount={pendingNoticesCount}
        schoolConfig={schoolConfig}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onNavigateToTab={(tab) => handleNavigate(tab)}
        onOpenParentPortal={() => router.push('/parent')}
        activePortal={activePortal || undefined}
        onSwitchPortal={handleSwitchPortal}
        students={students}
        classes={authorizedClasses}
        departments={authorizedDepartments}
        onSelectStudentReport={(studentId) => {
          setSelectedReportStudentId(studentId);
          handleNavigate('student_report', undefined, undefined, studentId);
        }}
        onSelectStudentAttendance={(classId) => {
          handleNavigate('attendance');
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenSchoolSwitcher={() => setIsSchoolSwitcherOpen(true)}
        inspectingSchool={inspectingSchool}
        onExitInspection={handleExitInspection}
      />

      {/* Active Field Inspection Mode Banner for Directorate */}
      {currentUser.role === 'directorate_admin' && inspectingSchool && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between shadow-md border-b border-amber-600 no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping shrink-0"></span>
            <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate">
              وضع التفتيش الإداري والميداني لقيادة المديرية: أنت تعاين حالياً سجلات [{inspectingSchool.name}] (كود: {inspectingSchool.code})
            </span>
          </div>
          <button
            onClick={handleExitInspection}
            className="bg-slate-950 hover:bg-slate-900 text-amber-300 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <span>إنهاء المعاينة والعودة لغرفة القيادة المركزية ⮌</span>
          </button>
        </div>
      )}

      {/* Main Layout: Sidebar on Right (RTL) + Scrollable Main Content */}
      <div className="flex flex-1 min-h-0 relative max-w-full overflow-hidden">
        {/* Right Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => handleNavigate(tabId)}
          currentUser={currentUser}
          onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
          onLogout={handleLogout}
          noticesCount={pendingNoticesCount}
          socialCasesCount={pendingSocialCasesCount}
          schoolConfig={schoolConfig}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          activePortal={activePortal || undefined}
          onSwitchPortal={handleSwitchPortal}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          inspectingSchool={inspectingSchool}
          onExitInspection={handleExitInspection}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-y-auto custom-scrollbar transition-all duration-300">
          <div key={activeTab} className="view-transition">
          {(activeTab === 'directorate' ||
            activeTab === 'directorate_schools' ||
            activeTab === 'directorate_competencies' ||
            activeTab === 'directorate_attendance' ||
            activeTab === 'directorate_circulars' ||
            activeTab === 'directorate_inspection') &&
            currentUser.role === 'directorate_admin' && (
              <SuperAdminDirectorateView
                currentUser={currentUser}
                students={students}
                departments={departments}
                classes={classes}
                attendance={attendance}
                initialSubTab={initialSubTab || activeTab}
                onNavigateTab={(subTab) => {
                  handleNavigate(subTab);
                }}
                onNavigateToSchool={(schoolId) => {
                  const target = getSchools().find((s) => s.id === schoolId) || null;
                  setActiveSchoolId(schoolId);
                  setInspectingSchool(target);
                  refreshAllData();
                  handleNavigate('dashboard', target);
                }}
              />
            )}

          {activeTab === 'dashboard' && (
            <DashboardView
              students={authorizedStudents}
              departments={authorizedDepartments}
              classes={authorizedClasses}
              notices={notices}
              attendance={attendance}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onNavigateToStudentReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                handleNavigate('student_report', undefined, undefined, studentId);
              }}
              onSelectClassForAttendance={(classId) => {
                handleNavigate('attendance');
              }}
              onOpenSocialCase={(caseId) => {
                handleNavigate('social_portal');
              }}
            />
          )}

          {activeTab === 'census' && (
            <DailyCensusView
              schoolConfig={schoolConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'ai_prediction' && (
            <AiPredictionDashboard
              students={authorizedStudents}
              attendance={attendance}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
              onNavigateToNotices={(studentId) => {
                handleNavigate('notices');
              }}
              onNavigateToStudentReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                handleNavigate('student_report', undefined, undefined, studentId);
              }}
              onNavigateToSocialPortal={() => {
                handleNavigate('social_portal');
              }}
            />
          )}

          {activeTab === 'social_portal' && (
            <SocialWorkerPortalView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              attendance={attendance}
              socialCases={socialCases}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
              violations={getWorkshopViolations()}
              onDataChanged={refreshAllData}
              onNavigateToStudentReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                handleNavigate('student_report', undefined, undefined, studentId);
              }}
              onNavigateToAiPredictions={() => handleNavigate('ai_prediction')}
            />
          )}

          {activeTab === 'attendance' && (
            <TeacherAttendanceTaker
              currentUser={currentUser}
              classes={authorizedClasses}
              students={authorizedStudents}
              departments={authorizedDepartments}
              schoolConfig={schoolConfig}
              onAttendanceSaved={() => {
                refreshAllData();
              }}
              onNavigateToNotices={() => handleNavigate('notices')}
            />
          )}

          {activeTab === 'competencies' && (
            <CompetenciesView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'safety' && (
            <WorkshopSafetyView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
              onDataChanged={refreshAllData}
            />
          )}

          {(activeTab === 'affairs' || activeTab === 'transfers') && (
            <StudentAffairsView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              attendance={attendance}
              currentUser={currentUser}
              onDataChanged={refreshAllData}
              initialTab={activeTab === 'transfers' ? 'transfers' : 'weekly_sheet'}
              onNavigateToReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                handleNavigate('student_report', undefined, undefined, studentId);
              }}
            />
          )}

          {activeTab === 'class_rosters' && (
            <ClassRostersView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'student_report' && (
            <StudentReportCardView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              attendance={attendance}
              notices={notices}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
              initialStudentId={selectedReportStudentId}
            />
          )}

          {activeTab === 'official_sheets' && (
            <OfficialMinistrySheetsView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              attendance={attendance}
              schoolConfig={schoolConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'notices' && (
            <OfficialNoticesView
              notices={notices}
              students={authorizedStudents}
              currentUser={currentUser}
              schoolConfig={schoolConfig}
              onNoticeUpdated={refreshAllData}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentReportsView
              departments={authorizedDepartments}
              classes={authorizedClasses}
              students={authorizedStudents}
              attendance={attendance}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'settings' && (
            <SchoolSettingsView
              schoolConfig={schoolConfig}
              departments={departments}
              classes={classes}
              currentUser={currentUser}
              onSettingsSaved={refreshAllData}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              departments={departments}
              classes={classes}
              currentUser={currentUser}
              onUsersChanged={refreshAllData}
            />
          )}

          {activeTab === 'roles' && (
            <PermissionsMatrixView
              currentUserRole={currentUser.role}
              isInspectionMode={!!inspectingSchool}
            />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogsView
              currentUserRole={currentUser.role}
              currentSchoolId={inspectingSchool ? inspectingSchool.id : (currentUser.role === 'directorate_admin' ? null : 'sch_cairo_abbassia')}
            />
          )}

          {activeTab === 'parent_portal' && (
            <ParentPortalView
              onBackToLogin={() => handleNavigate('dashboard')}
              isStandalone={false}
            />
          )}

          {/* Signature Footer */}
          <DeveloperCreditFooter className="mt-10 pb-4" />
          </div>
        </main>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        students={students}
        classes={authorizedClasses}
        departments={authorizedDepartments}
        currentUser={currentUser}
        onNavigate={(tab) => handleNavigate(tab)}
        onSelectStudentReport={(studentId) => {
          setSelectedReportStudentId(studentId);
          handleNavigate('student_report', undefined, undefined, studentId);
        }}
        onSelectClassAttendance={(classId) => {
          handleNavigate('attendance');
        }}
        onOpenRoleSwitcher={() => setIsRoleModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* School Switcher Modal (Only for Central Directorate Admin) */}
      {currentUser.role === 'directorate_admin' && (
        <SchoolSwitcherModal
          isOpen={isSchoolSwitcherOpen}
          onClose={() => setIsSchoolSwitcherOpen(false)}
          currentUser={currentUser}
          onSchoolSwitched={(school) => {
            setInspectingSchool(school || null);
            refreshAllData();
            handleNavigate('dashboard');
          }}
          onManageSchools={() => {
            setIsSchoolSwitcherOpen(false);
            setInspectingSchool(null);
            handleNavigate('directorate_schools');
          }}
        />
      )}

      {/* Persistent PWA & Offline Sync Status Banner */}
      <OfflineSyncBanner />
    </div>
  );
}
