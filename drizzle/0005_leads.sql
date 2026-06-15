CREATE TYPE "lead_activity_type" AS ENUM ('created', 'note', 'stage_changed', 'converted');

CREATE TABLE IF NOT EXISTS "lead_stages" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "color" text DEFAULT '#2563EB' NOT NULL,
  "position" integer NOT NULL,
  "is_system" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_stages_tenant_name_idx"
  ON "lead_stages" ("tenant_id", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "lead_stages_tenant_position_idx"
  ON "lead_stages" ("tenant_id", "position");

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "stage_id" uuid NOT NULL REFERENCES "lead_stages"("id") ON DELETE RESTRICT,
  "assigned_staff_member_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL,
  "converted_customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "company" text,
  "email" text NOT NULL,
  "phone" text,
  "source" text NOT NULL,
  "estimated_value_in_cents" integer DEFAULT 0 NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "description" text,
  "last_activity_at" timestamptz DEFAULT now() NOT NULL,
  "created_by_staff_member_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "leads_tenant_email_idx"
  ON "leads" ("tenant_id", "email");

CREATE INDEX IF NOT EXISTS "leads_tenant_stage_idx"
  ON "leads" ("tenant_id", "stage_id");

CREATE INDEX IF NOT EXISTS "leads_tenant_assigned_idx"
  ON "leads" ("tenant_id", "assigned_staff_member_id");

CREATE TABLE IF NOT EXISTS "lead_activities" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "actor_staff_member_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL,
  "type" "lead_activity_type" NOT NULL,
  "body" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lead_activities_tenant_lead_idx"
  ON "lead_activities" ("tenant_id", "lead_id");

ALTER TABLE "lead_stages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_stages_tenant_select"
  ON "lead_stages"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_stages_tenant_insert"
  ON "lead_stages"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_stages_tenant_update"
  ON "lead_stages"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_stages_tenant_delete"
  ON "lead_stages"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_tenant_select"
  ON "leads"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_tenant_insert"
  ON "leads"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_tenant_update"
  ON "leads"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "leads_tenant_delete"
  ON "leads"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_activities_tenant_select"
  ON "lead_activities"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_activities_tenant_insert"
  ON "lead_activities"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_activities_tenant_update"
  ON "lead_activities"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "lead_activities_tenant_delete"
  ON "lead_activities"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
