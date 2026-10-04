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
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-['Cairo']">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">جارٍ تهيئة بوابة ولي الأمر والنتائج...</p>
            </div>
          </div>
        }
      >
        <ParentPageContent />
      </Suspense>
    </ToastProvider>
  );
}
