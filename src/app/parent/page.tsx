'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ParentPortalView } from '@/components/ParentPortalView';
import { ToastProvider } from '@/components/ui';
import { getCurrentUser } from '@/lib/storage';

function ParentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramStudentId = searchParams?.get('studentId') || undefined;

  let authStudentId: string | undefined = undefined;
  if (typeof window !== 'undefined') {
    try {
      const u = getCurrentUser();
      if (u && u.role === 'parent' && u.id.startsWith('parent_')) {
        authStudentId = u.id.replace('parent_', '');
      }
    } catch {
      // non-blocking
    }
  }

  const effectiveStudentId = paramStudentId || authStudentId;

  return (
    <ParentPortalView
      initialStudentId={effectiveStudentId}
      onBackToLogin={() => router.push('/')}
      isStandalone={true}
    />
  );
}

export default function StandaloneParentPage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800 font-['Cairo'] transition-opacity duration-200">
            <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">جارٍ تهيئة بوابة ولي الأمر والنتائج...</p>
            </div>
          </div>
        }
      >
        <ParentPageContent />
      </Suspense>
    </ToastProvider>
  );
}
