'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldAlert,
  ArrowRight,
  Clock,
  User,
  Activity,
  X,
  FileCode,
} from 'lucide-react';
import { AuditLogEntry } from '@/lib/server/audit/auditLogger';

interface AuditLogsViewProps {
  currentUserRole: string;
  currentSchoolId?: string | null;
}

export function AuditLogsView({ currentUserRole, currentSchoolId }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = '/api/admin/audit-logs';
      const params = new URLSearchParams();
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (selectedResource !== 'all') params.append('resource', selectedResource);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) {
          setLogs(data.logs);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedResource]);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.actorName.toLowerCase().includes(q) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      l.actorRole.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSPECTION_ENTER':
      case 'INSPECTION_EXIT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'LOGIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">سجل التدقيق والتتبع الشامل (Audit Log)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              توثيق رسمي غير قابل للحذف لجميع الحركات والتعديلات (من / ماذا / متى / قبل / بعد)، ودخول وضع المعاينة
            </p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالفاعل، التفاصيل، أو الدور..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="all">كافة الإجراءات (Actions)</option>
            <option value="LOGIN">تسجيل دخول (LOGIN)</option>
            <option value="LOGOUT">تسجيل خروج (LOGOUT)</option>
            <option value="INSPECTION_ENTER">بدء معاينة مدرسة (INSPECTION_ENTER)</option>
            <option value="INSPECTION_EXIT">إنهاء معاينة مدرسة (INSPECTION_EXIT)</option>
            <option value="UPDATE">تعديل بيانات (UPDATE)</option>
            <option value="CREATE">إضافة سجل (CREATE)</option>
            <option value="DELETE">حذف سجل (DELETE)</option>
          </select>

          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="all">كافة الكيانات (Resources)</option>
            <option value="auth">المصادقة والحسابات</option>
            <option value="student">شئون الطلاب</option>
            <option value="attendance">الحضور والغياب</option>
            <option value="competency">تقييمات الجدارات</option>
            <option value="permission">الصلاحيات والأدوار</option>
            <option value="inspection_session">جلسات المعاينة الميدانية</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-black">
              <tr>
                <th className="py-3.5 px-4">التاريخ والوقت</th>
                <th className="py-3.5 px-4">الفاعل (Actor)</th>
                <th className="py-3.5 px-4">النوع والإجراء</th>
                <th className="py-3.5 px-4">الكيان (Resource)</th>
                <th className="py-3.5 px-4">تفاصيل الحركة</th>
                <th className="py-3.5 px-4">عنوان IP</th>
                <th className="py-3.5 px-4 text-center">الفحص (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">لا توجد حركات مسجلة مطابقة لمعايير البحث</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => {
                  const hasDiff = !!(log.beforeJson || log.afterJson);
                  const dateStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '-';

                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.actorName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.actorRole}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-full border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {log.resource}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {log.details || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasDiff ? (
                          <button
                            type="button"
                            onClick={() => setInspectingEntry(log)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5 text-blue-600" />
                            <span>قبل / بعد</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Before / After Diff Inspection Modal */}
      {inspectingEntry && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-slate-900">
                  تفاصيل التعديل وفحص الفروق (Before / After Audit Diff)
                </h3>
              </div>
              <button
                onClick={() => setInspectingEntry(null)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900">الفاعل: {inspectingEntry.actorName} ({inspectingEntry.actorRole})</div>
                <div className="text-slate-600">الإجراء: {inspectingEntry.action} على {inspectingEntry.resource}</div>
                <div className="text-slate-500 font-mono text-[11px]">التفاصيل: {inspectingEntry.details}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                    <span>الحالة السابقة (Before Modification)</span>
                  </div>
                  <pre className="bg-slate-900 text-rose-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 custom-scrollbar">
                    {inspectingEntry.beforeJson
                      ? JSON.stringify(inspectingEntry.beforeJson, null, 2)
                      : '// لا توجد بيانات سابقة (سجل جديد)'}
                  </pre>
                </div>

                {/* After */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                    <span>الحالة الجديدة (After Modification)</span>
                  </div>
                  <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 custom-scrollbar">
                    {inspectingEntry.afterJson
                      ? JSON.stringify(inspectingEntry.afterJson, null, 2)
                      : '// لا توجد بيانات لاحقة (تم الحذف)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
