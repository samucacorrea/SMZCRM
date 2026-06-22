CREATE TABLE "project_active_timers" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "billable" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "project_active_timers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_active_timers" ADD CONSTRAINT "project_active_timers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_active_timers" ADD CONSTRAINT "project_active_timers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_active_timers" ADD CONSTRAINT "project_active_timers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_active_timers" ADD CONSTRAINT "project_active_timers_staff_id_staff_members_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_active_timers" ADD CONSTRAINT "project_active_timers_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_active_timers_tenant_staff_idx" ON "project_active_timers" USING btree ("tenant_id","staff_id");--> statement-breakpoint
CREATE INDEX "project_active_timers_tenant_project_idx" ON "project_active_timers" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "project_active_timers_tenant_task_idx" ON "project_active_timers" USING btree ("tenant_id","task_id");--> statement-breakpoint
CREATE POLICY "project_active_timers_tenant_isolation_select" ON "project_active_timers"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "project_active_timers_tenant_isolation_insert" ON "project_active_timers"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "project_active_timers_tenant_isolation_update" ON "project_active_timers"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "project_active_timers_tenant_isolation_delete" ON "project_active_timers"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
