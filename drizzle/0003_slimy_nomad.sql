ALTER TYPE "public"."event_status" ADD VALUE 'unmatched';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'event_unmatched' BEFORE 'member_no_show';--> statement-breakpoint
CREATE TABLE "automation_jobs" (
	"job_key" varchar(80) PRIMARY KEY NOT NULL,
	"cron_task_uid" varchar(65) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dining_events" ADD COLUMN "unmatched_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "automation_jobs_task_uid_unique" ON "automation_jobs" USING btree ("cron_task_uid");