'use client';

import React, { useState } from 'react';
import { User, Department, SchoolClass, UserRole, UserPermission } from '@/types';
import { saveUser, deleteUser } from '@/lib/storage';
import {
  ShieldCheck,
  UserPlus,
  Key,
  Lock,
  Edit2,
  Trash2,
  Check,
  X,
  UserCheck,
  Briefcase,
  Wrench,
  Zap,
  Building2,
  ShieldAlert,
  GraduationCap,
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  departments: Department[];
  classes: SchoolClass[];
  currentUser: User;
  onUsersChanged: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  departments,
  classes,
  currentUser,
  onUsersChanged,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('dept_head');
  const [formRoleTitle, setFormRoleTitle] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAssignedClasses, setFormAssignedClasses] = useState<string[]>([]);
  const [formPermissions, setFormPermissions] = useState<UserPermission>({
    canTakeAttendance: true,
    canManageStudents: false,
    canTransferStudents: false,
    canApproveExcuses: false,
    canIssueNotices: false,
    canManageSchoolSettings: false,
    canManageUsers: false,
    canViewReports: true,
    canManageCompetencies: true,
    canLogViolations: true,
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('123');
    setFormRole('dept_head');
    setFormRoleTitle('رئيس قسم صناعي');
    setFormDeptId(departments[0]?.id || '');
    setFormPhone('');
    setFormAssignedClasses([]);
    setFormPermissions({
      canTakeAttendance: true,
      canManageStudents: false,
      canTransferStudents: false,
      canApproveExcuses: false,
      canIssueNotices: false,
      canManageSchoolSettings: false,
      canManageUsers: false,
      canViewReports: true,
      canManageCompetencies: true,
      canLogViolations: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password || '123');
    setFormRole(user.role);
    setFormRoleTitle(user.roleTitle);
    setFormDeptId(user.departmentId || '');
    setFormPhone(user.phone || '');
    setFormAssignedClasses(user.assignedClassIds || []);
    setFormPermissions({
      canTakeAttendance: user.customPermissions?.canTakeAttendance ?? true,
      canManageStudents: user.customPermissions?.canManageStudents ?? (user.role === 'principal' || user.role === 'affairs_deputy' || user.role === 'affairs_officer'),
      canTransferStudents: user.customPermissions?.canTransferStudents ?? (user.role === 'principal' || user.role === 'affairs_deputy' || user.role === 'affairs_officer'),
      canApproveExcuses: user.customPermissions?.canApproveExcuses ?? (user.role === 'principal' || user.role === 'affairs_deputy' || user.role === 'affairs_officer'),
      canIssueNotices: user.customPermissions?.canIssueNotices ?? (user.role === 'principal' || user.role === 'affairs_deputy' || user.role === 'affairs_officer'),
      canManageSchoolSettings: user.customPermissions?.canManageSchoolSettings ?? (user.role === 'principal'),
      canManageUsers: user.customPermissions?.canManageUsers ?? (user.role === 'principal'),
      canViewReports: user.customPermissions?.canViewReports ?? true,
      canManageCompetencies: user.customPermissions?.canManageCompetencies ?? true,
      canLogViolations: user.customPermissions?.canLogViolations ?? true,
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    if (role === 'principal') {
      setFormRoleTitle('مدير عام المدرسة');
      setFormPermissions({
        canTakeAttendance: true,
        canManageStudents: true,
        canTransferStudents: true,
        canApproveExcuses: true,
        canIssueNotices: true,
        canManageSchoolSettings: true,
        canManageUsers: true,
        canViewReports: true,
        canManageCompetencies: true,
        canLogViolations: true,
      });
    } else if (role === 'affairs_deputy') {
      setFormRoleTitle('وكيل شئون الطلاب');
      setFormPermissions({
        canTakeAttendance: true,
        canManageStudents: true,
        canTransferStudents: true,
        canApproveExcuses: true,
        canIssueNotices: true,
        canManageSchoolSettings: false,
        canManageUsers: false,
        canViewReports: true,
        canManageCompetencies: true,
        canLogViolations: true,
      });
    } else if (role === 'affairs_officer') {
      setFormRoleTitle('مسئول شئون الطلاب');
      setFormPermissions({
        canTakeAttendance: true,
        canManageStudents: true,
        canTransferStudents: true,
        canApproveExcuses: true,
        canIssueNotices: true,
        canManageSchoolSettings: false,
        canManageUsers: false,
        canViewReports: true,
        canManageCompetencies: true,
        canLogViolations: true,
      });
    } else if (role === 'dept_head') {
      setFormRoleTitle('رئيس قسم صناعي');
      setFormPermissions({
        canTakeAttendance: true,
        canManageStudents: false,
        canTransferStudents: false,
        canApproveExcuses: false,
        canIssueNotices: false,
        canManageSchoolSettings: false,
        canManageUsers: false,
        canViewReports: true,
        canManageCompetencies: true,
        canLogViolations: true,
      });
    } else {
      setFormRoleTitle('معلم / مدرب ورشة');
      setFormPermissions({
        canTakeAttendance: true,
        canManageStudents: false,
        canTransferStudents: false,
        canApproveExcuses: false,
        canIssueNotices: false,
        canManageSchoolSettings: false,
        canManageUsers: false,
        canViewReports: false,
        canManageCompetencies: true,
        canLogViolations: true,
      });
    }
  };

  const handleToggleClass = (classId: string) => {
    setFormAssignedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername) return;

    saveUser({
      id: editingUser?.id,
      name: formName,
      username: formUsername,
      password: formPassword || '123',
      role: formRole,
      roleTitle: formRoleTitle,
      departmentId: formDeptId || undefined,
      assignedClassIds: formAssignedClasses,
      phone: formPhone,
      customPermissions: formPermissions,
    });

    setIsModalOpen(false);
    onUsersChanged();
  };

  const handleDelete = (userId: string, name: string) => {
    if (userId === currentUser.id) {
      alert('لا يمكنك حذف الحساب المسجل به حالياً!');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف حساب (${name})؟`)) {
      deleteUser(userId);
      onUsersChanged();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'principal':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'affairs_deputy':
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case 'affairs_officer':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'dept_head':
        return <Zap className="w-5 h-5 text-purple-600" />;
      default:
        return <Wrench className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> صلاحيات فريق العمل المدرسي
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            إدارة حسابات فريق العمل وكلمات المرور والصلاحيات
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            تحديد صلاحيات المعلمين والمديرين والمشرفين وتسجيل الحضور والغياب.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" /> إضافة مستخدم جديد
        </button>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isMe = user.id === currentUser.id;
          const userDept = departments.find((d) => d.id === user.departmentId);

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition space-y-4 ${
                isMe ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:shadow-md'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                      {isMe && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                          حسابك الحالي
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-semibold">{user.roleTitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="تعديل الحساب والصلاحيات"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!isMe && (
                    <button
                      onClick={() => handleDelete(user.id, user.name)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Credentials Box */}
              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">اسم المستخدم:</span>
                  <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {user.username}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">كلمة المرور:</span>
                  <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                    {user.password || '123'}
                  </span>
                </div>
              </div>

              {/* Extra Info */}
              <div className="text-xs text-slate-600 space-y-1">
                {userDept && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">القسم:</span>
                    <span className="font-bold text-slate-800">{userDept.name}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">الهاتف:</span>
                    <span className="font-mono text-slate-800">{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Permissions Badges */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1 text-[10px]">
                {user.customPermissions?.canTakeAttendance && (
                  <span className="bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-200">
                    ✓ تسجيل الحضور والغياب
                  </span>
                )}
                {user.customPermissions?.canManageStudents && (
                  <span className="bg-blue-100 text-blue-900 font-semibold px-2 py-0.5 rounded border border-blue-200">
                    ✓ إدارة الطلاب
                  </span>
                )}
                {user.customPermissions?.canTransferStudents && (
                  <span className="bg-purple-100 text-purple-900 font-semibold px-2 py-0.5 rounded border border-purple-200">
                    ✓ نقل الطلاب
                  </span>
                )}
                {user.customPermissions?.canIssueNotices && (
                  <span className="bg-red-100 text-red-900 font-semibold px-2 py-0.5 rounded border border-red-200">
                    ✓ الإنذارات
                  </span>
                )}
                {user.customPermissions?.canManageUsers && (
                  <span className="bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                    ✓ إدارة الصلاحيات
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Key className="w-4 h-4 text-emerald-400" />
                {editingUser ? 'تعديل بيانات المستخدم والصلاحيات' : 'إنشاء حساب مستخدم جديد'}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="أ / أحمد محمد حسن"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الدور والمنصب الوظيفي *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="principal">مدير عام المدرسة (صلاحيات كاملة)</option>
                    <option value="affairs_deputy">وكيل شئون الطلاب</option>
                    <option value="affairs_officer">مسئول شئون الطلاب</option>
                    <option value="dept_head">رئيس قسم صناعي</option>
                    <option value="teacher">معلم / مدرب ورشة</option>
                  </select>
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المستخدم للدخول (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="deputy_affairs"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كلمة المرور (Password) *</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Department & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم الصناعي التابع له</label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">عام / إدارة المدرسة</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    placeholder="010xxxxxxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  تحديد الصلاحيات المخصصة داخل المنظومة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canTakeAttendance}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canTakeAttendance: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-slate-900">تسجيل الحضور والغياب (ورش وفصول)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageStudents}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageStudents: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">إضافة وتعديل وحذف الطلاب</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canTransferStudents}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canTransferStudents: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-800">نقل وتحويل الطلاب بين التخصصات</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canApproveExcuses}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canApproveExcuses: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">اعتماد الأعذار الطبية والرسمية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canIssueNotices}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canIssueNotices: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800">طباعة وإصدار الإنذارات وقرارات الفصل</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageSchoolSettings}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageSchoolSettings: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">تعديل بيانات وهوية المدرسة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageUsers}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageUsers: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">إدارة الحسابات وكلمات المرور</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canViewReports}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canViewReports: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">الاطلاع على التقارير والإحصائيات</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canManageCompetencies}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canManageCompetencies: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">متابعة نسب الجدارات المهنية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formPermissions.canLogViolations}
                      onChange={(e) => setFormPermissions({ ...formPermissions, canLogViolations: e.target.checked })}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="font-semibold text-slate-800">تسجيل مخالفات السلامة والهروب</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  حفظ وتأكيد الصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
