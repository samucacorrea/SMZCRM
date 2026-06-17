CREATE TYPE "public"."lead_qualification" AS ENUM('none', 'qualified', 'won', 'lost');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "qualification" "lead_qualification" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sale_value_in_cents" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sale_currency" text DEFAULT 'BRL';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lost_reason" text;--> statement-breakpoint
CREATE TABLE "conversion_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "milestone" text NOT NULL,
  "value_in_cents" integer,
  "currency" text,
  "event_id" text NOT NULL,
  "event_time" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "conversion_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversion_events" ADD CONSTRAINT "conversion_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversion_events_lead_idx" ON "conversion_events" USING btree ("lead_id","event_time");--> statement-breakpoint
CREATE UNIQUE INDEX "conversion_events_tenant_event_id_idx" ON "conversion_events" USING btree ("tenant_id","event_id");--> statement-breakpoint
CREATE POLICY "conversion_events_tenant_isolation_select" ON "conversion_events"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "conversion_events_tenant_isolation_insert" ON "conversion_events"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "conversion_events_tenant_isolation_update" ON "conversion_events"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "conversion_events_tenant_isolation_delete" ON "conversion_events"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
