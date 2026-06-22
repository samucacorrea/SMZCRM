CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'issued', 'paid', 'overdue', 'canceled');--> statement-breakpoint
CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "number" text NOT NULL,
  "status" "invoice_status" DEFAULT 'draft' NOT NULL,
  "description" text NOT NULL,
  "issue_date" timestamp with time zone NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "paid_at" timestamp with time zone,
  "currency" text DEFAULT 'BRL' NOT NULL,
  "amount_in_cents" integer DEFAULT 0 NOT NULL,
  "external_reference" text,
  "notes" text,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_tenant_number_idx" ON "invoices" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "invoices_tenant_customer_idx" ON "invoices" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "invoices_tenant_status_idx" ON "invoices" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "invoices_tenant_due_date_idx" ON "invoices" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE POLICY "invoices_tenant_isolation_select" ON "invoices"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "invoices_tenant_isolation_insert" ON "invoices"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "invoices_tenant_isolation_update" ON "invoices"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "invoices_tenant_isolation_delete" ON "invoices"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
