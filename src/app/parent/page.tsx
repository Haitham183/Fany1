'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ParentPortalView } from '@/components/ParentPortalView';
import { ToastProvider } from '@/components/ui';

export default function StandaloneParentPage() {
  const router = useRouter();

  return (
    <ToastProvider>
      <ParentPortalView
        onBackToLogin={() => router.push('/')}
        isStandalone={true}
      />
    </ToastProvider>
  );
}
