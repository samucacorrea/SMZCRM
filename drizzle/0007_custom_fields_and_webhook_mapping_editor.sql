CREATE TYPE "public"."custom_field_entity" AS ENUM('lead');--> statement-breakpoint
CREATE TYPE "public"."custom_field_data_type" AS ENUM('text', 'number', 'date', 'boolean');--> statement-breakpoint

CREATE TABLE "custom_fields" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "entity" "custom_field_entity" DEFAULT 'lead' NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "data_type" "custom_field_data_type" DEFAULT 'text' NOT NULL,
  "is_required" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "custom_fields"
  ADD CONSTRAINT "custom_fields_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "custom_fields_tenant_entity_key_idx"
  ON "custom_fields" USING btree ("tenant_id", "entity", "key");--> statement-breakpoint

ALTER TABLE "custom_fields" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "tenant_isolation_select_custom_fields"
  ON "custom_fields"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint

CREATE POLICY "tenant_isolation_insert_custom_fields"
  ON "custom_fields"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint

CREATE POLICY "tenant_isolation_update_custom_fields"
  ON "custom_fields"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint

CREATE POLICY "tenant_isolation_delete_custom_fields"
  ON "custom_fields"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint

ALTER TABLE "leads"
  ADD COLUMN "custom_data" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
