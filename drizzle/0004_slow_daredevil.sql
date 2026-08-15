CREATE TYPE "public"."backup_status" AS ENUM('running', 'succeeded', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "backup_settings" (
	"id" varchar(48) PRIMARY KEY DEFAULT 'monthly_application_data' NOT NULL,
	"day_of_month" integer DEFAULT 1 NOT NULL,
	"hour_taipei" integer DEFAULT 3 NOT NULL,
	"retention_count" integer DEFAULT 3 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_key" varchar(32) NOT NULL,
	"status" "backup_status" DEFAULT 'running' NOT NULL,
	"storage_key" text,
	"checksum_sha256" varchar(64),
	"byte_size" integer,
	"table_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"initiated_by" uuid,
	"failure_message" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "backup_settings" ADD CONSTRAINT "backup_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_snapshots" ADD CONSTRAINT "backup_snapshots_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "backup_snapshots_schedule_key_unique" ON "backup_snapshots" USING btree ("schedule_key");--> statement-breakpoint
CREATE INDEX "backup_snapshots_created_at_idx" ON "backup_snapshots" USING btree ("created_at");