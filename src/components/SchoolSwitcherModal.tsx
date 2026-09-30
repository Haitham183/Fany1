'use client';

import React, { useState } from 'react';
import { User, SchoolTenant } from '@/types';
import { getSchools, getActiveSchoolId, setActiveSchoolId } from '@/lib/storage';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Building2, Check, School, MapPin, Sparkles, Settings } from 'lucide-react';

interface SchoolSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
  onSchoolChanged?: (schoolId: string) => void;
  onSchoolSwitched?: (school?: SchoolTenant) => void;
  onManageSchools?: () => void;
}

export const SchoolSwitcherModal: React.FC<SchoolSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSchoolChanged,
  onSchoolSwitched,
  onManageSchools,
}) => {
  const schools = getSchools();
  const activeSchoolId = getActiveSchoolId();

  const handleSelect = (schoolId: string) => {
    setActiveSchoolId(schoolId);
    const selected = schools.find((s) => s.id === schoolId);
    if (onSchoolChanged) {
      onSchoolChanged(schoolId);
    }
    if (onSchoolSwitched) {
      onSchoolSwitched(selected);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="التبديل بين المدارس الفنية (Multi-School Switcher)"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          اختر المدرسة التي ترغب في الانتقال إلى لوحة قيادتها وإدارة سجلاتها:
        </p>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {schools.map((school) => {
            const isSelected = school.id === activeSchoolId;

            return (
              <div
                key={school.id}
                onClick={() => handleSelect(school.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                      كود: {school.code} • {school.systemType === '5_years_advanced' ? 'نظام 5 سنوات' : 'نظام 3 سنوات'}
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {school.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{school.directorate} • {school.administration}</span>
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    المحددة
                  </span>
                ) : (
                  <Button variant="outline" size="sm">
                    اختيار
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {onManageSchools ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onManageSchools}
              className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>إدارة كافة المدارس والمديرية 🏛️</span>
            </Button>
          ) : <div />}
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
