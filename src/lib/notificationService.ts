'use client';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Checks if browser/device supports Web Notifications API.
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Gets the current notification permission state.
 */
export const getNotificationPermission = (): NotificationPermissionState => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Requests notification permission from the user.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
};

export interface SystemNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  requireInteraction?: boolean;
}

/**
 * Displays a rich desktop/mobile system notification.
 */
export const showSystemNotification = async (
  title: string,
  options: SystemNotificationOptions
): Promise<boolean> => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icon.svg',
    badge: '/icon.svg',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [150, 80, 150],
    ...options,
  };

  try {
    // If Service Worker is registered, use its showNotification (works on Android PWA even in background)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Fallback to standard window Notification
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Failed to show system notification:', err);
    return false;
  }
};

/**
 * Triggered for high-risk legal attendance notices (e.g. Warning 1, 2, Expulsion under Law 139).
 */
export const notifySevereAbsenceWarning = (studentName: string, days: number, noticeType: string) => {
  return showSystemNotification('🚨 تنبيه غياب قانوني عاجل', {
    body: `تجاوز الطالب/ ${studentName} نسبة الغياب الرسمية (${days} يوم غياب) - تقرر إصدار: ${noticeType}`,
    tag: `absence_${studentName}_${Date.now()}`,
    requireInteraction: true,
  });
};

/**
 * Triggered for critical workshop safety and machine violations.
 */
export const notifyWorkshopSafetyAlert = (studentName: string, violationType: string, departmentName?: string) => {
  return showSystemNotification('⚠️ مخالفة سلامة وصحة مهنية بالورش', {
    body: `طالب: ${studentName} | القسم: ${departmentName || 'الورش الصناعية'} | المخالفة: ${violationType}`,
    tag: `workshop_safety_${Date.now()}`,
  });
};

/**
 * Triggered when connectivity is recovered and offline mutations are synced.
 */
export const notifyOfflineSyncComplete = (syncedCount: number) => {
  return showSystemNotification('🟢 تمت المزامنة السحابية بنجاح', {
    body: `تم رفع ومزامنة ${syncedCount} من العمليات الميدانية المعلقة بنجاح تام إلى قاعدة البيانات السحابية.`,
    tag: 'offline_sync_recovery',
  });
};
