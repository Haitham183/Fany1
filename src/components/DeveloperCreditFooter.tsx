'use client';

import React from 'react';
import { Phone, Mail, Sparkles, Code2, ShieldCheck } from 'lucide-react';

interface DeveloperCreditFooterProps {
  className?: string;
}

export const DeveloperCreditFooter: React.FC<DeveloperCreditFooterProps> = ({
  className = '',
}) => {
  return (
    <footer className={`w-full py-3 px-3 sm:px-6 transition-all ${className} no-print`}>
      <div className="max-w-5xl mx-auto bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl rounded-2xl sm:rounded-full border border-slate-800 hover:border-amber-500/40 px-4 sm:px-6 py-2.5 shadow-xl shadow-black/40 relative overflow-hidden transition-all duration-300 group">
        {/* Subtle Top Ambient Gold Line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-xs">
          {/* Right Side: Title Badge & Engineer Name */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 text-[11px] font-bold shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>تصميم وتطوير وبرمجة النظام</span>
              <Code2 className="w-3 h-3 text-amber-400" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] hidden sm:inline">•</span>
              <h3 className="font-black text-white text-xs sm:text-sm leading-normal">
                المهندس / <span className="text-amber-300">هيثم حافظ المرادني</span>
              </h3>
            </div>
          </div>

          {/* Left Side: Horizontal Contact Badges (Phone & Email) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {/* Phone & WhatsApp Chip */}
            <a
              href="tel:+201026061055"
              className="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-emerald-950/80 text-slate-200 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/50 px-3.5 py-1.5 rounded-full transition-all duration-200 group/btn font-mono text-[11px] sm:text-xs shadow-xs"
              title="اتصال أو محادثة واتساب"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover/btn:scale-110 transition shrink-0">
                <Phone className="w-2.5 h-2.5" />
              </div>
              <span dir="ltr" className="tracking-wider font-bold">+20 102 606 1055</span>
            </a>

            {/* Email Chip */}
            <a
              href="mailto:haithamhafez47@gmail.com"
              className="inline-flex items-center gap-2 bg-slate-800/90 hover:bg-blue-950/80 text-slate-200 hover:text-blue-300 border border-slate-700/80 hover:border-blue-500/50 px-3.5 py-1.5 rounded-full transition-all duration-200 group/btn font-mono text-[11px] sm:text-xs shadow-xs"
              title="إرسال بريد إلكتروني مباشر"
            >
              <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover/btn:scale-110 transition shrink-0">
                <Mail className="w-2.5 h-2.5" />
              </div>
              <span dir="ltr" className="font-semibold">haithamhafez47@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
