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
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-['Cairo']">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      }
    >
      <SingleTabContent />
    </Suspense>
  );
}
