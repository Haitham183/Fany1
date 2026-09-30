'use client';

import { pushAllDataToCloud, notifySyncStatus } from './supabaseSync';
import { notifyOfflineSyncComplete } from './notificationService';

export interface QueuedOfflineAction {
  id: string;
  type: 'upsert' | 'delete';
  table: string;
  recordId: string;
  data?: any;
  timestamp: string;
}

const OFFLINE_QUEUE_KEY = 'egyptian_school_offline_queue';

export const isDeviceOnline = (): boolean => {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
};

export const getOfflineQueue = (): QueuedOfflineAction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (queue: QueuedOfflineAction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('egyptian_school_offline_queue_update', { detail: { count: queue.length } }));
  } catch (err) {
    console.warn('Failed to persist offline queue:', err);
  }
};

export const enqueueOfflineAction = (action: Omit<QueuedOfflineAction, 'id' | 'timestamp'>) => {
  const currentQueue = getOfflineQueue();
  const newAction: QueuedOfflineAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  // Remove existing redundant queue item for the same record if present
  const filtered = currentQueue.filter(
    (q) => !(q.table === action.table && q.recordId === action.recordId)
  );

  filtered.push(newAction);
  saveOfflineQueue(filtered);
  notifySyncStatus('offline', `تم حفظ العملية محلياً (${filtered.length} معلقة في وضع عدم الاتصال) 📴`);

  // Request Service Worker Background Sync if supported
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      if (reg.sync) {
        reg.sync.register('sync-school-data').catch(() => {});
      }
    }).catch(() => {});
  }
};

export const clearOfflineQueue = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('egyptian_school_offline_queue_update', { detail: { count: 0 } }));
};

/**
 * Flushes all pending offline mutations to the cloud
 */
export const flushOfflineQueue = async (): Promise<{ success: boolean; syncedCount: number }> => {
  if (!isDeviceOnline()) {
    notifySyncStatus('offline', 'الجهاز غير متصل بالإنترنت حالياً 📴');
    return { success: false, syncedCount: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  notifySyncStatus('syncing', `جارٍ مزامنة ${queue.length} عمليات معلقة سحابياً... 🔄`);

  try {
    // Perform full reliable cloud push
    const pushResult = await pushAllDataToCloud();
    if (pushResult.success) {
      const count = queue.length;
      clearOfflineQueue();
      notifySyncStatus('synced', `تمت مزامنة جميع العمليات المعلقة (${count}) بنجاح تام 🟢`);
      
      // Trigger Web Push / Local System Notification for successful offline recovery
      notifyOfflineSyncComplete(count);

      return { success: true, syncedCount: count };
    } else {
      notifySyncStatus('error', 'تعذر إتمام المزامنة السحابية للمعلقات. ستتم المحاولة لاحقاً ⚠️');
      return { success: false, syncedCount: 0 };
    }
  } catch (err) {
    console.error('Offline queue flush error:', err);
    notifySyncStatus('error', 'خطأ في معالجة قائمة العمليات غير المتصلة ⚠️');
    return { success: false, syncedCount: 0 };
  }
};

/**
 * Initializes Offline & Online Network Listeners and Service Worker
 */
export const initOfflineSyncEngine = () => {
  if (typeof window === 'undefined') return;

  // Listen for online recovery
  window.addEventListener('online', () => {
    notifySyncStatus('connected', 'تمت استعادة الاتصال بالإنترنت 🟢 جاري المزامنة...');
    setTimeout(() => {
      flushOfflineQueue();
    }, 1500);
  });

  // Listen for offline drop
  window.addEventListener('offline', () => {
    const queue = getOfflineQueue();
    notifySyncStatus(
      'offline',
      `انقطع الاتصال بالإنترنت 📴 يعمل النظام الآن في وضع عدم الاتصال الآمن (${queue.length} معلقة)`
    );
  });

  // Listen for Service Worker background sync flush trigger
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TRIGGER_OFFLINE_QUEUE_FLUSH') {
        flushOfflineQueue();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Egyptian School TVET PWA Service Worker Active:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    });
  }
};
