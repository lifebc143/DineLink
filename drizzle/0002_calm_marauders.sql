ALTER TABLE `notifications` ADD `dedupeKey` varchar(191);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_dedupe_key_unique` UNIQUE(`dedupeKey`);