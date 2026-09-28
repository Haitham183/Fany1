import { describe, it, expect } from 'vitest';
import { computeWeekDays } from '../src/lib/storage';

describe('Design System & Fast Attendance Logic', () => {
  it('should compute 5 work days for sun_to_thu scheme correctly', () => {
    const anchor = new Date('2026-09-28T10:00:00Z'); // Monday
    const weekDays = computeWeekDays(anchor, 'sun_to_thu');

    expect(weekDays).toHaveLength(5);
    expect(weekDays[0].dayOfWeek).toBe('الأحد');
    expect(weekDays[4].dayOfWeek).toBe('الخميس');
  });

  it('should compute 6 work days for sat_to_thu scheme correctly', () => {
    const anchor = new Date('2026-09-28T10:00:00Z');
    const weekDays = computeWeekDays(anchor, 'sat_to_thu');

    expect(weekDays).toHaveLength(6);
    expect(weekDays[0].dayOfWeek).toBe('السبت');
    expect(weekDays[5].dayOfWeek).toBe('الخميس');
  });

  it('should mark today correctly in weekDays list', () => {
    const today = new Date();
    const weekDays = computeWeekDays(today, 'sun_to_thu');
    const todayStr = today.toISOString().split('T')[0];

    const todayMatch = weekDays.find((d) => d.date === todayStr);
    if (todayMatch) {
      expect(todayMatch.isToday).toBe(true);
    }
  });
});
