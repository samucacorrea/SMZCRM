CREATE TABLE IF NOT EXISTS "customer_notes" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "author_staff_member_id" uuid REFERENCES "staff_members"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "customer_notes_tenant_customer_idx"
  ON "customer_notes" ("tenant_id", "customer_id");

ALTER TABLE "customer_notes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_notes_tenant_select"
  ON "customer_notes"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "customer_notes_tenant_insert"
  ON "customer_notes"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "customer_notes_tenant_update"
  ON "customer_notes"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "customer_notes_tenant_delete"
  ON "customer_notes"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
