import { describe, it, expect } from 'vitest';
import { normalizeTabId, TAB_META, canRoleAccessTab, getDefaultTabForRole } from '../src/lib/tabRouter';

describe('tabRouter & normalizeTabId', () => {
  it('normalizes canonical tab IDs properly', () => {
    expect(normalizeTabId('dashboard')).toBe('dashboard');
    expect(normalizeTabId('attendance')).toBe('attendance');
    expect(normalizeTabId('affairs')).toBe('affairs');
    expect(normalizeTabId('transfers')).toBe('transfers');
    expect(normalizeTabId('competencies')).toBe('competencies');
    expect(normalizeTabId('safety')).toBe('safety');
    expect(normalizeTabId('official_sheets')).toBe('official_sheets');
    expect(normalizeTabId('student_report')).toBe('student_report');
    expect(normalizeTabId('notices')).toBe('notices');
    expect(normalizeTabId('departments')).toBe('departments');
    expect(normalizeTabId('social_portal')).toBe('social_portal');
    expect(normalizeTabId('ai_prediction')).toBe('ai_prediction');
    expect(normalizeTabId('census')).toBe('census');
    expect(normalizeTabId('settings')).toBe('settings');
    expect(normalizeTabId('users')).toBe('users');
    expect(normalizeTabId('class_rosters')).toBe('class_rosters');
    expect(normalizeTabId('parent_portal')).toBe('parent_portal');
  });

  it('correctly normalizes legacy and alternate aliases', () => {
    // Official ministry sheets aliases (دفاتر 41 وسر 1)
    expect(normalizeTabId('ministry_sheets')).toBe('official_sheets');
    expect(normalizeTabId('official_sheets_view')).toBe('official_sheets');
    expect(normalizeTabId('ser1')).toBe('official_sheets');
    expect(normalizeTabId('daftar41')).toBe('official_sheets');
    expect(normalizeTabId('official')).toBe('official_sheets');

    // Student affairs and transfers aliases
    expect(normalizeTabId('student_affairs')).toBe('affairs');
    expect(normalizeTabId('student_transfers')).toBe('transfers');
    expect(normalizeTabId('transfer')).toBe('transfers');

    // Attendance aliases
    expect(normalizeTabId('attendance_taker')).toBe('attendance');
    expect(normalizeTabId('workshop_attendance')).toBe('attendance');

    // Report card aliases
    expect(normalizeTabId('report_card')).toBe('student_report');
    expect(normalizeTabId('student_report_card')).toBe('student_report');
    expect(normalizeTabId('student_card')).toBe('student_report');

    // Workshop safety aliases
    expect(normalizeTabId('workshop_safety')).toBe('safety');
    expect(normalizeTabId('safety_view')).toBe('safety');

    // Department aliases
    expect(normalizeTabId('department_reports')).toBe('departments');
    expect(normalizeTabId('department_stats')).toBe('departments');

    // AI predictions aliases
    expect(normalizeTabId('ai_predictions')).toBe('ai_prediction');
    expect(normalizeTabId('ai_dashboard')).toBe('ai_prediction');

    // Census aliases
    expect(normalizeTabId('daily_census')).toBe('census');
    expect(normalizeTabId('daily_report')).toBe('census');

    // Social portal aliases
    expect(normalizeTabId('social_worker')).toBe('social_portal');
    expect(normalizeTabId('social_cases')).toBe('social_portal');
  });

  it('falls back to dashboard for undefined or empty string', () => {
    expect(normalizeTabId('')).toBe('dashboard');
    expect(normalizeTabId(undefined as any)).toBe('dashboard');
    expect(normalizeTabId('some_unknown_weird_tab')).toBe('dashboard');
  });

  it('has valid metadata for all canonical tabs', () => {
    expect(TAB_META['dashboard'].label).toContain('الرئيسية');
    expect(TAB_META['official_sheets'].label).toContain('الدفاتر');
    expect(TAB_META['student_report'].label).toContain('بطاقة');
    expect(TAB_META['directorate_schools'].label).toContain('شبكة');
    expect(TAB_META['directorate_competencies'].label).toContain('الجدارات');
    expect(TAB_META['directorate_attendance'].label).toContain('مرصد');
  });

  it('normalizes directorate sub-tab aliases', () => {
    expect(normalizeTabId('directorate')).toBe('directorate');
    expect(normalizeTabId('multi_school')).toBe('directorate');
    expect(normalizeTabId('schools_network')).toBe('directorate_schools');
    expect(normalizeTabId('directorate_cbe')).toBe('directorate_competencies');
    expect(normalizeTabId('directorate_census')).toBe('directorate_attendance');
    expect(normalizeTabId('circulars')).toBe('directorate_circulars');
    expect(normalizeTabId('inspection_reports')).toBe('directorate_inspection');
  });
});

