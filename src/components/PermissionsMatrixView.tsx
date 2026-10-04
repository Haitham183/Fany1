'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Save,
  RefreshCw,
  AlertTriangle,
  Lock,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import {
  SYSTEM_MODULES_ARABIC,
  SystemModule,
  PermissionAction,
  DEFAULT_ROLE_PERMISSIONS,
  RolePermissionsMap,
} from '@/lib/server/auth/permissions';

interface PermissionsMatrixViewProps {
  currentUserRole: string;
  isInspectionMode?: boolean;
}

export function PermissionsMatrixView({
  currentUserRole,
  isInspectionMode = false,
}: PermissionsMatrixViewProps) {
  const [selectedRole, setSelectedRole] = useState<string>('teacher');
  const [matrix, setMatrix] = useState<Record<string, RolePermissionsMap>>(DEFAULT_ROLE_PERMISSIONS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rolesList = [
    { code: 'principal', name: 'مدير المدرسة' },
    { code: 'dept_head', name: 'رئيس قسم تخصصي' },
    { code: 'affairs_deputy', name: 'وكيل شئون الطلاب' },
    { code: 'affairs_officer', name: 'عضو شئون طلاب' },
    { code: 'teacher', name: 'معلم / مدرب ورش' },
    { code: 'social_worker', name: 'أخصائي اجتماعي' },
    { code: 'parent', name: 'ولي الأمر / الطالب' },
  ];

  const fetchPermissions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.roles) {
          const map: Record<string, RolePermissionsMap> = {};
          data.roles.forEach((r: { code: string; permissions: RolePermissionsMap }) => {
            map[r.code] = r.permissions;
          });
          setMatrix(map);
        }
      } else if (res.status === 401 || res.status === 403) {
        setErrorMessage('غير مصرح بتعديل مصفوفة الصلاحيات أو انتهت صلاحية الجلسة. تم تحميل القيم الافتراضية.');
      } else {
        setErrorMessage('تعذر جلب الصلاحيات المخصصة من الخادم، يتم استخدام الإعدادات الافتراضية.');
      }
    } catch {
      setErrorMessage('خطأ في الاتصال بالخادم، يتم عرض مصفوفة الصلاحيات الافتراضية.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (module: SystemModule, action: PermissionAction) => {
    if (isInspectionMode) return;
    if (currentUserRole !== 'principal' && currentUserRole !== 'directorate_admin') return;

    setMatrix((prev) => {
      const currentRolePerms = prev[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole];
      const currentModuleRule = currentRolePerms[module] || {
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
      };

      const updatedRule = { ...currentModuleRule };
      if (action === 'view') updatedRule.canView = !updatedRule.canView;
      if (action === 'add') updatedRule.canAdd = !updatedRule.canAdd;
      if (action === 'edit') updatedRule.canEdit = !updatedRule.canEdit;
      if (action === 'delete') updatedRule.canDelete = !updatedRule.canDelete;
      if (action === 'export') updatedRule.canExport = !updatedRule.canExport;

      return {
        ...prev,
        [selectedRole]: {
          ...currentRolePerms,
          [module]: updatedRule,
        },
      };
    });
  };

  const handleSave = async () => {
    if (isInspectionMode) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleCode: selectedRole,
          permissions: matrix[selectedRole],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || 'تعذر حفظ الصلاحيات');
      }
    } catch {
      setErrorMessage('فشل الاتصال بالخادم أثناء حفظ الصلاحيات');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPermissions = matrix[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole];
  const canEditMatrix = (currentUserRole === 'principal' || currentUserRole === 'directorate_admin') && !isInspectionMode;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              مصفوفة الصلاحيات والأدوار المدرسية (RBAC Matrix)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ضبط صلاحيات (عرض / إضافة / تعديل / حذف / تصدير) لكل موديول وفق الهيكل الإداري للمدرسة الفنية
            </p>
          </div>
        </div>

        {canEditMatrix && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
              <span>حفظ مصفوفة الدور</span>
            </button>
          </div>
        )}
      </div>

      {/* Inspection Mode Warning */}
      {isInspectionMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>تنبيه: أنت في وضع المعاينة الميدانية للقراءة فقط. جميع عمليات التعديل والحفظ معطلة ومسجلة في سجل التدقيق.</span>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم اعتماد وتحديث الصلاحيات بنجاح، وتوثيق التعديل في سجل التدقيق (Audit Log) مع حالة القيم السابقة واللاحقة.</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold">
          <X className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {rolesList.map((r) => {
          const isSelected = selectedRole === r.code;
          return (
            <button
              key={r.code}
              onClick={() => setSelectedRole(r.code)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-700 font-black">
              <tr>
                <th className="py-3.5 px-4">الوحدة / الموديول</th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>عرض (View)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>إضافة (Add)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>تعديل (Edit)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>حذف (Delete)</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تصدير (Export)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(SYSTEM_MODULES_ARABIC) as SystemModule[]).map((modKey) => {
                const modInfo = SYSTEM_MODULES_ARABIC[modKey];
                const rule = currentPermissions?.[modKey] || {
                  canView: false,
                  canAdd: false,
                  canEdit: false,
                  canDelete: false,
                  canExport: false,
                };

                return (
                  <tr key={modKey} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{modInfo.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{modInfo.description}</div>
                    </td>

                    {/* View */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditMatrix}
                        onClick={() => handleToggle(modKey, 'view')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          rule.canView
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!canEditMatrix ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        {rule.canView ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Add */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditMatrix}
                        onClick={() => handleToggle(modKey, 'add')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          rule.canAdd
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!canEditMatrix ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        {rule.canAdd ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditMatrix}
                        onClick={() => handleToggle(modKey, 'edit')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          rule.canEdit
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!canEditMatrix ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        {rule.canEdit ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Delete */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditMatrix}
                        onClick={() => handleToggle(modKey, 'delete')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          rule.canDelete
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!canEditMatrix ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        {rule.canDelete ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Export */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canEditMatrix}
                        onClick={() => handleToggle(modKey, 'export')}
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition ${
                          rule.canExport
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!canEditMatrix ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        {rule.canExport ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
