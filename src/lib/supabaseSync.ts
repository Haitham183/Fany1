import { supabase, isSupabaseConfigured } from './supabase';
import { db } from './db';
import {
  getSchoolConfig,
  getUsers,
  getStudents,
  getDepartments,
  getClasses,
  getAttendance,
  getNotices,
  getWorkshopViolations,
  getCompetencyUnits,
  getCompetencyAssessments,
  getSocialCases,
  updateInMemoryStudentsCache,
  updateInMemorySocialCasesCache,
} from './storage';

export type SyncStatusType = 'synced' | 'syncing' | 'error' | 'connected' | 'offline';

export interface SyncStatusDetail {
  status: SyncStatusType;
  message: string;
  lastSyncedAt?: Date;
}

let isApplyingRemoteUpdate = false;
let currentSyncStatus: SyncStatusDetail = {
  status: isSupabaseConfigured ? 'connected' : 'offline',
  message: isSupabaseConfigured ? 'متصل بالسحابة' : 'وضع غير متصل',
};

export const setRemoteSyncFlag = (val: boolean) => {
  isApplyingRemoteUpdate = val;
};

export const getRemoteSyncFlag = () => isApplyingRemoteUpdate;

export const notifySyncStatus = (status: SyncStatusType, message?: string) => {
  const defaultMessages: Record<SyncStatusType, string> = {
    synced: 'تمت المزامنة وحفظ التعديلات بالسحابة 🟢',
    syncing: 'جارٍ حفظ التحديثات بالسحابة... 🔄',
    error: 'تعذر الاتصال بقاعدة البيانات السحابية ⚠️',
    connected: 'قاعدة البيانات السحابية متصلة وجاهزة 🟢',
    offline: 'العمل في الوضع المحلي (غير متصل بالسحابة) ⚪',
  };

  currentSyncStatus = {
    status,
    message: message || defaultMessages[status],
    lastSyncedAt: status === 'synced' ? new Date() : currentSyncStatus.lastSyncedAt,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('egyptian_school_sync_status', {
        detail: currentSyncStatus,
      })
    );
  }
};

export const getCurrentSyncStatus = () => currentSyncStatus;

/**
 * Pushes all current local school data to the Supabase Cloud Database.
 */
