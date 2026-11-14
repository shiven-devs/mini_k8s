CREATE TYPE "public"."job_status_enum" AS ENUM('SUBMITTED', 'RUNNABLE', 'RUNNING');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" text NOT NULL,
	"cmd" text DEFAULT null,
	"state" "job_status_enum" DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
