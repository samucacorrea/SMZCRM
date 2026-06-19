CREATE TYPE "public"."lead_attachment_kind" AS ENUM('file', 'image', 'document');--> statement-breakpoint
CREATE TABLE "lead_attachments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "file_name" text NOT NULL,
  "content_type" text NOT NULL,
  "size_in_bytes" integer NOT NULL,
  "storage_key" text NOT NULL,
  "kind" "lead_attachment_kind" DEFAULT 'file' NOT NULL,
  "uploaded_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "lead_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_attachments" ADD CONSTRAINT "lead_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_attachments" ADD CONSTRAINT "lead_attachments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_attachments" ADD CONSTRAINT "lead_attachments_uploaded_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("uploaded_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_attachments_tenant_lead_idx" ON "lead_attachments" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_attachments_storage_key_idx" ON "lead_attachments" USING btree ("storage_key");--> statement-breakpoint
CREATE POLICY "lead_attachments_tenant_isolation_select" ON "lead_attachments"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_attachments_tenant_isolation_insert" ON "lead_attachments"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_attachments_tenant_isolation_update" ON "lead_attachments"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "lead_attachments_tenant_isolation_delete" ON "lead_attachments"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
