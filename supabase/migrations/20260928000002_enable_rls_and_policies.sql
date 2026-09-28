-- ==============================================================================
-- Migration 002: Row Level Security (RLS) Policies & Role-Based Scope
-- Version: 2.0.0
-- ==============================================================================

-- 1. Enable RLS on all operational tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_calendar ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions for JWT claims extraction
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'school_id', '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'role', '')::TEXT;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.current_user_dept()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'department_id', '')::TEXT;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.current_student_id_for_parent()
RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'student_id', '')::TEXT;
$$ LANGUAGE SQL STABLE;

-- 3. School Policies
CREATE POLICY "Schools isolation policy" ON public.schools
    FOR ALL
    USING (id = public.current_school_id() OR public.current_user_role() = 'system_admin');

-- 4. Users Policies
CREATE POLICY "Users can view members of their school" ON public.school_users
    FOR SELECT
    USING (school_id = public.current_school_id() OR public.current_user_role() = 'system_admin');

CREATE POLICY "Only Principal and System Admin can manage users" ON public.school_users
    FOR ALL
    USING (
      (school_id = public.current_school_id() AND public.current_user_role() = 'principal')
      OR public.current_user_role() = 'system_admin'
    );

-- 5. Students Policies (Scoped by Role)
CREATE POLICY "School staff view students policy" ON public.students
    FOR SELECT
    USING (
      (school_id = public.current_school_id() AND public.current_user_role() IN ('principal', 'affairs_deputy', 'affairs_officer', 'social_worker', 'system_admin'))
      OR (school_id = public.current_school_id() AND public.current_user_role() = 'dept_head' AND department_id = public.current_user_dept())
      OR (school_id = public.current_school_id() AND public.current_user_role() = 'teacher')
      OR (public.current_user_role() = 'parent' AND id = public.current_student_id_for_parent())
    );

CREATE POLICY "Student Affairs manage students policy" ON public.students
    FOR ALL
    USING (
      school_id = public.current_school_id() 
      AND public.current_user_role() IN ('principal', 'affairs_deputy', 'affairs_officer')
    );

-- 6. Attendance Policies
CREATE POLICY "View attendance policy" ON public.attendance_records
    FOR SELECT
    USING (
      (school_id = public.current_school_id() AND public.current_user_role() IN ('principal', 'affairs_deputy', 'affairs_officer', 'social_worker'))
      OR (school_id = public.current_school_id() AND public.current_user_role() = 'dept_head')
      OR (school_id = public.current_school_id() AND public.current_user_role() = 'teacher')
      OR (public.current_user_role() = 'parent' AND student_id = public.current_student_id_for_parent())
    );

CREATE POLICY "Teachers and affairs manage attendance" ON public.attendance_records
    FOR ALL
    USING (
      school_id = public.current_school_id() 
      AND public.current_user_role() IN ('principal', 'affairs_deputy', 'affairs_officer', 'teacher')
    );

-- 7. Competency Assessments Policies
CREATE POLICY "View assessments policy" ON public.competency_assessments
    FOR SELECT
    USING (
      (school_id = public.current_school_id() AND public.current_user_role() IN ('principal', 'dept_head', 'teacher', 'affairs_deputy', 'external_verifier'))
      OR (public.current_user_role() = 'parent' AND student_id = public.current_student_id_for_parent())
    );

CREATE POLICY "Teachers and Dept Heads manage assessments" ON public.competency_assessments
    FOR ALL
    USING (
      school_id = public.current_school_id() 
      AND public.current_user_role() IN ('teacher', 'dept_head', 'principal')
    );

-- 8. Audit Logs Policy (Read-Only for Admin / Principal, Insert for All)
CREATE POLICY "Insert audit log policy" ON public.audit_logs
    FOR INSERT
    WITH CHECK (school_id = public.current_school_id() OR public.current_school_id() IS NULL);

CREATE POLICY "View audit log policy" ON public.audit_logs
    FOR SELECT
    USING (
      (school_id = public.current_school_id() AND public.current_user_role() = 'principal')
      OR public.current_user_role() = 'system_admin'
    );
