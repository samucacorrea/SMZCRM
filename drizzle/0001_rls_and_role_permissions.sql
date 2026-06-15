ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_staff_member_id_staff_members_id_fk" FOREIGN KEY ("active_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "tenant_id" uuid NOT NULL REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "role_permissions_tenant_role_idx" ON "role_permissions" USING btree ("tenant_id","role_id");
--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation_select" ON "roles"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation_insert" ON "roles"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation_update" ON "roles"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "roles_tenant_isolation_delete" ON "roles"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "role_permissions_tenant_isolation_select" ON "role_permissions"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "role_permissions_tenant_isolation_insert" ON "role_permissions"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "role_permissions_tenant_isolation_update" ON "role_permissions"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "role_permissions_tenant_isolation_delete" ON "role_permissions"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "staff_members_tenant_isolation_select" ON "staff_members"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "staff_members_tenant_isolation_insert" ON "staff_members"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "staff_members_tenant_isolation_update" ON "staff_members"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "staff_members_tenant_isolation_delete" ON "staff_members"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation_select" ON "audit_logs"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation_insert" ON "audit_logs"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation_update" ON "audit_logs"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "audit_logs_tenant_isolation_delete" ON "audit_logs"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "queue_jobs_tenant_isolation_select" ON "queue_jobs"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "queue_jobs_tenant_isolation_insert" ON "queue_jobs"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "queue_jobs_tenant_isolation_update" ON "queue_jobs"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "queue_jobs_tenant_isolation_delete" ON "queue_jobs"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
