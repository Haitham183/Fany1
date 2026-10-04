'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, SchoolConfig, PortalType } from '@/types';
import {
  initializeData,
  getCurrentUser,
  getUsers,
  getSchoolConfig,
  getIsAuthenticated,
  setCurrentUser,
} from '@/lib/storage';
import { PortalSelectionScreen } from '@/components/PortalSelectionScreen';
import { ToastProvider } from '@/components/ui';
import { getDefaultTabForRole, tabToPath } from '@/lib/tabRouter';

export default function RootHomePage() {
  return (
    <ToastProvider>
      <GatewayContent />
    </ToastProvider>
  );
}

function GatewayContent() {
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(() => typeof window !== 'undefined');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return getIsAuthenticated();
  });
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(() => {
    if (typeof window === 'undefined') return null;
    return getSchoolConfig();
  });
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return [];
    return getUsers();
  });

  useEffect(() => {
    setIsClient(true);
    initializeData();
    const authed = getIsAuthenticated();
    setIsAuthenticated(authed);
    setSchoolConfig(getSchoolConfig());
    setUsers(getUsers());

    // If authenticated, forward to role default tab
    if (authed) {
      const user = getCurrentUser();
      const defaultTab = getDefaultTabForRole(user.role || 'principal');
      const targetPath = tabToPath(defaultTab);
      router.replace(targetPath);
    }
  }, [router]);

  const handlePortalLoginSuccess = (user: User, portal: PortalType) => {
    setCurrentUser(user);
    setIsAuthenticated(true);

    if (portal === 'parent' || user.role === 'parent') {
      const studentId = user.id.replace('parent_', '');
      router.push(`/parent?studentId=${studentId}`);
    } else if (portal === 'directorate' || user.role === 'directorate_admin') {
      router.push('/directorate');
    } else if (portal === 'principal' || user.role === 'principal') {
      router.push('/dashboard');
    } else if (portal === 'teacher' || user.role === 'teacher') {
      router.push('/attendance');
    } else if (portal === 'dept_head' || user.role === 'dept_head') {
      router.push('/departments');
    } else if (portal === 'competencies' || !!user.isInternalVerifier) {
      router.push('/competencies');
    } else if (portal === 'social_worker' || user.role === 'social_worker') {
      router.push('/social');
    } else if (portal === 'affairs' || user.role === 'affairs_deputy' || user.role === 'affairs_officer') {
      router.push('/affairs');
    } else {
      router.push('/dashboard');
    }
  };

  if (!isClient || !schoolConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-['Cairo'] transition-opacity duration-200">
        <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">جارٍ تهيئة بوابة المدارس الفنية المصرية...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show redirecting indicator matching light theme
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-['Cairo'] transition-opacity duration-200">
        <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-700">جارٍ الانتقال إلى مساحة العمل المصرح بها...</p>
        </div>
      </div>
    );
  }

  return (
    <PortalSelectionScreen
      schoolConfig={schoolConfig}
      users={users}
      onSelectParentPortal={() => router.push('/parent')}
      onLoginSuccess={handlePortalLoginSuccess}
    />
  );
}
