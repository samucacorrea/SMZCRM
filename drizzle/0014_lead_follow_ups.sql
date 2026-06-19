CREATE TYPE "public"."lead_follow_up_channel" AS ENUM('call', 'whatsapp', 'email', 'meeting', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_follow_up_outcome" AS ENUM('pending', 'answered', 'no_answer', 'interested', 'not_interested', 'scheduled');--> statement-breakpoint
CREATE TABLE "lead_follow_ups" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "channel" "lead_follow_up_channel" DEFAULT 'other' NOT NULL,
  "outcome" "lead_follow_up_outcome" DEFAULT 'pending' NOT NULL,
  "happened_at" timestamp with time zone NOT NULL,
  "summary" text NOT NULL,
  "next_action" text,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_follow_ups" ADD CONSTRAINT "lead_follow_ups_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_follow_ups_tenant_lead_idx" ON "lead_follow_ups" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "lead_follow_ups_tenant_happened_at_idx" ON "lead_follow_ups" USING btree ("tenant_id","happened_at");--> statement-breakpoint
CREATE POLICY "lead_follow_ups_tenant_isolation_select" ON "lead_follow_ups"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_follow_ups_tenant_isolation_insert" ON "lead_follow_ups"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_follow_ups_tenant_isolation_update" ON "lead_follow_ups"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_follow_ups_tenant_isolation_delete" ON "lead_follow_ups"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
