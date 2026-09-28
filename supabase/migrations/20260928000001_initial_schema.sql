-- ==============================================================================
-- Migration 001: Initial Schema for Egyptian CBE TVET School Management System
-- Version: 2.0.0
-- ==============================================================================

-- 1. Enable UUID and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    directorate VARCHAR(255) NOT NULL,
    administration VARCHAR(255) NOT NULL,
    system_type VARCHAR(50) DEFAULT '3_years',
    header_image_url TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.school_users (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    role_title VARCHAR(100),
    department_id VARCHAR(100),
    assigned_class_ids TEXT[] DEFAULT '{}',
    phone VARCHAR(30),
    is_internal_verifier BOOLEAN DEFAULT FALSE,
    external_verifier_expires_at TIMESTAMPTZ,
    custom_permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- 4. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scientific_supervisor_name VARCHAR(255),
    practical_supervisor_name VARCHAR(255),
    icon_name VARCHAR(50) DEFAULT 'Wrench',
    workshop_count INT DEFAULT 2,
    available_grades INT[] DEFAULT '{1,2,3}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- 5. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    department_id VARCHAR(100) REFERENCES public.departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 5),
    grade_name VARCHAR(100),
    supervisor_teacher_id VARCHAR(100),
    supervisor_teacher_name VARCHAR(255),
    room_number VARCHAR(100),
    student_count INT DEFAULT 0,
    shift VARCHAR(20) DEFAULT 'morning',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- 6. Students Table (with encrypted national_id and hash column)
CREATE TABLE IF NOT EXISTS public.students (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    national_id_encrypted BYTEA,
    national_id_hash VARCHAR(64) NOT NULL,
    student_code VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 5),
    department_id VARCHAR(100) REFERENCES public.departments(id) ON DELETE SET NULL,
    class_id VARCHAR(100) REFERENCES public.classes(id) ON DELETE SET NULL,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    guardian_job VARCHAR(100),
    address TEXT,
    status VARCHAR(50) DEFAULT 'منتظم',
    enrollment_date DATE DEFAULT CURRENT_DATE,
    birth_date DATE,
    parent_access_code VARCHAR(20),
    parent_otp VARCHAR(10),
    parent_code_expires_at TIMESTAMPTZ,
    total_absence_days INT DEFAULT 0,
    consecutive_absence_days INT DEFAULT 0,
    excused_absence_days INT DEFAULT 0,
    workshop_absence_hours INT DEFAULT 0,
    theoretical_absence_days INT DEFAULT 0,
    workshop_escape_count INT DEFAULT 0,
    warning_level INT DEFAULT 0 CHECK (warning_level BETWEEN 0 AND 3),
    last_absence_date DATE,
    notes TEXT,
    competency_status VARCHAR(50) DEFAULT 'eligible',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_national_id_hash ON public.students(national_id_hash);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON public.students(department_id);

-- 7. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES public.students(id) ON DELETE CASCADE,
    class_id VARCHAR(100) REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_of_week VARCHAR(30),
    period_type VARCHAR(30) NOT NULL, -- 'theoretical' | 'workshop'
    period_number INT DEFAULT 1,
    status VARCHAR(30) NOT NULL, -- 'present' | 'absent' | 'late' | 'excused' | 'escaped' | 'holiday'
    notes TEXT,
    recorded_by_teacher_id VARCHAR(100),
    recorded_by_teacher_name VARCHAR(255),
    is_verified_by_affairs BOOLEAN DEFAULT FALSE,
    official_excuse_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance_records(class_id, date);

-- 8. Competency Units & Outcomes
CREATE TABLE IF NOT EXISTS public.competency_units (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'technical_core',
    department_id VARCHAR(100) REFERENCES public.departments(id) ON DELETE CASCADE,
    grade_level INT NOT NULL,
    term VARCHAR(30) DEFAULT 'term_1',
    outcomes_count INT DEFAULT 2,
    total_hours INT DEFAULT 36,
    outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- 9. Student Competency Assessments
CREATE TABLE IF NOT EXISTS public.competency_assessments (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES public.students(id) ON DELETE CASCADE,
    unit_id VARCHAR(100) REFERENCES public.competency_units(id) ON DELETE CASCADE,
    outcome_id VARCHAR(100) NOT NULL,
    outcome_code VARCHAR(50),
    outcome_title VARCHAR(255),
    result VARCHAR(50) NOT NULL DEFAULT 'pending',
    has_performance_evidence BOOLEAN DEFAULT FALSE,
    has_product_evidence BOOLEAN DEFAULT FALSE,
    has_knowledge_evidence BOOLEAN DEFAULT FALSE,
    first_attempt_date DATE,
    second_attempt_date DATE,
    remedial_date DATE,
    assessor_teacher_name VARCHAR(255),
    internal_verifier_name VARCHAR(255),
    internal_verifier_signed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_assessments_student_unit ON public.competency_assessments(student_id, unit_id);

-- 10. Audit Log Table (Insert-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable updates and deletes on audit_logs
CREATE OR REPLACE RULE no_update_audit_logs AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit_logs AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- 11. Grievances Log Table
CREATE TABLE IF NOT EXISTS public.grievances (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES public.students(id) ON DELETE CASCADE,
    unit_id VARCHAR(100) REFERENCES public.competency_units(id) ON DELETE CASCADE,
    outcome_id VARCHAR(100),
    submission_date DATE DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    decision TEXT,
    decision_date DATE,
    decided_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- 12. Assessment Calendar Table
CREATE TABLE IF NOT EXISTS public.assessment_calendar (
    id VARCHAR(100) PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    target_grade_level INT,
    department_id VARCHAR(100),
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);
