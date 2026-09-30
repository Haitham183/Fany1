import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSchools,
  getActiveSchoolId,
  getActiveSchool,
  setActiveSchoolId,
  saveSchool,
  deleteSchool,
  getSchoolConfig,
  saveSchoolConfig,
} from '../src/lib/storage';
import { DEFAULT_SCHOOLS } from '../src/lib/mockData';

// Mock in-memory storage for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
};

if (typeof global !== 'undefined') {
  (global as any).localStorage = localStorageMock;
  (global as any).window = (global as any).window || {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

describe('Multi-School Tenancy System', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with default Egyptian technical schools', () => {
    const schools = getSchools();
    expect(schools.length).toBeGreaterThanOrEqual(3);
    expect(schools.some((s) => s.id === 'sch_cairo_abbassia')).toBe(true);
    expect(schools.some((s) => s.id === 'sch_giza_imaba')).toBe(true);
    expect(schools.some((s) => s.id === 'sch_alex_tousson')).toBe(true);
  });

  it('should return active school and default to primary school', () => {
    const activeId = getActiveSchoolId();
    expect(activeId).toBe('sch_cairo_abbassia');

    const activeSchool = getActiveSchool();
    expect(activeSchool).toBeDefined();
    expect(activeSchool?.name).toContain('العباسية');
  });

  it('should seamlessly switch active school and sync school config', () => {
    const success = setActiveSchoolId('sch_giza_imaba');
    expect(success).toBe(true);
    expect(getActiveSchoolId()).toBe('sch_giza_imaba');

    const activeSchool = getActiveSchool();
    expect(activeSchool?.id).toBe('sch_giza_imaba');
    expect(activeSchool?.directorate).toContain('الجيزة');

    // School config should automatically reflect active school metadata
    const config = getSchoolConfig();
    expect(config.name).toBe(activeSchool?.name);
    expect(config.directorate).toBe(activeSchool?.directorate);
  });

  it('should create and save a new technical school tenant', () => {
    const newSchool = saveSchool({
      name: 'مدرسة بورسعيد الفنية الصناعية المتقدمة',
      code: 'PORT_IND_01',
      directorate: 'مديرية التربية والتعليم ببورسعيد',
      administration: 'إدارة شرق بورسعيد التعليمية',
      systemType: '5_years_advanced',
      shiftType: 'single_morning',
      workDaysScheme: 'sun_to_thu',
      principalName: 'م. عصام فوزي',
      phone: '0663456789',
      address: 'بورسعيد - حي الشرق',
      isActive: true,
    });

    expect(newSchool.id).toBeDefined();
    expect(newSchool.code).toBe('PORT_IND_01');

    const schools = getSchools();
    expect(schools.some((s) => s.code === 'PORT_IND_01')).toBe(true);

    // Switch to newly created school
    setActiveSchoolId(newSchool.id);
    expect(getActiveSchoolId()).toBe(newSchool.id);
    expect(getActiveSchool()?.name).toBe('مدرسة بورسعيد الفنية الصناعية المتقدمة');
  });

  it('should safely delete a non-last school and fallback active ID if needed', () => {
    const schoolsBefore = getSchools();
    const targetToDelete = schoolsBefore[schoolsBefore.length - 1];

    setActiveSchoolId(targetToDelete.id);
    expect(getActiveSchoolId()).toBe(targetToDelete.id);

    const deleted = deleteSchool(targetToDelete.id);
    expect(deleted).toBe(true);

    const schoolsAfter = getSchools();
    expect(schoolsAfter.some((s) => s.id === targetToDelete.id)).toBe(false);

    // Should automatically fallback to remaining active school
    expect(getActiveSchoolId()).not.toBe(targetToDelete.id);
  });
});
