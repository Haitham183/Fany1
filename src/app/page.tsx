'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  SchoolConfig,
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
  resetToDefaultData,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
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
import { initOfflineSyncEngine } from '@/lib/offlineSyncEngine';
import { PortalSelectionScreen } from '@/components/PortalSelectionScreen';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';
import { PortalType, SocialCaseRecord } from '@/types';
import { ToastProvider } from '@/components/ui';

export default function HomePage() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}

function MainAppContent() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isParentPortalOpen, setIsParentPortalOpen] = useState<boolean>(false);
  const [activePortal, setActivePortal] = useState<PortalType | null>(null);
  const [currentUser, setCurrentUserState] = useState<User>(() => getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<OfficialNotice[]>([]);
  const [socialCases, setSocialCases] = useState<SocialCaseRecord[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string | undefined>(undefined);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const isFullAdmin =
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

    window.addEventListener('egyptian_school_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('egyptian_school_storage_update', handleStorageUpdate);
      cleanupRealtime();
    };
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setCurrentUserState(user);

    if (user.role === 'teacher') {
      setActiveTab('attendance');
    } else if (user.role === 'dept_head') {
      setActiveTab('departments');
    } else if (user.role === 'external_verifier' || !!user.isInternalVerifier) {
      setActiveTab('competencies');
    } else if (user.role === 'social_worker') {
      setActiveTab('social_portal');
    } else if (user.role === 'affairs_deputy' || user.role === 'affairs_officer') {
      setActiveTab('affairs');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setActivePortal(null);
    setIsParentPortalOpen(false);
  };

  const handleSwitchPortal = () => {
    logout();
    setIsAuthenticated(false);
    setActivePortal(null);
    setIsParentPortalOpen(false);
  };

  const handlePortalLoginSuccess = (user: User, portal: PortalType) => {
    setCurrentUserState(user);
    setActivePortal(portal);
    setIsAuthenticated(true);
    setIsParentPortalOpen(false);

    if (portal === 'teacher' || user.role === 'teacher') {
      setActiveTab('attendance');
    } else if (portal === 'dept_head' || user.role === 'dept_head') {
      setActiveTab('departments');
    } else if (portal === 'competencies' || !!user.isInternalVerifier) {
      setActiveTab('competencies');
    } else if (portal === 'social_worker' || user.role === 'social_worker') {
      setActiveTab('social_portal');
    } else if (portal === 'affairs' || user.role === 'affairs_deputy' || user.role === 'affairs_officer') {
      setActiveTab('affairs');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleResetData = () => {
    if (window.confirm('تحذير إداري: هل ترغب في إعادة تهيئة قاعدة البيانات وضبط المصنع؟')) {
      resetToDefaultData();
      refreshAllData();
    }
  };

  if (!isClient || !schoolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-['Cairo']">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-300">جارٍ تحميل المنظومة المدرسية...</p>
        </div>
      </div>
    );
  }

  // If Parent Portal is opened by unauthenticated guest (parent/student)
  if (isParentPortalOpen && !isAuthenticated) {
    return (
      <ParentPortalView
        onBackToLogin={() => setIsParentPortalOpen(false)}
        isStandalone={true}
      />
    );
  }

  // If not authenticated, show Unified Portal Selection Landing Screen
  if (!isAuthenticated) {
    return (
      <PortalSelectionScreen
        schoolConfig={schoolConfig}
        users={users}
        onSelectParentPortal={() => setIsParentPortalOpen(true)}
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
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onOpenParentPortal={() => setActiveTab('parent_portal')}
        activePortal={activePortal || undefined}
        onSwitchPortal={handleSwitchPortal}
        students={students}
        classes={authorizedClasses}
        departments={authorizedDepartments}
        onSelectStudentReport={(studentId) => {
          setSelectedReportStudentId(studentId);
          setActiveTab('student_report');
        }}
        onSelectStudentAttendance={(classId) => {
          setActiveTab('attendance');
        }}
      />

      {/* Main Layout: Sidebar on Right (RTL) + Scrollable Main Content */}
      <div className="flex flex-1 min-h-0 relative max-w-full overflow-hidden">
        {/* Right Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
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
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-y-auto custom-scrollbar transition-all duration-300">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={authorizedStudents}
              departments={authorizedDepartments}
              classes={authorizedClasses}
              notices={notices}
              attendance={attendance}
              currentUser={currentUser}
              onNavigate={(tab) => setActiveTab(tab)}
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
                setActiveTab('notices');
              }}
              onNavigateToStudentReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                setActiveTab('student_report');
              }}
              onNavigateToSocialPortal={() => {
                setActiveTab('social_portal');
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
                setActiveTab('student_report');
              }}
              onNavigateToAiPredictions={() => setActiveTab('ai_prediction')}
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
              onNavigateToNotices={() => setActiveTab('notices')}
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

          {activeTab === 'affairs' && (
            <StudentAffairsView
              students={authorizedStudents}
              classes={authorizedClasses}
              departments={authorizedDepartments}
              attendance={attendance}
              currentUser={currentUser}
              onDataChanged={refreshAllData}
              onNavigateToReport={(studentId) => {
                setSelectedReportStudentId(studentId);
                setActiveTab('student_report');
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

          {activeTab === 'ministry_sheets' && (
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

          {activeTab === 'parent_portal' && (
            <ParentPortalView
              onBackToLogin={() => setActiveTab('dashboard')}
              isStandalone={false}
            />
          )}

          {/* Signature Footer */}
          <DeveloperCreditFooter className="mt-10 pb-4" />
        </main>
      </div>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