export const pushAllDataToCloud = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'مفاتيح Supabase غير مفعلة في المشروع.' };
  }

  try {
    notifySyncStatus('syncing', 'جارٍ رفع ومزامنة كافة بيانات المدرسة إلى السحابة...');
    const config = getSchoolConfig();
    const users = getUsers();
    const students = getStudents();
    const departments = getDepartments();
    const classes = getClasses();
    const attendance = getAttendance();
    const notices = getNotices();
    const violations = getWorkshopViolations();
    const units = getCompetencyUnits();
    const assessments = getCompetencyAssessments();

    // 1. Config
    await supabase.from('school_config').upsert({
      id: 'config_primary',
      data: config,
      updated_at: new Date().toISOString(),
    });

    // 2. Users
    if (users.length > 0) {
      await supabase.from('school_users').upsert(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          role_title: u.roleTitle,
          phone: u.phone || '',
          department_id: u.departmentId || null,
          data: u,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 3. Departments
    if (departments.length > 0) {
      await supabase.from('departments').upsert(
        departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          data: d,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 4. Classes
    if (classes.length > 0) {
      await supabase.from('classes').upsert(
        classes.map((c) => ({
          id: c.id,
          name: c.name,
          grade_level: c.gradeLevel,
          department_id: c.departmentId,
          data: c,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 5. Students
    if (students.length > 0) {
      await supabase.from('students').upsert(
        students.map((s) => ({
          id: s.id,
          student_code: s.studentCode,
          national_id: s.nationalId,
          full_name: s.fullName,
          class_id: s.classId,
          department_id: s.departmentId,
          data: s,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 6. Attendance
    if (attendance.length > 0) {
      await supabase.from('attendance_records').upsert(
        attendance.map((a) => ({
          id: a.id,
          student_id: a.studentId,
          date: a.date,
          class_id: a.classId,
          status: a.status,
          data: a,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 7. Notices
    if (notices.length > 0) {
      await supabase.from('official_notices').upsert(
        notices.map((n) => ({
          id: n.id,
          student_id: n.studentId,
          notice_type: n.noticeType,
          data: n,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 8. Violations
    if (violations.length > 0) {
      await supabase.from('workshop_violations').upsert(
        violations.map((v) => ({
          id: v.id,
          student_id: v.studentId,
          violation_type: v.violationType,
          data: v,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 9. Competency Units
    if (units.length > 0) {
      await supabase.from('competency_units').upsert(
        units.map((u) => ({
          id: u.id,
          code: u.code,
          name: u.name,
          department_id: u.departmentId,
          grade_level: u.gradeLevel,
          data: u,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 10. Competency Assessments
    if (assessments.length > 0) {
      await supabase.from('competency_assessments').upsert(
        assessments.map((a) => ({
          id: a.id,
          student_id: a.studentId,
          unit_id: a.unitId,
          outcome_id: a.outcomeId,
          data: a,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    // 11. Social Cases
    const socialCases = getSocialCases();
    if (socialCases.length > 0) {
      await supabase.from('social_cases').upsert(
        socialCases.map((s) => ({
          id: s.id,
          student_id: s.studentId,
          status: s.status,
          priority: s.priority,
          category: s.category,
          data: s,
          updated_at: new Date().toISOString(),
        }))
      );
    }

    notifySyncStatus('synced', 'تم حفظ ومزامنة كافة بيانات المدرسة بالسحابة 🟢');
    return { success: true, message: 'تم رفع ومزامنة كافة بيانات المدرسة إلى السحابة بنجاح!' };
  } catch (error: any) {
    console.error('Error pushing data to Supabase:', error);
    notifySyncStatus('error', 'حدث خطأ أثناء المزامنة مع السحابة');
    return { success: false, message: error.message || 'حدث خطأ أثناء الرفع إلى السحابة.' };
  }
};

/**
 * Wipes all student, attendance, notices, violations, and assessment records from Supabase Cloud.
 */
export const wipeCloudDatabase = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, message: 'مفاتيح Supabase غير مفعلة.' };
  }

  try {
    notifySyncStatus('syncing', 'جارٍ تفريغ وتصفير كافة جداول قاعدة البيانات السحابية...');

    // Delete all operational rows from Supabase using not('id', 'is', null)
    await Promise.allSettled([
      supabase.from('students').delete().not('id', 'is', null),
      supabase.from('attendance_records').delete().not('id', 'is', null),
      supabase.from('official_notices').delete().not('id', 'is', null),
      supabase.from('workshop_violations').delete().not('id', 'is', null),
      supabase.from('competency_assessments').delete().not('id', 'is', null),
      supabase.from('social_cases').delete().not('id', 'is', null),
      supabase.from('classes').delete().not('id', 'is', null),
      supabase.from('departments').delete().not('id', 'is', null),
    ]);

    // Reseed clean departments with 0 students and clean classes with 0 count
    const cleanDepts = getDepartments().map((d) => ({ ...d, totalStudents: 0 }));
    const cleanClasses = getClasses().map((c) => ({ ...c, studentCount: 0 }));
    const config = getSchoolConfig();

    await Promise.allSettled([
      supabase.from('departments').upsert(
        cleanDepts.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          data: d,
          updated_at: new Date().toISOString(),
        }))
      ),
      supabase.from('classes').upsert(
        cleanClasses.map((c) => ({
          id: c.id,
          name: c.name,
          grade_level: c.gradeLevel,
          department_id: c.departmentId,
          data: c,
          updated_at: new Date().toISOString(),
        }))
      ),
      supabase.from('school_config').upsert({
        id: 'config_primary',
        data: config,
        updated_at: new Date().toISOString(),
      }),
    ]);

    notifySyncStatus('synced', 'تم تفريغ السحابة وتصفيرها بالكامل للإنتاج (0 طلاب) 🟢');
    return { success: true, message: 'تم تصفير وتطهير قاعدة البيانات السحابية بنجاح' };
  } catch (error: any) {
    console.error('Error wiping cloud database:', error);
    notifySyncStatus('error', 'تعذر تفريغ قاعدة البيانات السحابية');
    return { success: false, message: error.message || 'حدث خطأ أثناء تصفير السحابة' };
  }
};

/**
 * Pulls latest data from Supabase and syncs local storage and Dexie.
 */
export const pullAllDataFromCloud = async (isBackground = false): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'مفاتيح Supabase غير مفعلة.' };
  }

  try {
    if (!isBackground) {
      notifySyncStatus('syncing', 'جارٍ تحميل وتحديث البيانات من السحابة...');
    }

    let hasAnyCloudData = false;

    // 1. Config
    const { data: configRows } = await supabase.from('school_config').select('data').limit(1);
    if (configRows && configRows.length > 0 && configRows[0]?.data) {
      hasAnyCloudData = true;
      localStorage.setItem('egyptian_school_config', JSON.stringify(configRows[0].data));
    }

    // 2. Users
    const { data: userRows } = await supabase.from('school_users').select('data');
    if (userRows && userRows.length > 0) {
      hasAnyCloudData = true;
      localStorage.setItem('egyptian_school_users', JSON.stringify(userRows.map((r) => r.data)));
    }

    // 3. Departments
    const { data: deptRows } = await supabase.from('departments').select('data');
    if (deptRows && deptRows.length > 0) {
      hasAnyCloudData = true;
      localStorage.setItem('egyptian_school_departments', JSON.stringify(deptRows.map((r) => r.data)));
    }

    // 4. Classes
    const { data: classRows } = await supabase.from('classes').select('data');
    if (classRows && classRows.length > 0) {
      hasAnyCloudData = true;
      localStorage.setItem('egyptian_school_classes', JSON.stringify(classRows.map((r) => r.data)));
    }

    // 5. Students
    const { data: studentRows } = await supabase.from('students').select('data');
    if (studentRows) {
      const parsedStudents = studentRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_students', JSON.stringify(parsedStudents));
      updateInMemoryStudentsCache(parsedStudents);
      if (studentRows.length > 0) hasAnyCloudData = true;
      try {
        await db.students.clear();
        if (parsedStudents.length > 0) {
          await db.students.bulkPut(parsedStudents);
        }
      } catch {}
    }

    // 6. Attendance
    const { data: attRows } = await supabase.from('attendance_records').select('data');
    if (attRows) {
      const parsedAtt = attRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_attendance', JSON.stringify(parsedAtt));
      if (attRows.length > 0) hasAnyCloudData = true;
      try {
        await db.attendance.clear();
        if (parsedAtt.length > 0) {
          await db.attendance.bulkPut(parsedAtt);
        }
      } catch {}
    }

    // 7. Notices
    const { data: notRows } = await supabase.from('official_notices').select('data');
    if (notRows) {
      const parsedNotices = notRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_notices', JSON.stringify(parsedNotices));
      if (notRows.length > 0) hasAnyCloudData = true;
      try {
        await db.notices.clear();
        if (parsedNotices.length > 0) {
          await db.notices.bulkPut(parsedNotices);
        }
      } catch {}
    }

    // 8. Violations
    const { data: vioRows } = await supabase.from('workshop_violations').select('data');
    if (vioRows) {
      const parsedVio = vioRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_workshop_violations', JSON.stringify(parsedVio));
      if (vioRows.length > 0) hasAnyCloudData = true;
      try {
        await db.workshop_violations.clear();
        if (parsedVio.length > 0) {
          await db.workshop_violations.bulkPut(parsedVio);
        }
      } catch {}
    }

    // 9. Competency Units
    const { data: unitRows } = await supabase.from('competency_units').select('data');
    if (unitRows && unitRows.length > 0) {
      hasAnyCloudData = true;
      localStorage.setItem('egyptian_school_competency_units', JSON.stringify(unitRows.map((r) => r.data)));
    }

    // 10. Competency Assessments
    const { data: assRows } = await supabase.from('competency_assessments').select('data');
    if (assRows) {
      const parsedAss = assRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_competency_assessments', JSON.stringify(parsedAss));
      if (assRows.length > 0) hasAnyCloudData = true;
      try {
        await db.competency_assessments.clear();
        if (parsedAss.length > 0) {
          await db.competency_assessments.bulkPut(parsedAss);
        }
      } catch {}
    }

    // 11. Social Cases
    const { data: socRows } = await supabase.from('social_cases').select('data');
    if (socRows) {
      const parsedSoc = socRows.map((r) => r.data).filter(Boolean);
      localStorage.setItem('egyptian_school_social_cases', JSON.stringify(parsedSoc));
      updateInMemorySocialCasesCache(parsedSoc);
      if (socRows.length > 0) hasAnyCloudData = true;
      try {
        await db.social_cases.clear();
        if (parsedSoc.length > 0) {
          await db.social_cases.bulkPut(parsedSoc);
        }
      } catch {}
    }

    // If cloud is totally blank on first run and local has non-empty state and is NOT production mode, push local defaults
    const isProduction = typeof window !== 'undefined' && localStorage.getItem('egyptian_school_production_mode') === 'true';
    if (!hasAnyCloudData && !isProduction) {
      console.log('Cloud database is empty, initializing with local defaults...');
      await pushAllDataToCloud();
    } else {
      isApplyingRemoteUpdate = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('egyptian_school_storage_update'));
      }
      isApplyingRemoteUpdate = false;
    }

    notifySyncStatus('synced', 'البيانات متطابقة ومحدثة مع السحابة 🟢');
    return { success: true, message: 'تم استيراد ومزامنة أحدث البيانات من السحابة بنجاح!' };
  } catch (error: any) {
    console.error('Error pulling data from Supabase:', error);
    notifySyncStatus('error', 'تعذر تحميل البيانات من السحابة');
    return { success: false, message: error.message || 'حدث خطأ أثناء جلب البيانات من السحابة.' };
  }
};

/**
 * Direct sync for a single entity table when local state changes.
 */
const syncKeyDirectlyToCloud = async (key: string, data: any) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    switch (key) {
      case 'egyptian_school_config':
        await supabase.from('school_config').upsert({
          id: 'config_primary',
          data,
          updated_at: new Date().toISOString(),
        });
        break;

      case 'egyptian_school_users':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('school_users').delete().not('id', 'is', null);
          } else {
            await supabase.from('school_users').upsert(
              data.map((u: any) => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role,
                role_title: u.roleTitle,
                phone: u.phone || '',
                department_id: u.departmentId || null,
                data: u,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_departments':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('departments').delete().not('id', 'is', null);
          } else {
            await supabase.from('departments').upsert(
              data.map((d: any) => ({
                id: d.id,
                name: d.name,
                code: d.code,
                data: d,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_classes':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('classes').delete().not('id', 'is', null);
          } else {
            await supabase.from('classes').upsert(
              data.map((c: any) => ({
                id: c.id,
                name: c.name,
                grade_level: c.gradeLevel,
                department_id: c.departmentId,
                data: c,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_students':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('students').delete().not('id', 'is', null);
          } else {
            await supabase.from('students').upsert(
              data.map((s: any) => ({
                id: s.id,
                student_code: s.studentCode,
                national_id: s.nationalId,
                full_name: s.fullName,
                class_id: s.classId,
                department_id: s.departmentId,
                data: s,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_attendance':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('attendance_records').delete().not('id', 'is', null);
          } else {
            await supabase.from('attendance_records').upsert(
              data.map((a: any) => ({
                id: a.id,
                student_id: a.studentId,
                date: a.date,
                class_id: a.classId,
                status: a.status,
                data: a,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_notices':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('official_notices').delete().not('id', 'is', null);
          } else {
            await supabase.from('official_notices').upsert(
              data.map((n: any) => ({
                id: n.id,
                student_id: n.studentId,
                notice_type: n.noticeType,
                data: n,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_workshop_violations':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('workshop_violations').delete().not('id', 'is', null);
          } else {
            await supabase.from('workshop_violations').upsert(
              data.map((v: any) => ({
                id: v.id,
                student_id: v.studentId,
                violation_type: v.violationType,
                data: v,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_competency_units':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('competency_units').delete().not('id', 'is', null);
          } else {
            await supabase.from('competency_units').upsert(
              data.map((u: any) => ({
                id: u.id,
                code: u.code,
                name: u.name,
                department_id: u.departmentId,
                grade_level: u.gradeLevel,
                data: u,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_competency_assessments':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('competency_assessments').delete().not('id', 'is', null);
          } else {
            await supabase.from('competency_assessments').upsert(
              data.map((a: any) => ({
                id: a.id,
                student_id: a.studentId,
                unit_id: a.unitId,
                outcome_id: a.outcomeId,
                data: a,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;

      case 'egyptian_school_social_cases':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            await supabase.from('social_cases').delete().not('id', 'is', null);
          } else {
            await supabase.from('social_cases').upsert(
              data.map((s: any) => ({
                id: s.id,
                student_id: s.studentId,
                status: s.status,
                priority: s.priority,
                category: s.category,
                data: s,
                updated_at: new Date().toISOString(),
              }))
            );
          }
        }
        break;
    }
  } catch (err) {
    console.error(`Error in syncKeyDirectlyToCloud for ${key}:`, err);
    throw err;
  }
};

/**
 * Debounce timers map to avoid flooding the cloud with requests during rapid keystrokes.
 */
const debounceTimers: Record<string, NodeJS.Timeout> = {};

/**
 * Automatically syncs a key to the cloud in the background with debouncing.
 */
export const autoSyncKeyToCloud = (key: string, data: any) => {
  if (isApplyingRemoteUpdate) return;
  if (!isSupabaseConfigured || !supabase) return;

  const validKeys = [
    'egyptian_school_config',
    'egyptian_school_users',
    'egyptian_school_students',
    'egyptian_school_departments',
    'egyptian_school_classes',
    'egyptian_school_attendance',
    'egyptian_school_notices',
    'egyptian_school_workshop_violations',
    'egyptian_school_competency_units',
    'egyptian_school_competency_assessments',
    'egyptian_school_social_cases',
  ];

  if (!validKeys.includes(key)) return;

  notifySyncStatus('syncing');

  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }

  debounceTimers[key] = setTimeout(async () => {
    try {
      await syncKeyDirectlyToCloud(key, data);
      notifySyncStatus('synced');
    } catch (error) {
      console.error(`Auto-sync failed for ${key}:`, error);
      notifySyncStatus('error');
    }
  }, 250);
};

/**
 * Delete a specific row from Supabase when deleted locally.
 */
export const deleteRowFromCloud = async (tableName: string, id: string) => {
  if (isApplyingRemoteUpdate || !isSupabaseConfigured || !supabase) return;
  try {
    notifySyncStatus('syncing');
    await supabase.from(tableName).delete().eq('id', id);
    notifySyncStatus('synced');
  } catch (error) {
    console.error(`Failed to delete row ${id} from table ${tableName} on cloud:`, error);
    notifySyncStatus('error');
  }
};

/**
 * Setup Realtime multi-device synchronization listener.
 */
export const setupRealtimeSync = (onRemoteUpdate?: () => void) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const tableToStorageKey: Record<string, string> = {
    school_config: 'egyptian_school_config',
    school_users: 'egyptian_school_users',
    departments: 'egyptian_school_departments',
    classes: 'egyptian_school_classes',
    students: 'egyptian_school_students',
    attendance_records: 'egyptian_school_attendance',
    official_notices: 'egyptian_school_notices',
    workshop_violations: 'egyptian_school_workshop_violations',
    competency_units: 'egyptian_school_competency_units',
    competency_assessments: 'egyptian_school_competency_assessments',
    social_cases: 'egyptian_school_social_cases',
  };

  const tables = Object.keys(tableToStorageKey);

  const channel = supabase.channel('egyptian_school_realtime_sync');

  tables.forEach((table) => {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => {
        const storageKey = tableToStorageKey[table];
        if (!storageKey) return;

        try {
          isApplyingRemoteUpdate = true;

          if (table === 'school_config') {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (payload.new && (payload.new as any).data) {
                localStorage.setItem(storageKey, JSON.stringify((payload.new as any).data));
              }
            }
          } else {
            // Array-based tables
            const currentRaw = localStorage.getItem(storageKey);
            let currentList: any[] = currentRaw ? JSON.parse(currentRaw) : [];

            if (payload.eventType === 'INSERT') {
              const newItem = (payload.new as any)?.data;
              if (newItem) {
                const existingIndex = currentList.findIndex((item) => item.id === (payload.new as any).id);
                if (existingIndex >= 0) {
                  currentList[existingIndex] = newItem;
                } else {
                  currentList.push(newItem);
                }
                localStorage.setItem(storageKey, JSON.stringify(currentList));
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedItem = (payload.new as any)?.data;
              if (updatedItem) {
                const existingIndex = currentList.findIndex((item) => item.id === (payload.new as any).id);
                if (existingIndex >= 0) {
                  currentList[existingIndex] = updatedItem;
                } else {
                  currentList.push(updatedItem);
                }
                localStorage.setItem(storageKey, JSON.stringify(currentList));
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as any)?.id;
              if (deletedId) {
                currentList = currentList.filter((item) => item.id !== deletedId);
                localStorage.setItem(storageKey, JSON.stringify(currentList));
              }
            }

            if (storageKey === 'egyptian_school_students') {
              updateInMemoryStudentsCache(currentList);
            }
            if (storageKey === 'egyptian_school_social_cases') {
              updateInMemorySocialCasesCache(currentList);
            }
          }

          // Trigger UI updates
          window.dispatchEvent(new Event('egyptian_school_storage_update'));
          if (onRemoteUpdate) {
            onRemoteUpdate();
          }
          notifySyncStatus('synced', 'تم استلام وتحديث بيانات جديدة من جهاز آخر 🔄');
        } catch (err) {
          console.error(`Error processing realtime event for ${table}:`, err);
        } finally {
          isApplyingRemoteUpdate = false;
        }
      }
    );
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      notifySyncStatus('connected', 'المزامنة اللحظية بين الأجهزة متصلة 🟢');
    }
  });

  return () => {
    supabase?.removeChannel(channel);
  };
};
