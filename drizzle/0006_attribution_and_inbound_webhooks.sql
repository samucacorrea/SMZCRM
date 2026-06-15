CREATE TYPE "webhook_status" AS ENUM ('active', 'paused');
CREATE TYPE "webhook_dedup_key" AS ENUM ('email', 'phone', 'none');
CREATE TYPE "webhook_dedup_action" AS ENUM ('create', 'update', 'note');
CREATE TYPE "webhook_unmapped_policy" AS ENUM ('ignore', 'store', 'notify');
CREATE TYPE "webhook_mapping_target_type" AS ENUM ('lead_field', 'attribution_field', 'custom_field');
CREATE TYPE "webhook_request_result" AS ENUM ('created', 'updated', 'note', 'rejected');

CREATE TABLE IF NOT EXISTS "lead_attributions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "entry_point" text NOT NULL,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_term" text,
  "utm_content" text,
  "gclid" text,
  "fbclid" text,
  "fbp" text,
  "fbc" text,
  "ttclid" text,
  "ctwa_clid" text,
  "referral" text,
  "page_url" text,
  "referrer" text,
  "extra_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_attributions_lead_id_idx"
  ON "lead_attributions" ("lead_id");

CREATE INDEX IF NOT EXISTS "lead_attributions_tenant_source_idx"
  ON "lead_attributions" ("tenant_id", "utm_source");

CREATE TABLE IF NOT EXISTS "inbound_webhooks" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "secret_hash" text NOT NULL,
  "default_stage_id" uuid REFERENCES "lead_stages"("id") ON DELETE SET NULL,
  "default_source" text,
  "default_owner_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL,
  "round_robin_enabled" boolean DEFAULT false NOT NULL,
  "auto_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "dedup_key" "webhook_dedup_key" DEFAULT 'email' NOT NULL,
  "dedup_action" "webhook_dedup_action" DEFAULT 'create' NOT NULL,
  "unmapped_policy" "webhook_unmapped_policy" DEFAULT 'store' NOT NULL,
  "status" "webhook_status" DEFAULT 'active' NOT NULL,
  "validation" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "inbound_webhooks_tenant_name_idx"
  ON "inbound_webhooks" ("tenant_id", "name");

CREATE TABLE IF NOT EXISTS "webhook_field_mappings" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "webhook_id" uuid NOT NULL REFERENCES "inbound_webhooks"("id") ON DELETE CASCADE,
  "source_field" text NOT NULL,
  "target_type" "webhook_mapping_target_type" NOT NULL,
  "target_key" text NOT NULL,
  "transform" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_field_mappings_source_idx"
  ON "webhook_field_mappings" ("webhook_id", "source_field", "target_key");

CREATE TABLE IF NOT EXISTS "webhook_request_logs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "webhook_id" uuid NOT NULL REFERENCES "inbound_webhooks"("id") ON DELETE CASCADE,
  "raw_payload" jsonb NOT NULL,
  "result" "webhook_request_result" NOT NULL,
  "reason" text,
  "lead_id" uuid REFERENCES "leads"("id") ON DELETE SET NULL,
  "ip_address" text,
  "event_id" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "webhook_request_logs_webhook_created_idx"
  ON "webhook_request_logs" ("webhook_id", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_request_logs_event_id_idx"
  ON "webhook_request_logs" ("webhook_id", "event_id");

ALTER TABLE "lead_attributions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inbound_webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_field_mappings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_request_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_attributions_tenant_select" ON "lead_attributions" FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "lead_attributions_tenant_insert" ON "lead_attributions" FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "lead_attributions_tenant_update" ON "lead_attributions" FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "lead_attributions_tenant_delete" ON "lead_attributions" FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "inbound_webhooks_tenant_select" ON "inbound_webhooks" FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "inbound_webhooks_tenant_insert" ON "inbound_webhooks" FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "inbound_webhooks_tenant_update" ON "inbound_webhooks" FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "inbound_webhooks_tenant_delete" ON "inbound_webhooks" FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "webhook_field_mappings_tenant_select" ON "webhook_field_mappings" FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_field_mappings_tenant_insert" ON "webhook_field_mappings" FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_field_mappings_tenant_update" ON "webhook_field_mappings" FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_field_mappings_tenant_delete" ON "webhook_field_mappings" FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "webhook_request_logs_tenant_select" ON "webhook_request_logs" FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_request_logs_tenant_insert" ON "webhook_request_logs" FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_request_logs_tenant_update" ON "webhook_request_logs" FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
CREATE POLICY "webhook_request_logs_tenant_delete" ON "webhook_request_logs" FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
