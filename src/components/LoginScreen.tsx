'use client';

import React, { useState } from 'react';
import { SchoolConfig, User } from '@/types';
import { login } from '@/lib/storage';
import {
  Lock,
  UserCheck,
  Building2,
  LogIn,
  Key,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';

interface LoginScreenProps {
  schoolConfig: SchoolConfig;
  users: User[];
  onLoginSuccess: (user: User) => void;
  onOpenParentPortal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  schoolConfig,
  users,
  onLoginSuccess,
  onOpenParentPortal,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = login(username, password);
      setIsLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'فشل تسجيل الدخول');
      }
    }, 300);
  };

  const handleQuickLogin = (u: User) => {
    setUsername(u.username);
    setPassword(u.password || '123');
    const result = login(u.username, u.password || '123');
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between font-['Cairo'] text-white">
      {/* Top Banner */}
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني • منظومة التعليم الفني والتدريب المهني</span>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 text-center space-y-3 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-xl mx-auto border-2 border-amber-400/40">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {schoolConfig.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {schoolConfig.directorate} • {schoolConfig.administration}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full border border-amber-500/30 font-bold">
                <Sparkles className="w-3 h-3" /> المنظومة الإلكترونية للغياب والورش
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="bg-red-50 border-2 border-red-400 text-red-800 rounded-xl p-3 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  اسم المستخدم (Username)
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: admin أو affairs أو teacher_auto"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 text-sm text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  كلمة المرور (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2.5 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? 'جارٍ التحقق والدخول...' : 'تسجيل الدخول للمنظومة'}
              </button>
            </form>

            {/* Parent & Student Portal Gateway Button */}
            {onOpenParentPortal && (
              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onOpenParentPortal}
                  className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border-2 border-purple-200 hover:border-purple-300 font-black py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>بوابة استعلام أولياء الأمور والطلاب (بالرقم القومي / كود الطالب)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Professional Developer Credit Footer */}
      <DeveloperCreditFooter className="pb-6" />
    </div>
  );
};
