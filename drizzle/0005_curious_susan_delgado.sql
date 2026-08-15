CREATE TYPE "public"."backup_trigger" AS ENUM('scheduled', 'manual');--> statement-breakpoint
CREATE TYPE "public"."restore_request_status" AS ENUM('pending', 'cancelled', 'reviewed');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'backup_succeeded';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'backup_failed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'backup_restore_requested';--> statement-breakpoint
CREATE TABLE "backup_restore_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" "restore_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "backup_snapshots" ADD COLUMN "trigger" "backup_trigger" DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
ALTER TABLE "backup_restore_requests" ADD CONSTRAINT "backup_restore_requests_snapshot_id_backup_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."backup_snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_restore_requests" ADD CONSTRAINT "backup_restore_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "backup_restore_requests_status_idx" ON "backup_restore_requests" USING btree ("status","created_at");