describe('Role-Based Tab Access (canRoleAccessTab & getDefaultTabForRole)', () => {
  it('strictly isolates directorate tabs to directorate_admin only', () => {
    const directorateTabs = [
      'directorate',
      'directorate_schools',
      'directorate_competencies',
      'directorate_attendance',
      'directorate_circulars',
      'directorate_inspection',
    ] as const;

    for (const tab of directorateTabs) {
      expect(canRoleAccessTab('directorate_admin', tab)).toBe(true);
      expect(canRoleAccessTab('principal', tab)).toBe(false);
      expect(canRoleAccessTab('system_admin', tab)).toBe(false);
      expect(canRoleAccessTab('affairs_deputy', tab)).toBe(false);
      expect(canRoleAccessTab('affairs_officer', tab)).toBe(false);
      expect(canRoleAccessTab('dept_head', tab)).toBe(false);
      expect(canRoleAccessTab('teacher', tab)).toBe(false);
      expect(canRoleAccessTab('social_worker', tab)).toBe(false);
      expect(canRoleAccessTab('external_verifier', tab)).toBe(false);
    }
  });

  it('enforces zero-leak boundary for external verifiers', () => {
    expect(canRoleAccessTab('external_verifier', 'competencies')).toBe(true);
    expect(canRoleAccessTab('external_verifier', 'departments')).toBe(true);
    expect(canRoleAccessTab('external_verifier', 'dashboard')).toBe(true);

    // Forbidden for external verifier
    expect(canRoleAccessTab('external_verifier', 'settings')).toBe(false);
    expect(canRoleAccessTab('external_verifier', 'users')).toBe(false);
    expect(canRoleAccessTab('external_verifier', 'affairs')).toBe(false);
    expect(canRoleAccessTab('external_verifier', 'official_sheets')).toBe(false);
    expect(canRoleAccessTab('external_verifier', 'social_portal')).toBe(false);
  });

  it('enforces boundaries for system_admin and teachers', () => {
    // System admin only IT and config
    expect(canRoleAccessTab('system_admin', 'users')).toBe(true);
    expect(canRoleAccessTab('system_admin', 'settings')).toBe(true);
    expect(canRoleAccessTab('system_admin', 'competencies')).toBe(false);
    expect(canRoleAccessTab('system_admin', 'official_sheets')).toBe(false);

    // Teachers only educational, attendance and workshops
    expect(canRoleAccessTab('teacher', 'attendance')).toBe(true);
    expect(canRoleAccessTab('teacher', 'competencies')).toBe(true);
    expect(canRoleAccessTab('teacher', 'safety')).toBe(true);
    expect(canRoleAccessTab('teacher', 'settings')).toBe(false);
    expect(canRoleAccessTab('teacher', 'users')).toBe(false);
  });

  it('returns correct default landing tab for each role', () => {
    expect(getDefaultTabForRole('directorate_admin')).toBe('directorate');
    expect(getDefaultTabForRole('teacher')).toBe('attendance');
    expect(getDefaultTabForRole('dept_head')).toBe('departments');
    expect(getDefaultTabForRole('external_verifier')).toBe('competencies');
    expect(getDefaultTabForRole('social_worker')).toBe('social_portal');
    expect(getDefaultTabForRole('affairs_deputy')).toBe('affairs');
    expect(getDefaultTabForRole('affairs_officer')).toBe('affairs');
    expect(getDefaultTabForRole('parent')).toBe('parent_portal');
    expect(getDefaultTabForRole('principal')).toBe('dashboard');
    expect(getDefaultTabForRole('system_admin')).toBe('dashboard');
  });
});
