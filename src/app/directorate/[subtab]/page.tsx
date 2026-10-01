'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PortalLayoutShell } from '@/components/PortalLayoutShell';
import { CanonicalTabId } from '@/lib/tabRouter';

export default function DirectorateSubTabPage() {
  const params = useParams();
  const rawSubTab = typeof params?.subtab === 'string' ? params.subtab.toLowerCase() : '';

  let mappedTab: CanonicalTabId = 'directorate';
  if (rawSubTab === 'schools') {
    mappedTab = 'directorate_schools';
  } else if (rawSubTab === 'competencies' || rawSubTab === 'cbe') {
    mappedTab = 'directorate_competencies';
  } else if (rawSubTab === 'attendance' || rawSubTab === 'census') {
    mappedTab = 'directorate_attendance';
  } else if (rawSubTab === 'circulars') {
    mappedTab = 'directorate_circulars';
  } else if (rawSubTab === 'inspection') {
    mappedTab = 'directorate_inspection';
  }

  return <PortalLayoutShell initialTab={mappedTab} initialSubTab={rawSubTab} />;
}
