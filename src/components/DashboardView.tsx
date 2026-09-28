'use client';

import React from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
} from '@/types';
import { RoleDashboardRouter } from './dashboards/RoleDashboardRouter';

interface DashboardViewProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  notices: OfficialNotice[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onNavigateToStudentReport?: (studentId: string) => void;
  onSelectClassForAttendance?: (classId: string) => void;
  onOpenSocialCase?: (caseId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = (props) => {
  return <RoleDashboardRouter {...props} />;
};
