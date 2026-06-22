CREATE TYPE "public"."project_billing_type" AS ENUM('fixed', 'project_hour', 'task_hour');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on_hold', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."project_health" AS ENUM('healthy', 'attention', 'critical');--> statement-breakpoint
CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "billing_type" "project_billing_type" DEFAULT 'fixed' NOT NULL,
  "status" "project_status" DEFAULT 'planning' NOT NULL,
  "health" "project_health" DEFAULT 'healthy' NOT NULL,
  "currency" text DEFAULT 'BRL' NOT NULL,
  "rate_in_cents" integer DEFAULT 0 NOT NULL,
  "budget_in_cents" integer DEFAULT 0 NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "start_date" timestamp with time zone,
  "due_date" timestamp with time zone,
  "portal_visibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_tenant_customer_idx" ON "projects" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "projects_tenant_status_idx" ON "projects" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "projects_tenant_due_date_idx" ON "projects" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation_select" ON "projects"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation_insert" ON "projects"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation_update" ON "projects"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "projects_tenant_isolation_delete" ON "projects"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
