'use client';

import React, { useState, useEffect } from 'react';
import {
  isDeviceOnline,
  getOfflineQueue,
  flushOfflineQueue,
  QueuedOfflineAction,
} from '@/lib/offlineSyncEngine';
import {
  getCurrentSyncStatus,
  SyncStatusDetail,
} from '@/lib/supabaseSync';
import {
  getNotificationPermission,
  requestNotificationPermission,
  NotificationPermissionState,
} from '@/lib/notificationService';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Bell,
  X,
  ChevronUp,
  ChevronDown,
  HardDrive,
  Cloud,
} from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatusDetail>(() => getCurrentSyncStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default');

  useEffect(() => {
    setIsOnline(isDeviceOnline());
    setQueueCount(getOfflineQueue().length);
    setNotifPermission(getNotificationPermission());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleQueueUpdate = (e: any) => {
      if (typeof e.detail?.count === 'number') {
        setQueueCount(e.detail.count);
      }
    };

    const handleSyncStatusUpdate = (e: any) => {
      if (e.detail) {
        setSyncStatus(e.detail);
        if (e.detail.status === 'syncing') {
          setIsSyncing(true);
        } else {
          setIsSyncing(false);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('egyptian_school_offline_queue_update', handleQueueUpdate as EventListener);
    window.addEventListener('egyptian_school_sync_status', handleSyncStatusUpdate as EventListener);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('egyptian_school_offline_queue_update', handleQueueUpdate as EventListener);
      window.removeEventListener('egyptian_school_sync_status', handleSyncStatusUpdate as EventListener);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await flushOfflineQueue();
    } finally {
      setIsSyncing(false);
      setQueueCount(getOfflineQueue().length);
    }
  };

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  // If online and 0 pending items and sync is clean, hide the bar or show minimized pill
  const hasPendingWork = !isOnline || queueCount > 0 || isSyncing;

  if (isDismissed && !hasPendingWork) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 z-50 transition-all duration-300 max-w-sm w-full print:hidden"
    >
      <div
        className={`rounded-2xl shadow-2xl border backdrop-blur-md overflow-hidden transition-all duration-300 ${
          !isOnline
            ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 shadow-amber-900/40'
            : isSyncing
            ? 'bg-sky-950/90 border-sky-500/50 text-sky-100 shadow-sky-900/40'
            : queueCount > 0
            ? 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100 shadow-indigo-900/40'
            : 'bg-slate-900/90 border-slate-700/50 text-slate-100 shadow-slate-950/50'
        }`}
      >
        {/* Main Bar Header */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Status Pulse Indicator */}
            <div className="relative flex items-center justify-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  !isOnline
                    ? 'bg-amber-400 animate-pulse'
                    : isSyncing
                    ? 'bg-sky-400 animate-ping'
                    : queueCount > 0
                    ? 'bg-indigo-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span
                className={`absolute w-3 h-3 rounded-full opacity-75 ${
                  !isOnline ? 'bg-amber-500' : isSyncing ? 'bg-sky-500' : queueCount > 0 ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>وضع العمل دون إنترنت (Offline)</span>
                  </>
                ) : isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin flex-shrink-0" />
                    <span>جارٍ المزامنة السحابية...</span>
                  </>
                ) : queueCount > 0 ? (
                  <>
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{queueCount} عمليات محفوظة محلياً</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>المنظومة متصلة وسحابية 🟢</span>
                  </>
                )}
              </div>
              <p className="text-[10px] opacity-80 truncate">
                {!isOnline
                  ? 'البيانات تُحفظ تلقائياً في IndexedDB المحلي'
                  : syncStatus.message || 'التعديلات متزامنة بالكامل'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isOnline && queueCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                title="مزامنة التعديلات المعلقة الآن"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>مزامنة ({queueCount})</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!hasPendingWork && (
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Details Tray */}
        {isExpanded && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-white/10 text-xs space-y-2.5 bg-black/20">
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/60 block text-[10px]">حالة الاتصال</span>
                <span className="font-bold flex items-center gap-1 mt-0.5">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400" />
                      متصل بالشبكة
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-400" />
                      غير متصل (ميداني)
                    </>
                  )}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/60 block text-[10px]">العمليات المعلقة</span>
                <span className="font-bold flex items-center gap-1 mt-0.5">
                  <HardDrive className="w-3 h-3 text-indigo-400" />
                  {queueCount} عملية
                </span>
              </div>
            </div>

            {/* Notification Permission Callout if default */}
            {notifPermission === 'default' && (
              <div className="p-2 rounded-xl bg-indigo-900/40 border border-indigo-400/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Bell className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
                  <span className="text-indigo-200">تفعيل إشعارات الغياب والسلامة</span>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
                >
                  تفعيل
                </button>
              </div>
            )}

            <p className="text-[10px] text-white/60 text-center leading-relaxed">
              💡 جميع البيانات ورصد درجات الجدارات والغياب ومخالفات الورش تُسجل وتُشفر محلياً وتُرفع تلقائياً عند استعادة الاتصال.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
