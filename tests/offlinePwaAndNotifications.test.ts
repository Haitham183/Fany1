import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { db } from '../src/lib/db';

// Setup browser globals for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value.toString();
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  },
};

beforeAll(() => {
  if (typeof global.window === 'undefined') {
    (global as any).window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
  }
  if (typeof global.localStorage === 'undefined') {
    (global as any).localStorage = localStorageMock;
  }
  if (typeof global.navigator === 'undefined') {
    (global as any).navigator = {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({ scope: '/' }),
        addEventListener: vi.fn(),
        ready: Promise.resolve({
          showNotification: vi.fn().mockResolvedValue(true),
        }),
      },
    };
  }
  if (typeof global.CustomEvent === 'undefined') {
    (global as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params?: { detail: any }) {
        this.type = type;
        this.detail = params?.detail;
      }
    };
  }

  // Mock Dexie media_evidence table in-memory for testing
  const mockEvidenceList: any[] = [];
  (db as any).media_evidence = {
    put: vi.fn().mockImplementation(async (item: any) => {
      const idx = mockEvidenceList.findIndex((x) => x.id === item.id);
      if (idx >= 0) mockEvidenceList[idx] = item;
      else mockEvidenceList.push(item);
      return item.id;
    }),
    toCollection: vi.fn().mockReturnValue({
      toArray: vi.fn().mockImplementation(async () => [...mockEvidenceList]),
    }),
    delete: vi.fn().mockImplementation(async (id: string) => {
      const idx = mockEvidenceList.findIndex((x) => x.id === id);
      if (idx >= 0) mockEvidenceList.splice(idx, 1);
      return true;
    }),
  };
});

import {
  isNotificationSupported,
  getNotificationPermission,
  notifySevereAbsenceWarning,
  notifyWorkshopSafetyAlert,
  notifyOfflineSyncComplete,
} from '../src/lib/notificationService';
import {
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
  isDeviceOnline,
} from '../src/lib/offlineSyncEngine';
import {
  saveOfflineMediaEvidence,
  getOfflineMediaEvidence,
  deleteOfflineMediaEvidence,
} from '../src/lib/offlineMediaStorage';

describe('Offline PWA Engine, Media Storage & Notification System (Item #6)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearOfflineQueue();
  });

  it('correctly handles offline queue operations (enqueue, get, clear)', () => {
    expect(getOfflineQueue()).toEqual([]);

    enqueueOfflineAction({
      type: 'upsert',
      table: 'attendance_records',
      recordId: 'att_123',
      data: { status: 'absent', date: '2026-10-01' },
    });

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].recordId).toBe('att_123');
    expect(queue[0].table).toBe('attendance_records');

    clearOfflineQueue();
    expect(getOfflineQueue()).toEqual([]);
  });

  it('safely handles notification permission queries and triggers', () => {
    const permission = getNotificationPermission();
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(permission);

    // Call triggers to ensure no runtime errors thrown
    expect(() => {
      notifySevereAbsenceWarning('محمد أحمد علي', 10, 'إنذار أول قانوني');
      notifyWorkshopSafetyAlert('علي حسن إبراهيم', 'عدم ارتداء نظارة الحماية أثناء اللحام', 'قسم اللحام وتشكيل المعادن');
      notifyOfflineSyncComplete(3);
    }).not.toThrow();
  });

  it('safely saves and queries offline media evidence in IndexedDB', async () => {
    const evidence = await saveOfflineMediaEvidence({
      category: 'workshop_product',
      title: 'قطعة تشغيل خراطة - تمرين 1',
      studentId: 'stu_1',
      classId: 'class_1_mach',
      departmentId: 'dept_mechanics',
      mimeType: 'image/jpeg',
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
      fileSize: 1024,
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.category).toBe('workshop_product');
    expect(evidence.isSynced).toBe(false);

    const queried = await getOfflineMediaEvidence({ studentId: 'stu_1' });
    expect(Array.isArray(queried)).toBe(true);

    const deleted = await deleteOfflineMediaEvidence(evidence.id);
    expect(typeof deleted).toBe('boolean');
  });

  it('accurately reports device connectivity state', () => {
    const online = isDeviceOnline();
    expect(typeof online).toBe('boolean');
    expect(online).toBe(true);
  });
});
