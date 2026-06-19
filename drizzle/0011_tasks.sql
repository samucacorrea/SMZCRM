CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "related_type" text NOT NULL,
  "related_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "priority" "task_priority" DEFAULT 'medium' NOT NULL,
  "status" "task_status" DEFAULT 'todo' NOT NULL,
  "start_date" timestamp with time zone,
  "due_date" timestamp with time zone,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "recurring" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "completed_at" timestamp with time zone,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "task_assignees" (
  "tenant_id" uuid NOT NULL,
  "task_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "task_assignees_task_id_staff_id_pk" PRIMARY KEY("task_id","staff_id")
);--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_assignees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_staff_id_staff_members_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_tenant_related_idx" ON "tasks" USING btree ("tenant_id","related_type","related_id");--> statement-breakpoint
CREATE INDEX "tasks_tenant_status_due_date_idx" ON "tasks" USING btree ("tenant_id","status","due_date");--> statement-breakpoint
CREATE INDEX "task_assignees_tenant_task_idx" ON "task_assignees" USING btree ("tenant_id","task_id");--> statement-breakpoint
CREATE INDEX "task_assignees_tenant_staff_idx" ON "task_assignees" USING btree ("tenant_id","staff_id");--> statement-breakpoint
CREATE POLICY "tasks_tenant_isolation_select" ON "tasks"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tasks_tenant_isolation_insert" ON "tasks"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tasks_tenant_isolation_update" ON "tasks"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "tasks_tenant_isolation_delete" ON "tasks"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "task_assignees_tenant_isolation_select" ON "task_assignees"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "task_assignees_tenant_isolation_insert" ON "task_assignees"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "task_assignees_tenant_isolation_update" ON "task_assignees"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "task_assignees_tenant_isolation_delete" ON "task_assignees"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
