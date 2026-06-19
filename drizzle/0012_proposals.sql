CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TABLE "proposals" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "customer_id" uuid,
  "number" text NOT NULL,
  "title" text NOT NULL,
  "status" "proposal_status" DEFAULT 'draft' NOT NULL,
  "content" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "valid_until" timestamp with time zone,
  "public_token" text NOT NULL,
  "accepted_at" timestamp with time zone,
  "accept_ip" text,
  "signature" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "subtotal_in_cents" integer DEFAULT 0 NOT NULL,
  "total_in_cents" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'BRL' NOT NULL,
  "created_by_staff_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "proposal_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "tenant_id" uuid NOT NULL,
  "proposal_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_price_in_cents" integer DEFAULT 0 NOT NULL,
  "total_in_cents" integer DEFAULT 0 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposal_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_created_by_staff_member_id_staff_members_id_fk" FOREIGN KEY ("created_by_staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "proposals_tenant_lead_idx" ON "proposals" USING btree ("tenant_id","lead_id");--> statement-breakpoint
CREATE INDEX "proposals_tenant_status_idx" ON "proposals" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_tenant_number_idx" ON "proposals" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_public_token_idx" ON "proposals" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "proposal_items_tenant_proposal_idx" ON "proposal_items" USING btree ("tenant_id","proposal_id");--> statement-breakpoint
CREATE POLICY "proposals_tenant_isolation_select" ON "proposals"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposals_tenant_isolation_insert" ON "proposals"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposals_tenant_isolation_update" ON "proposals"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposals_tenant_isolation_delete" ON "proposals"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposal_items_tenant_isolation_select" ON "proposal_items"
  AS PERMISSIVE
  FOR SELECT
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposal_items_tenant_isolation_insert" ON "proposal_items"
  AS PERMISSIVE
  FOR INSERT
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposal_items_tenant_isolation_update" ON "proposal_items"
  AS PERMISSIVE
  FOR UPDATE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "proposal_items_tenant_isolation_delete" ON "proposal_items"
  AS PERMISSIVE
  FOR DELETE
  USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
