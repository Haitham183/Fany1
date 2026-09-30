import Dexie, { type Table } from 'dexie';
import {
  Student,
  User,
  Department,
  SchoolClass,
  AttendanceRecord,
  OfficialNotice,
  CompetencyUnit,
  StudentCompetencyAssessment,
  CompetencyVerificationRecord,
  StudentPortfolioRecord,
  SocialCaseRecord,
  WorkshopViolationRecord,
  StudentTransferLog,
  AuditLogEntry,
  GrievanceRecord,
  AssessmentCalendarEvent,
  SchoolConfig,
  OfflineMediaEvidence,
} from '@/types';

export interface PendingSyncItem {
  id?: number;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  createdAt: string;
}

export class EgyptianSchoolDatabase extends Dexie {
  students!: Table<Student, string>;
  users!: Table<User, string>;
  departments!: Table<Department, string>;
  classes!: Table<SchoolClass, string>;
  attendance!: Table<AttendanceRecord, string>;
  notices!: Table<OfficialNotice, string>;
  competency_units!: Table<CompetencyUnit, string>;
  competency_assessments!: Table<StudentCompetencyAssessment, string>;
  competency_verifications!: Table<CompetencyVerificationRecord, string>;
  student_portfolios!: Table<StudentPortfolioRecord, string>;
  social_cases!: Table<SocialCaseRecord, string>;
  workshop_violations!: Table<WorkshopViolationRecord, string>;
  transfer_logs!: Table<StudentTransferLog, string>;
  audit_log!: Table<AuditLogEntry, string>;
  grievances!: Table<GrievanceRecord, string>;
  assessment_calendar!: Table<AssessmentCalendarEvent, string>;
  school_settings!: Table<SchoolConfig, string>;
  pending_sync_queue!: Table<PendingSyncItem, number>;
  media_evidence!: Table<OfflineMediaEvidence, string>;

  constructor() {
    super('EgyptianSchoolDB_v2');
    this.version(1).stores({
      students: 'id, nationalId, nationalIdHash, studentCode, fullName, gradeLevel, departmentId, classId, status, parentAccessCode, updated_at',
      users: 'id, username, role, departmentId, schoolId, isInternalVerifier, updated_at',
      departments: 'id, code, name, schoolId, updated_at',
      classes: 'id, name, departmentId, gradeLevel, schoolId, updated_at',
      attendance: 'id, studentId, classId, date, periodType, periodNumber, status, updated_at, [studentId+date]',
      notices: 'id, studentId, noticeType, serialNumber, issueDate, updated_at',
      competency_units: 'id, code, departmentId, gradeLevel, term, updated_at',
      competency_assessments: 'id, studentId, unitId, outcomeId, result, updated_at, [studentId+unitId+outcomeId]',
      competency_verifications: 'id, verificationType, unitId, departmentId, date, updated_at',
      student_portfolios: 'id, studentId, classId, departmentId, updated_at',
      social_cases: 'id, studentId, status, priority, category, referralDate, updated_at',
      workshop_violations: 'id, studentId, classId, date, violationType, updated_at',
      transfer_logs: 'id, studentId, date, updated_at',
      audit_log: 'id, school_id, actor_id, action, entity, entity_id, created_at',
      grievances: 'id, studentId, unitId, status, submissionDate, created_at, updated_at',
      assessment_calendar: 'id, eventType, startDate, endDate, created_at, updated_at',
      school_settings: 'id, name, updated_at',
      pending_sync_queue: '++id, tableName, recordId, action, createdAt',
      media_evidence: 'id, category, studentId, classId, departmentId, isSynced, createdAt',
    });
  }
}

export const db = new EgyptianSchoolDatabase();
