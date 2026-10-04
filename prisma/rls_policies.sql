-- PostgreSQL Row-Level Security (RLS) for Egyptian Technical Education Governorate System
-- Enforces tenant isolation at the database kernel level

-- 1. Enable RLS on all tenant-scoped tables
ALTER TABLE "schools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- 2. Create Tenant Isolation Policies

-- Schools Table Policy:
DROP POLICY IF EXISTS tenant_schools_isolation ON "schools";
CREATE POLICY tenant_schools_isolation ON "schools"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR id = current_setting('app.current_tenant_id', true)
);

-- School Settings Policy:
DROP POLICY IF EXISTS tenant_settings_isolation ON "school_settings";
CREATE POLICY tenant_settings_isolation ON "school_settings"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
);

-- Departments Policy:
DROP POLICY IF EXISTS tenant_departments_isolation ON "departments";
CREATE POLICY tenant_departments_isolation ON "departments"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
);

-- Classes Policy:
DROP POLICY IF EXISTS tenant_classes_isolation ON "classes";
CREATE POLICY tenant_classes_isolation ON "classes"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
);

-- Students Policy:
DROP POLICY IF EXISTS tenant_students_isolation ON "students";
CREATE POLICY tenant_students_isolation ON "students"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
);

-- Roles Policy:
DROP POLICY IF EXISTS tenant_roles_isolation ON "roles";
CREATE POLICY tenant_roles_isolation ON "roles"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
  OR "schoolId" IS NULL
);

-- Users Policy:
DROP POLICY IF EXISTS tenant_users_isolation ON "users";
CREATE POLICY tenant_users_isolation ON "users"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
  OR "schoolId" IS NULL
);

-- Audit Logs Policy:
DROP POLICY IF EXISTS tenant_audit_logs_isolation ON "audit_logs";
CREATE POLICY tenant_audit_logs_isolation ON "audit_logs"
FOR ALL
USING (
  current_setting('app.is_directorate_admin', true) = 'true'
  OR "schoolId" = current_setting('app.current_tenant_id', true)
);
