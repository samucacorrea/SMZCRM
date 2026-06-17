ALTER TYPE "public"."custom_field_entity" ADD VALUE IF NOT EXISTS 'customer';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "custom_data" jsonb DEFAULT '{}'::jsonb NOT NULL;
