CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('confirmed', 'attended', 'late', 'no_show', 'excused');--> statement-breakpoint
CREATE TYPE "public"."deposit_status" AS ENUM('held', 'released', 'forfeited', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'full', 'locked', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('woman', 'man', 'non_binary', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('application_submitted', 'application_approved', 'application_rejected', 'event_reminder', 'event_cancelled', 'member_no_show', 'new_message', 'review_request', 'safety_alert');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('host_treats', 'split_bill', 'men_treat_women');--> statement-breakpoint
CREATE TYPE "public"."payment_purpose" AS ENUM('point_top_up', 'membership', 'restaurant_campaign');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."point_transaction_type" AS ENUM('top_up', 'deposit_hold', 'deposit_release', 'deposit_forfeit', 'reward', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" varchar(2000) NOT NULL,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dining_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"cuisine_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"event_start_at" timestamp with time zone NOT NULL,
	"event_end_at" timestamp with time zone,
	"application_deadline_at" timestamp with time zone,
	"restaurant_name" varchar(180),
	"venue_address" text NOT NULL,
	"place_id" varchar(255),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"neighborhood" varchar(80),
	"capacity" integer NOT NULL,
	"min_capacity" integer DEFAULT 2 NOT NULL,
	"payment_mode" "payment_mode" NOT NULL,
	"currency" varchar(3) DEFAULT 'TWD' NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"deposit_points" integer DEFAULT 100 NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"reminder_task_uid" varchar(65),
	"reminder_scheduled_for" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"introduction" varchar(280),
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_note" varchar(280),
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"status" "attendance_status" DEFAULT 'confirmed' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"status" "deposit_status" DEFAULT 'held' NOT NULL,
	"reason" varchar(280),
	"released_at" timestamp with time zone,
	"forfeited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"punctuality_score" integer NOT NULL,
	"politeness_score" integer NOT NULL,
	"fun_score" integer NOT NULL,
	"private_note" varchar(500),
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"event_id" uuid,
	"application_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" varchar(500) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(48) NOT NULL,
	"provider_payment_id" varchar(191) NOT NULL,
	"purpose" "payment_purpose" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"currency" varchar(3) DEFAULT 'TWD' NOT NULL,
	"amount" integer NOT NULL,
	"point_credit" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"succeeded_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"deposit_id" uuid,
	"type" "point_transaction_type" NOT NULL,
	"delta" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"note" varchar(280),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" varchar(191) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"email" varchar(320),
	"avatar_url" text,
	"gender" "gender" DEFAULT 'prefer_not_to_say' NOT NULL,
	"bio" varchar(280),
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"point_balance" integer DEFAULT 0 NOT NULL,
	"credit_score" integer DEFAULT 70 NOT NULL,
	"completed_event_count" integer DEFAULT 0 NOT NULL,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"phone_verified_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dining_events" ADD CONSTRAINT "dining_events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_applications" ADD CONSTRAINT "event_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendances" ADD CONSTRAINT "event_attendances_application_id_event_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."event_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_deposits" ADD CONSTRAINT "event_deposits_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_deposits" ADD CONSTRAINT "event_deposits_application_id_event_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."event_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_deposits" ADD CONSTRAINT "event_deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_reviewee_id_users_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_application_id_event_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."event_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_event_id_dining_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."dining_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_deposit_id_event_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."event_deposits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_event_timeline_idx" ON "chat_messages" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_messages_author_idx" ON "chat_messages" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "dining_events_explore_idx" ON "dining_events" USING btree ("status","event_start_at");--> statement-breakpoint
CREATE INDEX "dining_events_host_idx" ON "dining_events" USING btree ("host_id","event_start_at");--> statement-breakpoint
CREATE INDEX "dining_events_geo_idx" ON "dining_events" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "dining_events_reminder_task_unique" ON "dining_events" USING btree ("reminder_task_uid");--> statement-breakpoint
CREATE UNIQUE INDEX "event_applications_event_applicant_unique" ON "event_applications" USING btree ("event_id","applicant_id");--> statement-breakpoint
CREATE INDEX "event_applications_host_queue_idx" ON "event_applications" USING btree ("event_id","status","requested_at");--> statement-breakpoint
CREATE INDEX "event_applications_applicant_idx" ON "event_applications" USING btree ("applicant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendances_event_user_unique" ON "event_attendances" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendances_application_unique" ON "event_attendances" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "event_attendances_event_status_idx" ON "event_attendances" USING btree ("event_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "event_deposits_application_unique" ON "event_deposits" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "event_deposits_user_status_idx" ON "event_deposits" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "event_deposits_event_idx" ON "event_deposits" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_reviews_reviewer_reviewee_unique" ON "event_reviews" USING btree ("event_id","reviewer_id","reviewee_id");--> statement-breakpoint
CREATE INDEX "event_reviews_reviewee_idx" ON "event_reviews" USING btree ("reviewee_id","submitted_at");--> statement-breakpoint
CREATE INDEX "notifications_inbox_idx" ON "notifications" USING btree ("recipient_id","read_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_transactions_provider_payment_unique" ON "payment_transactions" USING btree ("provider","provider_payment_id");--> statement-breakpoint
CREATE INDEX "payment_transactions_user_idx" ON "payment_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_timeline_idx" ON "point_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_event_idx" ON "point_transactions" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_subject_unique" ON "users" USING btree ("auth_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_credit_score_idx" ON "users" USING btree ("credit_score");