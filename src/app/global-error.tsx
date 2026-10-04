'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">بوابة التعليم الفني - استعادة النظام</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              حدث خطأ أثناء تحميل التطبيق. يرجى الضغط على زر إعادة المحاولة لتحديث الجلسة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة تشغيل الصفحة</span>
          </button>
        </div>
      </body>
    </html>
  );
}
