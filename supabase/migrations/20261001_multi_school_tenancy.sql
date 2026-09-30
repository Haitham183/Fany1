-- =========================================================================
-- Multi-School Tenancy & Directorate Management Migration
-- Egyptian Technical Secondary Schools System
-- =========================================================================

-- 1. Create Schools Tenant Table
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  directorate VARCHAR NOT NULL,
  administration VARCHAR NOT NULL,
  system_type VARCHAR DEFAULT '3_years',
  shift_type VARCHAR DEFAULT 'single_morning',
  work_days_scheme VARCHAR DEFAULT 'sun_to_thu',
  logo_url TEXT,
  header_image_url TEXT,
  address TEXT,
  phone VARCHAR,
  principal_name VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add school_id to all operational tables if not exists
ALTER TABLE IF EXISTS school_users ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS departments ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS classes ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS students ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS attendance_records ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS official_notices ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS workshop_violations ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS competency_assessments ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS social_cases ADD COLUMN IF NOT EXISTS school_id VARCHAR REFERENCES schools(id) ON DELETE CASCADE;

-- 3. Create high-performance multi-tenant indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_departments_school_id ON departments(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance_records(school_id);
CREATE INDEX IF NOT EXISTS idx_notices_school_id ON official_notices(school_id);
CREATE INDEX IF NOT EXISTS idx_violations_school_id ON workshop_violations(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_school_id ON competency_assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_social_cases_school_id ON social_cases(school_id);

-- 4. Enable Row Level Security (RLS) for tenant isolation
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_cases ENABLE ROW LEVEL SECURITY;

-- 5. Default Public Access Policies (adaptable for Supabase Auth JWT school_id claims)
CREATE POLICY "Allow public read access on schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on schools" ON schools FOR ALL USING (true);

CREATE POLICY "Tenant Isolation on Students" ON students FOR ALL USING (
  school_id IS NULL OR school_id = COALESCE(auth.jwt() ->> 'school_id', school_id)
);

CREATE POLICY "Tenant Isolation on Attendance" ON attendance_records FOR ALL USING (
  school_id IS NULL OR school_id = COALESCE(auth.jwt() ->> 'school_id', school_id)
);
