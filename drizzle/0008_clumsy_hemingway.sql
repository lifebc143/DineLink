ALTER TABLE "users" ADD COLUMN "age_range" varchar(16);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interest_tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_area" varchar(80);