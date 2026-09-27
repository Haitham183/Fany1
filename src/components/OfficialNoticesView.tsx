'use client';

import React, { useState } from 'react';
import { OfficialNotice, Student, User } from '@/types';
import { reinstateStudent } from '@/lib/storage';
import {
  Printer,
  FileText,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  RotateCcw,
  Send,
  Eye,
  X,
} from 'lucide-react';

interface OfficialNoticesViewProps {
  notices: OfficialNotice[];
  students: Student[];
  currentUser: User;
  schoolConfig: any;
  onNoticeUpdated: () => void;
}

export const OfficialNoticesView: React.FC<OfficialNoticesViewProps> = ({
  notices,
  students,
  currentUser,
  schoolConfig,
  onNoticeUpdated,
}) => {
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(
    notices[0]?.id || null
  );
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showReinstatementModal, setShowReinstatementModal] = useState<boolean>(false);
  const [reinstatementReceipt, setReinstatementReceipt] = useState<string>('33 ع.ح / 894521');
  const [reinstatementFee, setReinstatementFee] = useState<number>(25);

  const filteredNotices = notices.filter((n) => {
    // Only show notices for existing students
    const studentExists = students.some((s) => s.id === n.studentId);
    if (!studentExists) return false;
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'warning_1'
        ? n.noticeType === 'warning_1'
        : activeFilter === 'warning_2'
        ? n.noticeType === 'warning_2'
        : activeFilter === 'expulsion'
        ? n.noticeType === 'expulsion_notice'
        : activeFilter === 'reinstatement'
        ? n.noticeType === 'reinstatement'
        : true;

    const matchesSearch =
      n.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.nationalId.includes(searchQuery) ||
      n.serialNumber.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const selectedNotice =
    filteredNotices.find((n) => n.id === selectedNoticeId) ||
    filteredNotices[0] ||
    null;

  const handlePrint = () => {
    window.print();
  };

  const handleReinstatementSubmit = () => {
    if (!selectedNotice) return;
    reinstateStudent(selectedNotice.studentId, reinstatementReceipt, reinstatementFee);
    setShowReinstatementModal(false);
    onNoticeUpdated();
  };

  const getNoticeBadge = (type: string) => {
    switch (type) {
      case 'warning_1':
        return {
          label: 'إنذار أول (5 متصل / 10 منفصل)',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'warning_2':
        return {
          label: 'إنذار ثان (10 متصل / 20 منفصل)',
          color: 'bg-orange-100 text-orange-900 border-orange-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />,
        };
      case 'expulsion_notice':
        return {
          label: 'قرار فصل / حرمان من الامتحان',
          color: 'bg-red-100 text-red-900 border-red-300',
          icon: <Flame className="w-3.5 h-3.5 text-red-600" />,
        };
      case 'reinstatement':
        return {
          label: 'إشعار إعادة قيد معتمد',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      default:
        return {
          label: 'إخطار رسمي',
          color: 'bg-slate-100 text-slate-900 border-slate-300',
          icon: <FileText className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-red-500/30 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> الشئون القانونية واللوائح المدرسية
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            سجل ونماذج الإنذارات والقرارات الرسمية
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            توليد وطباعة خطابات الإنذار الأول والثاني وقرارات الفصل وإعادة القيد الرسمية المعتمدة وفقاً للائحة الانضباط المدرسي.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedNotice && (
            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> طباعة النموذج الرسمي (A4)
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Notices List, Right Official Document Printable Paper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:w-full">
        {/* Left Column: Notices Browser (No Print) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث باسم الطالب، الرقم القومي، رقم السجل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({notices.length})
              </button>
              <button
                onClick={() => setActiveFilter('warning_1')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition whitespace-nowrap ${
                  activeFilter === 'warning_1'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                إنذار أول
              </button>
              <button
                onClick={() => setActiveFilter('warning_2')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition whitespace-nowrap ${
                  activeFilter === 'warning_2'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                }`}
              >
                إنذار ثان
              </button>
              <button
                onClick={() => setActiveFilter('expulsion')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition whitespace-nowrap ${
                  activeFilter === 'expulsion'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
              >
                قرارات فصل
              </button>
            </div>
          </div>

          {/* Notices Cards List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {filteredNotices.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                لا توجد إنذارات مسجلة مطابقة للبحث
              </div>
            ) : (
              filteredNotices.map((notice) => {
                const isSelected = selectedNotice?.id === notice.id;
                const badge = getNoticeBadge(notice.noticeType);

                return (
                  <div
                    key={notice.id}
                    onClick={() => setSelectedNoticeId(notice.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${badge.color}`}>
                            {badge.icon} {badge.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            رقم: {notice.serialNumber}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{notice.studentName}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{notice.className}</span>
                          <span>•</span>
                          <span>غياب: <b className="text-red-600">{notice.totalDays} يوم</b> ({notice.consecutiveDays} متصل)</span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[11px] text-slate-400 block font-mono">{notice.issueDate}</span>
                        {notice.noticeType === 'expulsion_notice' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNoticeId(notice.id);
                              setShowReinstatementModal(true);
                            }}
                            className="mt-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold transition shadow-2xs"
                          >
                            إعادة قيد ⟲
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Official Egyptian Ministry Notice Letter (Printable) */}
        <div className="lg:col-span-7 print:w-full print:block print:p-0">
          {selectedNotice ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-lg print-card official-border relative">
              {/* Republic Eagle Watermark Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
                <Building className="w-96 h-96 text-slate-900" />
              </div>

              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start text-xs font-bold text-slate-800 leading-relaxed">
                  <div className="text-right space-y-0.5">
                    <div>جمهورية مصر العربية</div>
                    <div>وزارة التربية والتعليم والتعليم الفني</div>
                    <div>{schoolConfig.directorate}</div>
                    <div>{schoolConfig.administration}</div>
                    <div className="text-amber-800 font-black text-sm">{schoolConfig.name}</div>
                  </div>

                  <div className="text-left space-y-0.5 font-mono">
                    <div>التاريخ: {selectedNotice.issueDate}</div>
                    <div>رقم القيد الصادر: {selectedNotice.serialNumber}</div>
                    <div>العام الدراسي: {schoolConfig.academicYear}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mt-6 mb-2">
                  <span className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-base sm:text-lg font-black text-slate-950 bg-slate-50 leading-normal shadow-xs">
                    {selectedNotice.noticeTitle}
                  </span>
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-900 leading-loose">
                <p className="font-bold">
                  السيد ولي أمر الطالب / <span className="text-base text-slate-950 underline underline-offset-4">{selectedNotice.guardianName}</span> المحترم،،
                </p>
                
                <p className="text-justify indent-6">
                  تحية طيبة وبعد ،،،
                </p>

                <p className="text-justify leading-relaxed">
                  نحيط سيادتكم علماً بأن نجلكم الطالب / <strong className="text-slate-950 font-black">{selectedNotice.studentName}</strong>، 
                  المقيد بالصف <strong className="text-slate-950">({selectedNotice.className})</strong> - تخصص <strong className="text-slate-950">({selectedNotice.departmentName})</strong>، 
                  والحامل للرقم القومي <span className="font-mono font-bold">({selectedNotice.nationalId})</span>،
                  قد تغيب عن الحضور بالمدرسة والورش العملية بدون إذن أو عذر قانوني مقبول على النحو التالي:
                </p>

                {/* Absence Table */}
                <div className="my-4 border border-slate-900 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-center">
                    <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                      <tr>
                        <th className="p-2 border-l border-slate-900">أيام الغياب المتصل</th>
                        <th className="p-2 border-l border-slate-900">إجمالي أيام الغياب المنفصل</th>
                        <th className="p-2 border-l border-slate-900">تاريخ آخر غياب</th>
                        <th className="p-2">الموقف القانوني</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr className="font-semibold">
                        <td className="p-2.5 border-l border-slate-300 font-black text-red-600 text-sm">{selectedNotice.consecutiveDays} يوم</td>
                        <td className="p-2.5 border-l border-slate-300 font-black text-red-600 text-sm">{selectedNotice.totalDays} يوم</td>
                        <td className="p-2.5 border-l border-slate-300 font-mono">{selectedNotice.issueDate}</td>
                        <td className="p-2.5 text-xs text-slate-800 font-bold">
                          {selectedNotice.noticeType === 'warning_1'
                            ? 'إنذار رسمي أول'
                            : selectedNotice.noticeType === 'warning_2'
                            ? 'إنذار رسمي ثان (تحذير أخير)'
                            : 'فصل واستنفاد أيام الغياب'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Legal Warning Notice Note */}
                <p className="text-justify leading-relaxed text-xs">
                  {selectedNotice.noticeType === 'expulsion_notice' ? (
                    <span className="font-bold text-red-950">
                      بناءً على المادة (..) من قانون التعليم رقم 139 لسنة 1981 والقرارات الوزارية المنظمة للتعليم الفني ونظام الجدارات، تقرر **فصل الطالب** لتجاوزه المدة القانونية للغياب (15 يوماً متصلة أو 30 يوماً منفصلة). ولا يُعاد قيده إلا بحضور ولي الأمر وسداد الرسوم المقررة بموجب إيصال 33 ع.ح وتقديم ما يثبت العذر، على ألا تتجاوز مدة إعادة القيد المدد المسموح بها قانوناً لدخول الامتحانات.
                    </span>
                  ) : (
                    <span>
                      وطبقاً للائحة الانضباط المدرسي وقواعد التعليم الفني الصناعي، ننذركم بضرورة حضور نجلكم فوراً وانتظامه بالورش العملية، وموافاة إدارة المدرسة بالأعذار القانونية إن وجدت. وإلا سيتم تطبيق الإجراءات القانونية المشددة والتي قد تصل إلى **فصل الطالب وحرمانه من دخول الامتحانات العملية والنظرية وتقييم الجدارات**.
                    </span>
                  )}
                </p>

                <div className="pt-2 text-xs font-semibold text-slate-600">
                  العنوان المسجل: {selectedNotice.address} | تليفون ولي الأمر: {selectedNotice.guardianPhone}
                </div>
              </div>

              {/* Official Signatures & Stamp Area */}
              <div className="mt-10 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-950">
                <div className="space-y-8">
                  <div>مسئول سجل الغياب</div>
                  <div className="text-slate-800 font-medium">({schoolConfig.studentAffairsAgent || 'مسئول سجلات الغياب'})</div>
                </div>

                <div className="space-y-8">
                  <div>رئيس قسم شئون الطلاب</div>
                  <div className="text-slate-950">({schoolConfig.studentAffairsHead})</div>
                </div>

                <div className="space-y-8">
                  <div>يعتمد / مدير عام المدرسة</div>
                  <div className="text-slate-950">({schoolConfig.managerName})</div>
                </div>
              </div>

              {/* School Official Stamp Box */}
              <div className="mt-6 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200">
                <span>* تحرر هذا الإخطار بمعرفة قسم شئون الطلاب والتعليم الفني</span>
                <div className="w-24 h-24 border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-center text-[10px] text-slate-400 font-bold p-1">
                  خاتم شعار الجمهورية (المدرسة)
                </div>
                <span>طُبع إلكترونياً من نظام إدارة التعليم الصناعي</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
              اختر إنذاراً من القائمة لعرضه وطباعته
            </div>
          )}
        </div>
      </div>

      {/* Reinstatement Modal (إعادة قيد) */}
      {showReinstatementModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                إجراءات إعادة قيد الطالب
              </div>
              <button
                onClick={() => setShowReinstatementModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">اسم الطالب المفصول:</div>
                <div className="font-bold text-sm text-slate-900 mt-0.5">{selectedNotice.studentName}</div>
                <div className="text-slate-500 mt-1">{selectedNotice.className} - {selectedNotice.departmentName}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رقم إيصال التوريد (33 ع.ح)
                </label>
                <input
                  type="text"
                  value={reinstatementReceipt}
                  onChange={(e) => setReinstatementReceipt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  رسم إعادة القيد المقرر (جنيه مصري)
                </label>
                <input
                  type="number"
                  value={reinstatementFee}
                  onChange={(e) => setReinstatementFee(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
                <strong>تنبيه إداري:</strong> بمجرد الاعتماد، يتم تصفير أيام الغياب المتصل للطالب، وتحديث سجله في قاعدة بيانات شئون الطلاب لإتاحة رصد حضوره في الورش مجدداً.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReinstatementModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReinstatementSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  اعتماد إعادة القيد رسمياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
