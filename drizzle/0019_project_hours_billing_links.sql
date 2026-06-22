ALTER TABLE "invoices" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD COLUMN "billed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_time_entries" ADD CONSTRAINT "project_time_entries_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_tenant_project_idx" ON "invoices" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "project_time_entries_tenant_invoice_idx" ON "project_time_entries" USING btree ("tenant_id","invoice_id");
