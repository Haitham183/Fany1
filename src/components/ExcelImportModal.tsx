'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Department, SchoolClass, GradeLevel } from '@/types';
import { batchImportStudents, autoFixSwappedStudentFields } from '@/lib/storage';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  Wrench,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  classes: SchoolClass[];
  onImportSuccess: () => void;
}

interface ColumnMapping {
  fullNameIndex: number;
  nationalIdIndex: number;
  studentCodeIndex: number;
  departmentIndex: number;
  classIndex: number;
  guardianNameIndex: number;
  guardianPhoneIndex: number;
  addressIndex: number;
  statusIndex: number;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  departments,
  classes,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string>('');
  
  // Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({
    fullNameIndex: -1,
    nationalIdIndex: -1,
    studentCodeIndex: -1,
    departmentIndex: -1,
    classIndex: -1,
    guardianNameIndex: -1,
    guardianPhoneIndex: -1,
    addressIndex: -1,
    statusIndex: -1,
  });

  // Fallback default selections if not present in columns
  const [defaultDepartmentId, setDefaultDepartmentId] = useState<string>(departments[0]?.id || '');
  const [defaultClassId, setDefaultClassId] = useState<string>(classes[0]?.id || '');

  const [importResult, setImportResult] = useState<{
    addedCount: number;
    skippedCount?: number;
    createdDepartmentsCount?: number;
    createdClassesCount?: number;
    errors: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart Column Auto-Detector
  const detectColumnIndices = (headers: string[], sampleRows: string[][]): ColumnMapping => {
    const newMapping: ColumnMapping = {
      fullNameIndex: -1,
      nationalIdIndex: -1,
      studentCodeIndex: -1,
      departmentIndex: -1,
      classIndex: -1,
      guardianNameIndex: -1,
      guardianPhoneIndex: -1,
      addressIndex: -1,
      statusIndex: -1,
    };

    const clean = (str: string) => (str || '').trim().toLowerCase().replace(/[_\s-]+/g, '');

    // 1. Header Name Matching
    headers.forEach((hdr, idx) => {
      const h = clean(hdr);
      if (!h) return;

      // Full Name
      if (
        (h.includes('اسم') && (h.includes('طالب') || h.includes('تلميذ') || h.includes('رباعي') || h.includes('كامل') || !h.includes('ولي'))) ||
        h === 'اسم' ||
        h === 'name' ||
        h === 'fullname' ||
        h === 'studentname'
      ) {
        if (!h.includes('ولي') && !h.includes('اب') && !h.includes('أم') && !h.includes('مدرسة') && newMapping.fullNameIndex === -1) {
          newMapping.fullNameIndex = idx;
        }
      }

      // National ID
      if (
        h.includes('قومي') ||
        h.includes('بطاق') ||
        h.includes('national') ||
        h.includes('nid') ||
        h.includes('ssn') ||
        (h.includes('رقم') && h.includes('قوم'))
      ) {
        if (newMapping.nationalIdIndex === -1) newMapping.nationalIdIndex = idx;
      }

      // Student Code / Seating Number
      if (
        (h.includes('كود') && !h.includes('قسم') && !h.includes('مدرسة')) ||
        h.includes('جلوس') ||
        h.includes('مسلسل') ||
        h === 'code' ||
        h === 'studentcode' ||
        h === 'id' ||
        h === 'رقم'
      ) {
        if (newMapping.studentCodeIndex === -1 && !h.includes('قومي')) newMapping.studentCodeIndex = idx;
      }

      // Department / Specialization
      if (
        h.includes('تخصص') ||
        h.includes('قسم') ||
        h.includes('شعبة') ||
        h.includes('مجال') ||
        h === 'dept' ||
        h === 'department'
      ) {
        if (newMapping.departmentIndex === -1) newMapping.departmentIndex = idx;
      }

      // Class
      if (
        h.includes('فصل') ||
        h.includes('صف') ||
        h === 'class' ||
        h === 'classroom'
      ) {
        if (newMapping.classIndex === -1) newMapping.classIndex = idx;
      }

      // Guardian Name
      if (
        h.includes('ولي') ||
        h.includes('امر') ||
        h.includes('والد') ||
        h.includes('guardian') ||
        h.includes('parent')
      ) {
        if (!h.includes('هاتف') && !h.includes('تليفون') && !h.includes('موبايل') && newMapping.guardianNameIndex === -1) {
          newMapping.guardianNameIndex = idx;
        }
      }

      // Guardian Phone
      if (
        h.includes('هاتف') ||
        h.includes('تليفون') ||
        h.includes('موبايل') ||
        h.includes('جوال') ||
        h.includes('phone') ||
        h.includes('mobile') ||
        h.includes('tel')
      ) {
        if (newMapping.guardianPhoneIndex === -1) newMapping.guardianPhoneIndex = idx;
      }

      // Address
      if (
        h.includes('عنوان') ||
        h.includes('اقام') ||
        h.includes('سكن') ||
        h.includes('محل') ||
        h === 'address'
      ) {
        if (newMapping.addressIndex === -1) newMapping.addressIndex = idx;
      }

      // Status
      if (
        h.includes('حالة') ||
        h.includes('قيد') ||
        h === 'status'
      ) {
        if (newMapping.statusIndex === -1) newMapping.statusIndex = idx;
      }
    });

    // 2. Content Heuristics Fallback (Inspect actual data values in sample rows)
    if (sampleRows.length > 0) {
      const colCount = Math.max(headers.length, ...sampleRows.map(r => r.length));

      for (let c = 0; c < colCount; c++) {
        const sampleValues = sampleRows.map(r => (r[c] || '').trim()).filter(Boolean);
        if (sampleValues.length === 0) continue;

        const isMostly14Digits = sampleValues.filter(v => /^\d{14}$/.test(v.replace(/\s+/g, ''))).length >= Math.ceil(sampleValues.length * 0.5);
        const isMostlyArabicNames = sampleValues.filter(v => /[\u0600-\u06FF]/.test(v) && v.split(/\s+/).length >= 2 && !/^\d+$/.test(v)).length >= Math.ceil(sampleValues.length * 0.5);
        const isMostlyShortCodes = sampleValues.filter(v => /^\d{3,10}$/.test(v.replace(/\s+/g, ''))).length >= Math.ceil(sampleValues.length * 0.5);
        const isMostlyPhones = sampleValues.filter(v => /^01[0125]\d{8}$/.test(v.replace(/\s+/g, ''))).length >= Math.ceil(sampleValues.length * 0.5);
        const isMostlyClassFormat = sampleValues.filter(v => /^\d\s*[\/\\]\s*\d/.test(v) || v.includes('أول') || v.includes('ثان') || v.includes('ثالث')).length >= Math.ceil(sampleValues.length * 0.5);

        if (isMostly14Digits && newMapping.nationalIdIndex === -1) {
          newMapping.nationalIdIndex = c;
        } else if (isMostlyArabicNames && newMapping.fullNameIndex === -1) {
          newMapping.fullNameIndex = c;
        } else if (isMostlyPhones && newMapping.guardianPhoneIndex === -1) {
          newMapping.guardianPhoneIndex = c;
        } else if (isMostlyShortCodes && newMapping.studentCodeIndex === -1 && newMapping.nationalIdIndex !== c) {
          newMapping.studentCodeIndex = c;
        } else if (isMostlyClassFormat && newMapping.classIndex === -1) {
          newMapping.classIndex = c;
        }
      }
    }

    // Default fallbacks if still unmapped
    if (newMapping.fullNameIndex === -1 && headers.length > 0) newMapping.fullNameIndex = 0;
    if (newMapping.nationalIdIndex === -1 && headers.length > 1) newMapping.nationalIdIndex = 1;

    return newMapping;
  };

  const processParsedData = (rows: string[][], srcFileName: string) => {
    if (!rows || rows.length === 0) {
      alert('الملف فارغ أو تعذر قراءة البيانات منه');
      return;
    }

    // Filter out completely empty rows
    const nonEmptyRows = rows.filter(r => r.some(cell => String(cell || '').trim().length > 0));
    if (nonEmptyRows.length === 0) {
      alert('لم يتم العثور على أي بيانات صالحة داخل الملف');
      return;
    }

    // Determine if first row is header
    const firstRow = nonEmptyRows[0].map(c => String(c || '').trim());
    const hasHeaderKeywords = firstRow.some(c => 
      c.includes('اسم') || c.includes('قومي') || c.includes('كود') || c.includes('فصل') || c.includes('تخصص') || c.includes('رقم') || c.includes('name') || c.includes('id')
    );

    let headers: string[] = [];
    let dataRows: string[][] = [];

    if (hasHeaderKeywords) {
      headers = firstRow;
      dataRows = nonEmptyRows.slice(1);
    } else {
      headers = firstRow.map((_, i) => `العمود رقم ${i + 1}`);
      dataRows = nonEmptyRows;
    }

    // Clean strings in data rows
    const cleanedDataRows = dataRows.map(row => 
      row.map(cell => String(cell || '').trim().replace(/^"|"$/g, ''))
    );

    const autoMapping = detectColumnIndices(headers, cleanedDataRows.slice(0, 10));

    setFileName(srcFileName);
    setRawHeaders(headers);
    setRawRows(cleanedDataRows);
    setMapping(autoMapping);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonSheet: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
          
          processParsedData(jsonSheet, file.name);
        } catch (err: any) {
          alert('حدث خطأ أثناء قراءة ملف Excel: ' + (err.message || 'تنسيق غير مدعوم'));
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or TXT
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const parsed = lines.map(line => {
            const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
            return line.split(sep).map(p => p.trim());
          });
          processParsedData(parsed, file.name);
        } catch (err: any) {
          alert('حدث خطأ أثناء قراءة ملف CSV: ' + err.message);
        }
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const handleLoadSample = () => {
    const sampleHeaders = ['اسم الطالب', 'الرقم القومي', 'كود الطالب', 'التخصص', 'الفصل', 'ولي الأمر', 'الهاتف', 'العنوان'];
    const sampleRows = [
      ['أحمد محمود كمال حسن', '30704150109988', '2026101', 'قسم الحاسبات', '1/1', 'محمود كمال حسن', '01011122334', 'شبرا - القاهرة'],
      ['يوسف خالد عبد الفتاح', '30705200108877', '2026102', 'قسم الحاسبات', '1/1', 'خالد عبد الفتاح', '01233344556', 'روض الفرج - القاهرة'],
      ['عمر طارق مصطفى سالم', '30706120107766', '2026103', 'قسم الكهرباء', '1/2', 'طارق مصطفى سالم', '01144455667', 'شبرا الخيمة - القليوبية'],
      ['إبراهيم سامح سيد جلال', '30707180106655', '2026104', 'قسم الميكانيكا', '1/3', 'سامح سيد جلال', '01555566778', 'الساحل - القاهرة'],
    ];

    processParsedData([sampleHeaders, ...sampleRows], 'بيانات_نموذجية.xlsx');
  };

  const handleExecuteImport = () => {
    if (mapping.fullNameIndex === -1 && mapping.nationalIdIndex === -1) {
      alert('يرجى تحديد عمود اسم الطالب أو عمود الرقم القومي على الأقل');
      return;
    }

    setIsProcessing(true);
    try {
      const selectedDept = departments.find(d => d.id === defaultDepartmentId) || departments[0];
      const selectedCls = classes.find(c => c.id === defaultClassId) || classes[0];

      const rowsToImport = rawRows.map((row, idx) => {
        let fullName = mapping.fullNameIndex >= 0 ? (row[mapping.fullNameIndex] || '').trim() : '';
        let nationalId = mapping.nationalIdIndex >= 0 ? (row[mapping.nationalIdIndex] || '').trim() : '';
        let studentCode = mapping.studentCodeIndex >= 0 ? (row[mapping.studentCodeIndex] || '').trim() : '';
        let departmentName = mapping.departmentIndex >= 0 ? (row[mapping.departmentIndex] || '').trim() : (selectedDept?.name || '');
        let className = mapping.classIndex >= 0 ? (row[mapping.classIndex] || '').trim() : (selectedCls?.name || '');
        let guardianName = mapping.guardianNameIndex >= 0 ? (row[mapping.guardianNameIndex] || '').trim() : '';
        let guardianPhone = mapping.guardianPhoneIndex >= 0 ? (row[mapping.guardianPhoneIndex] || '').trim() : '';
        let address = mapping.addressIndex >= 0 ? (row[mapping.addressIndex] || '').trim() : '';
        let status = mapping.statusIndex >= 0 ? (row[mapping.statusIndex] || '').trim() : 'منتظم';

        // Auto-fix if fullName and nationalId were accidentally swapped in the file row
        if (/^\d{14}$/.test(fullName) && /[\u0600-\u06FF]/.test(nationalId)) {
          const temp = fullName;
          fullName = nationalId;
          nationalId = temp;
        }

        // If fullName is short code and studentCode is Arabic name
        if (/^\d+$/.test(fullName) && /[\u0600-\u06FF]/.test(studentCode)) {
          const temp = fullName;
          fullName = studentCode;
          studentCode = temp;
        }

        // If nationalId is missing or empty, generate a valid placeholder
        if (!nationalId) {
          nationalId = `3080101${String(Date.now() + idx).slice(-7)}`;
        }

        return {
          fullName: fullName || `طالب ${idx + 1}`,
          nationalId,
          studentCode,
          departmentCodeOrName: departmentName || selectedDept?.name || '',
          className: className || selectedCls?.name || '',
          guardianName: guardianName || 'ولي أمر الطالب',
          guardianPhone: guardianPhone || '01000000000',
          address: address || 'القاهرة',
          status: status || 'منتظم',
        };
      });

      const result = batchImportStudents(rowsToImport);
      setImportResult(result);
      setStep('result');
      if (result.addedCount > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setImportResult({ addedCount: 0, errors: [err.message || 'حدث خطأ أثناء معالجة البيانات'] });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAutoFixExisting = () => {
    const res = autoFixSwappedStudentFields();
    if (res.fixedCount > 0) {
      setRepairMessage(`تم بنجاح تصحيح واستعادة بيانات (${res.fixedCount}) طالب كانت أسماؤهم وأرقامهم القومية معكوسة!`);
      onImportSuccess();
    } else {
      setRepairMessage('جميع بيانات الطلاب الحالية سليمة ومتطابقة ولا يوجد أي تضارب!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                استيراد قوائم الطلاب الذكي (Excel / CSV)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                دعم ملفات Excel (.xlsx, .xls) و CSV مع محدد مطابقة الأعمدة الذكي التفاعلي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer font-bold text-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Data Repair Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">هل استوردت بيانات سابقة وظهرت الأسماء أو الأرقام مقلوبة؟</span>
              <p className="text-[11px] text-amber-700 font-normal">
                اضغط لتصحيح مواضع الأسماء والأكواد والأرقام القومية تلقائياً بنقرة واحدة
              </p>
            </div>
          </div>

          <button
            onClick={handleRunAutoFixExisting}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> إصلاح البيانات المقلوبة الآن
          </button>
        </div>

        {repairMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{repairMessage}</span>
          </div>
        )}

        {/* STEP 1: Upload Step */}
        {step === 'upload' && (
          <div className="space-y-5">
            {/* Instruction Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> ميزة المطابقة الذكية للأعمدة:
              </div>
              <p className="leading-relaxed text-slate-600 text-[12px]">
                يمكنك رفع أي ملف إكسيل صادر من موقع الوزارة أو الإدارة أو كشوف المدرسة بأي ترتيب للأعمدة. 
                سيقوم النظام بالتعرف على الأعمدة تلقائياً ويتيح لك مراجعتها وتعديلها ومعاينتها قبل الحفظ النهائي.
              </p>
            </div>

            {/* Drag and Drop / Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 group-hover:border-emerald-300 transition flex items-center justify-center text-emerald-600">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base">
                  اضغط هنا لاختيار ملف الطلاب من جهازك
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  يدعم ملفات Excel الرسمية (.xlsx, .xls) وملفات الشيت (.csv, .txt)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleLoadSample}
                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> تجربة كشف طلاب نموذجي جاهز
              </button>

              <button
                onClick={onClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2 rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Interactive Column Mapping & Live Preview Step */}
        {step === 'mapping' && (
          <div className="space-y-5">
            {/* File Info Bar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>الملف المحدد: <strong>{fileName}</strong> ({rawRows.length} صف طالب)</span>
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer"
              >
                تغيير الملف ↺
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> مطابقة أعمدة الملف مع بيانات المنظومة:
                </label>
                <span className="text-[11px] text-slate-400">
                  حدد العمود المطابق لكل حقل (تم التحديد الذكي تلقائياً)
                </span>
              </div>

              {/* Grid of Mappings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {/* 1. Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>👤 اسم الطالب الرباعي:</span>
                    <span className="text-[10px] text-red-600">* أساسي</span>
                  </label>
                  <select
                    value={mapping.fullNameIndex}
                    onChange={(e) => setMapping({ ...mapping, fullNameIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- اختر العمود --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. National ID */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>🆔 الرقم القومي (14 رقم):</span>
                    <span className="text-[10px] text-red-600">* أساسي</span>
                  </label>
                  <select
                    value={mapping.nationalIdIndex}
                    onChange={(e) => setMapping({ ...mapping, nationalIdIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- إنشاء تلقائي إذا لم يتوفر --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Student Code / Seating */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800">
                    🔢 كود الطالب / رقم الجلوس:
                  </label>
                  <select
                    value={mapping.studentCodeIndex}
                    onChange={(e) => setMapping({ ...mapping, studentCodeIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- توليد كود تلقائي --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Department */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800">
                    🔧 التخصص / القسم:
                  </label>
                  <select
                    value={mapping.departmentIndex}
                    onChange={(e) => setMapping({ ...mapping, departmentIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- استخدام القسم الافتراضي بالأسفل --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Class */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800">
                    🏫 الفصل:
                  </label>
                  <select
                    value={mapping.classIndex}
                    onChange={(e) => setMapping({ ...mapping, classIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- استخدام الفصل الافتراضي بالأسفل --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Guardian Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-800">
                    📱 تليفون ولي الأمر:
                  </label>
                  <select
                    value={mapping.guardianPhoneIndex}
                    onChange={(e) => setMapping({ ...mapping, guardianPhoneIndex: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value={-1}>-- غير محدد --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h} {rawRows[0]?.[i] ? `(مثال: ${rawRows[0][i].slice(0, 15)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Default Class / Dept Fallback Pickers */}
            <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-700 font-bold">
                في حال عدم وجود عمود للفصل أو القسم بالملف، يتم تسكين الطلاب على:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={defaultDepartmentId}
                  onChange={(e) => setDefaultDepartmentId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={defaultClassId}
                  onChange={(e) => setDefaultClassId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Preview of first 3 students */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" /> معاينة حية لشكل البيانات بعد المطابقة (أول {Math.min(3, rawRows.length)} طلاب):
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5 border-l border-slate-800">الاسم المستخرج</th>
                      <th className="p-2.5 border-l border-slate-800 text-center">الرقم القومي</th>
                      <th className="p-2.5 border-l border-slate-800 text-center">كود الطالب</th>
                      <th className="p-2.5 border-l border-slate-800 text-center">الفصل</th>
                      <th className="p-2.5 border-l border-slate-800 text-center">القسم</th>
                      <th className="p-2.5 text-center">الهاتف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {rawRows.slice(0, 3).map((row, idx) => {
                      const name = mapping.fullNameIndex >= 0 ? row[mapping.fullNameIndex] : '(مفقود)';
                      const nid = mapping.nationalIdIndex >= 0 ? row[mapping.nationalIdIndex] : '(توليد تلقائي)';
                      const code = mapping.studentCodeIndex >= 0 ? row[mapping.studentCodeIndex] : '(توليد تلقائي)';
                      const cls = mapping.classIndex >= 0 ? row[mapping.classIndex] : classes.find(c => c.id === defaultClassId)?.name;
                      const dept = mapping.departmentIndex >= 0 ? row[mapping.departmentIndex] : departments.find(d => d.id === defaultDepartmentId)?.name;
                      const phone = mapping.guardianPhoneIndex >= 0 ? row[mapping.guardianPhoneIndex] : '-';

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 border-l border-slate-100 font-sans font-bold text-slate-900">
                            {name}
                          </td>
                          <td className="p-2.5 border-l border-slate-100 text-center text-slate-700 font-bold">
                            {nid}
                          </td>
                          <td className="p-2.5 border-l border-slate-100 text-center text-blue-700 font-bold">
                            {code}
                          </td>
                          <td className="p-2.5 border-l border-slate-100 text-center font-sans text-slate-700">
                            {cls}
                          </td>
                          <td className="p-2.5 border-l border-slate-100 text-center font-sans text-slate-700">
                            {dept}
                          </td>
                          <td className="p-2.5 text-center text-slate-500">
                            {phone}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setStep('upload')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                رجوع للخلف
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {isProcessing ? 'جارٍ الاستيراد والحفظ...' : `استيراد وحفظ (${rawRows.length}) طالب`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Result Summary Step */}
        {step === 'result' && importResult && (
          <div className="space-y-5 text-center py-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${importResult.addedCount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {importResult.addedCount > 0 ? <CheckCircle2 className="w-9 h-9" /> : <AlertTriangle className="w-9 h-9" />}
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-lg">
                {importResult.addedCount > 0 ? 'اكتملت معالجة وتسكين ملف الطلاب بنجاح!' : 'لم تتم إضافة أي طالب جديد'}
              </h4>
              <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                  ✅ تم قيد: <strong>{importResult.addedCount}</strong> طالب
                </span>
                {(importResult.createdDepartmentsCount ?? 0) > 0 && (
                  <span className="bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                    🏭 تم إنشاء: <strong>{importResult.createdDepartmentsCount}</strong> تخصص جديد تلقائياً
                  </span>
                )}
                {(importResult.createdClassesCount ?? 0) > 0 && (
                  <span className="bg-purple-50 text-purple-800 border border-purple-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                    🏫 تم فتح: <strong>{importResult.createdClassesCount}</strong> فصل جديد تلقائياً
                  </span>
                )}
                {(importResult.skippedCount ?? 0) > 0 && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                    ⚠️ تم تخطي: <strong>{importResult.skippedCount}</strong> طالب مكرر
                  </span>
                )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right text-xs space-y-2 max-h-48 overflow-y-auto">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> تقرير الفحص وتخطي التكرار:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-mono">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                إغلاق وفتح القوائم
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
