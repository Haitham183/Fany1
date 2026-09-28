import { describe, it, expect } from 'vitest';
import { normalizeTabId, TAB_META } from '../src/lib/tabRouter';

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
  });
});
