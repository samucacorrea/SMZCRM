CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "reminders" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "related_type" text NOT NULL,
  "related_id" uuid NOT NULL,
  "description" text NOT NULL,
  "remind_at" timestamp with time zone NOT NULL,
  "status" "reminder_status" DEFAULT 'pending' NOT NULL,
  "recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notify_customer" boolean DEFAULT false NOT NULL,
  "completed_at" timestamp with time zone,
  "created_by_staff_member_id" uuid,
  "completed_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_completed_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("completed_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reminders_tenant_related_idx" ON "reminders" USING btree ("tenant_id","related_type","related_id");--> statement-breakpoint
CREATE INDEX "reminders_tenant_status_remind_at_idx" ON "reminders" USING btree ("tenant_id","status","remind_at");--> statement-breakpoint
CREATE POLICY "reminders_tenant_isolation_select" ON "reminders"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reminders_tenant_isolation_insert" ON "reminders"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reminders_tenant_isolation_update" ON "reminders"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "reminders_tenant_isolation_delete" ON "reminders"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
