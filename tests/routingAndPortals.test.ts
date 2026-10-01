import { describe, it, expect } from 'vitest';
import {
  tabToPath,
  pathToTab,
  normalizeTabId,
  canRoleAccessTab,
  getDefaultTabForRole,
  CanonicalTabId,
} from '../src/lib/tabRouter';
import { UserRole } from '../src/types';

describe('Dedicated Portal Routes & URL Architecture', () => {
  const routes: { tab: CanonicalTabId; expectedPath: string }[] = [
    { tab: 'directorate', expectedPath: '/directorate' },
    { tab: 'directorate_schools', expectedPath: '/directorate/schools' },
    { tab: 'directorate_competencies', expectedPath: '/directorate/competencies' },
    { tab: 'directorate_attendance', expectedPath: '/directorate/attendance' },
    { tab: 'directorate_circulars', expectedPath: '/directorate/circulars' },
    { tab: 'directorate_inspection', expectedPath: '/directorate/inspection' },
    { tab: 'dashboard', expectedPath: '/dashboard' },
    { tab: 'attendance', expectedPath: '/attendance' },
    { tab: 'competencies', expectedPath: '/competencies' },
    { tab: 'safety', expectedPath: '/safety' },
    { tab: 'affairs', expectedPath: '/affairs' },
    { tab: 'transfers', expectedPath: '/transfers' },
    { tab: 'class_rosters', expectedPath: '/class-rosters' },
    { tab: 'student_report', expectedPath: '/student-report' },
    { tab: 'official_sheets', expectedPath: '/official-sheets' },
    { tab: 'notices', expectedPath: '/notices' },
    { tab: 'departments', expectedPath: '/departments' },
    { tab: 'census', expectedPath: '/census' },
    { tab: 'social_portal', expectedPath: '/social' },
    { tab: 'ai_prediction', expectedPath: '/ai-prediction' },
    { tab: 'settings', expectedPath: '/settings' },
    { tab: 'users', expectedPath: '/users' },
    { tab: 'parent_portal', expectedPath: '/parent' },
  ];

  it('generates unique, professional URL routes for all 23 portals and windows', () => {
    const paths = routes.map((r) => tabToPath(r.tab));
    // Verify each route matches its expected clean path
    routes.forEach((r) => {
      expect(tabToPath(r.tab)).toBe(r.expectedPath);
    });

    // Ensure all URL paths are unique
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(routes.length);
  });

  it('provides lossless bidirectional route mapping (tab -> path -> tab)', () => {
    routes.forEach(({ tab, expectedPath }) => {
      const path = tabToPath(tab);
      const parsedTab = pathToTab(path);
      expect(parsedTab).toBe(tab);
    });
  });

  it('correctly maps human-readable browser URL paths to canonical internal tabs', () => {
    expect(pathToTab('/directorate')).toBe('directorate');
    expect(pathToTab('/directorate/schools')).toBe('directorate_schools');
    expect(pathToTab('/directorate/competencies')).toBe('directorate_competencies');
    expect(pathToTab('/directorate/attendance')).toBe('directorate_attendance');
    expect(pathToTab('/directorate/circulars')).toBe('directorate_circulars');
    expect(pathToTab('/directorate/inspection')).toBe('directorate_inspection');
    expect(pathToTab('/dashboard')).toBe('dashboard');
    expect(pathToTab('/attendance')).toBe('attendance');
    expect(pathToTab('/competencies')).toBe('competencies');
    expect(pathToTab('/safety')).toBe('safety');
    expect(pathToTab('/affairs')).toBe('affairs');
    expect(pathToTab('/transfers')).toBe('transfers');
    expect(pathToTab('/class-rosters')).toBe('class_rosters');
    expect(pathToTab('/student-report')).toBe('student_report');
    expect(pathToTab('/official-sheets')).toBe('official_sheets');
    expect(pathToTab('/notices')).toBe('notices');
    expect(pathToTab('/departments')).toBe('departments');
    expect(pathToTab('/census')).toBe('census');
    expect(pathToTab('/social')).toBe('social_portal');
    expect(pathToTab('/ai-prediction')).toBe('ai_prediction');
    expect(pathToTab('/settings')).toBe('settings');
    expect(pathToTab('/users')).toBe('users');
    expect(pathToTab('/parent')).toBe('parent_portal');
  });

  it('handles route aliases, trailing slashes, and case insensitivity seamlessly', () => {
    expect(pathToTab('/ATTENDANCE/')).toBe('attendance');
    expect(pathToTab('/Directorate/Schools/')).toBe('directorate_schools');
    expect(pathToTab('/student-affairs')).toBe('affairs');
    expect(pathToTab('/rosters')).toBe('class_rosters');
    expect(pathToTab('/social-portal')).toBe('social_portal');
    expect(pathToTab('/cbe')).toBe('competencies');
    expect(pathToTab('/parent-portal')).toBe('parent_portal');
  });

  it('maps each role to its proper canonical landing URL on login', () => {
    const roleExpectedUrl: Record<UserRole, string> = {
      directorate_admin: '/directorate',
      teacher: '/attendance',
      dept_head: '/departments',
      external_verifier: '/competencies',
      social_worker: '/social',
      affairs_deputy: '/affairs',
      affairs_officer: '/affairs',
      parent: '/parent',
      principal: '/dashboard',
      system_admin: '/dashboard',
    };

    (Object.keys(roleExpectedUrl) as UserRole[]).forEach((role) => {
      const defaultTab = getDefaultTabForRole(role);
      const url = tabToPath(defaultTab);
      expect(url).toBe(roleExpectedUrl[role]);
    });
  });

  it('strictly protects route access by user role on direct URL visits', () => {
    // Non-directorate user visits /directorate
    expect(canRoleAccessTab('teacher', pathToTab('/directorate'))).toBe(false);
    expect(canRoleAccessTab('principal', pathToTab('/directorate/schools'))).toBe(false);
    expect(canRoleAccessTab('social_worker', pathToTab('/directorate/inspection'))).toBe(false);

    // Only directorate_admin can access directorate routes
    expect(canRoleAccessTab('directorate_admin', pathToTab('/directorate'))).toBe(true);
    expect(canRoleAccessTab('directorate_admin', pathToTab('/directorate/schools'))).toBe(true);

    // Teacher visits admin settings
    expect(canRoleAccessTab('teacher', pathToTab('/settings'))).toBe(false);
    expect(canRoleAccessTab('teacher', pathToTab('/users'))).toBe(false);

    // Teacher visits authorized workshop tabs
    expect(canRoleAccessTab('teacher', pathToTab('/attendance'))).toBe(true);
    expect(canRoleAccessTab('teacher', pathToTab('/competencies'))).toBe(true);
    expect(canRoleAccessTab('teacher', pathToTab('/safety'))).toBe(true);
  });
});
