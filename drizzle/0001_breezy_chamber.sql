ALTER TYPE "public"."job_status_enum" ADD VALUE 'SUCCEEDED';--> statement-breakpoint
ALTER TYPE "public"."job_status_enum" ADD VALUE 'FAILED';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "container_id" text;