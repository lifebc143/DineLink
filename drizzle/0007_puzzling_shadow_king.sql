ALTER TABLE "dining_events" ADD COLUMN "review_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dining_events" ADD COLUMN "review_reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD COLUMN "credit_score_before" integer;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD COLUMN "credit_score_after" integer;