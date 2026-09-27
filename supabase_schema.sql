-- =========================================================================
-- EGYPTIAN VOCATIONAL SCHOOL MANAGEMENT SYSTEM
-- Supabase Schema & Realtime Tables Definition
-- =========================================================================

-- 1. System Config Table
CREATE TABLE IF NOT EXISTS school_config (
  id TEXT PRIMARY KEY DEFAULT 'config_primary',
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS school_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  role_title TEXT,
  phone TEXT,
  department_id TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  department_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_code TEXT UNIQUE,
  national_id TEXT,
  full_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  class_id TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Official Notices Table
CREATE TABLE IF NOT EXISTS official_notices (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  notice_type TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Workshop Violations Table
CREATE TABLE IF NOT EXISTS workshop_violations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  violation_type TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Competency Units Table
CREATE TABLE IF NOT EXISTS competency_units (
  id TEXT PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL,
  department_id TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Competency Assessments Table
CREATE TABLE IF NOT EXISTS competency_assessments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  outcome_id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Social Specialist Cases Table
CREATE TABLE IF NOT EXISTS social_cases (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT,
  category TEXT,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) and allow public read/write for school staff
ALTER TABLE school_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on school_config" ON school_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on school_users" ON school_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on departments" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on official_notices" ON official_notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on workshop_violations" ON workshop_violations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on competency_units" ON competency_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on competency_assessments" ON competency_assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on social_cases" ON social_cases FOR ALL USING (true) WITH CHECK (true);

