'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PortalLayoutShell } from '@/components/PortalLayoutShell';
import { pathToTab } from '@/lib/tabRouter';

function SingleTabContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const rawTab = typeof params?.tab === 'string' ? params.tab : '';
  const canonicalTab = pathToTab(rawTab);
  const studentId = searchParams?.get('id') || undefined;

  return (
    <PortalLayoutShell
      initialTab={canonicalTab}
      initialStudentId={studentId}
    />
  );
}

export default function SingleTabRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-['Cairo'] transition-opacity duration-200">
          <div className="text-center space-y-3 p-6 rounded-2xl bg-white shadow-sm border border-slate-200/80">
            <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-600">جارٍ تجهيز مساحة العمل...</p>
          </div>
        </div>
      }
    >
      <SingleTabContent />
    </Suspense>
  );
}
