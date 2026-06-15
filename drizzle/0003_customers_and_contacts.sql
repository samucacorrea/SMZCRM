CREATE TYPE "public"."customer_type" AS ENUM('person', 'company');
--> statement-breakpoint
CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "type" "customer_type" DEFAULT 'company' NOT NULL,
  "legal_name" text NOT NULL,
  "trade_name" text,
  "tax_id" text NOT NULL,
  "state_registration" text,
  "zip_code" text,
  "address_line_1" text,
  "address_line_2" text,
  "neighborhood" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "country" text DEFAULT 'BR' NOT NULL,
  "phone" text,
  "website" text,
  "currency" text DEFAULT 'BRL' NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "whatsapp" text,
  "job_title" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "portal_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_contacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_tax_id_idx" ON "customers" USING btree ("tenant_id","tax_id");
--> statement-breakpoint
CREATE INDEX "customers_tenant_legal_name_idx" ON "customers" USING btree ("tenant_id","legal_name");
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_contacts_tenant_email_idx" ON "customer_contacts" USING btree ("tenant_id","email");
--> statement-breakpoint
CREATE INDEX "customer_contacts_tenant_customer_idx" ON "customer_contacts" USING btree ("tenant_id","customer_id");
--> statement-breakpoint
CREATE POLICY "customers_tenant_isolation_select" ON "customers"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customers_tenant_isolation_insert" ON "customers"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customers_tenant_isolation_update" ON "customers"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customers_tenant_isolation_delete" ON "customers"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customer_contacts_tenant_isolation_select" ON "customer_contacts"
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customer_contacts_tenant_isolation_insert" ON "customer_contacts"
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customer_contacts_tenant_isolation_update" ON "customer_contacts"
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "customer_contacts_tenant_isolation_delete" ON "customer_contacts"
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
