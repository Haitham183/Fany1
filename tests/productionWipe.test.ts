import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  wipeDatabaseForProduction,
  resetToDemoData,
  getStudents,
  getAttendance,
  getNotices,
  getWorkshopViolations,
  getCompetencyAssessments,
  getUsers,
  getDepartments,
  getClasses,
  getSchoolConfig,
} from '../src/lib/storage';

describe('Factory Reset & Production Database Wipe', () => {
  beforeEach(() => {
    // Mock window.location.reload
    if (typeof window !== 'undefined') {
      window.location.reload = vi.fn() as any;
    }
  });

  it('wipes all student and operational records cleanly for production deployment', async () => {
    await wipeDatabaseForProduction();

    // Students must be 0
    const students = getStudents();
    expect(students.length).toBe(0);

    // Attendance, notices, violations, assessments must be empty
    expect(getAttendance().length).toBe(0);
    expect(getNotices().length).toBe(0);
    expect(getWorkshopViolations().length).toBe(0);
    expect(getCompetencyAssessments().length).toBe(0);

    // Administrative accounts must remain for system login
    const users = getUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(users.some((u) => u.username === 'admin')).toBe(true);

    // Departments & Classes structure should remain with 0 count
    const depts = getDepartments();
    expect(depts.length).toBeGreaterThan(0);
    expect(depts.every((d) => (d.totalStudents || 0) === 0)).toBe(true);

    const classes = getClasses();
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.every((c) => (c.studentCount || 0) === 0)).toBe(true);

    // School config must remain intact
    const config = getSchoolConfig();
    expect(config.warning1ConsecutiveDays).toBe(5);
    expect(config.warning1TotalDays).toBe(10);
    expect(config.expulsionConsecutiveDays).toBe(15);
    expect(config.expulsionTotalDays).toBe(30);
  });

  it('allows restoring demo data for testing when requested', async () => {
    await resetToDemoData();

    const users = getUsers();
    expect(users.length).toBeGreaterThan(0);
  });
});
