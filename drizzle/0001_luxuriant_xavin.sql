CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` varchar(2000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dining_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hostId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`description` text,
	`eventStartAt` timestamp NOT NULL,
	`restaurantName` varchar(180),
	`venueAddress` text NOT NULL,
	`placeId` varchar(255),
	`latitude` varchar(24),
	`longitude` varchar(24),
	`capacity` int NOT NULL,
	`paymentMode` enum('host_treats','split_bill','men_treat_women') NOT NULL,
	`budgetMin` int,
	`budgetMax` int,
	`depositPoints` int NOT NULL DEFAULT 100,
	`eventStatus` enum('draft','published','full','locked','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`reminderTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dining_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `dining_events_reminder_uid_unique` UNIQUE(`reminderTaskUid`)
);
--> statement-breakpoint
CREATE TABLE `event_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`applicantId` int NOT NULL,
	`introduction` varchar(280),
	`applicationStatus` enum('pending','approved','rejected','withdrawn','cancelled') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` varchar(280),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_applications_event_applicant_unique` UNIQUE(`eventId`,`applicantId`)
);
--> statement-breakpoint
CREATE TABLE `event_attendances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`applicationId` int,
	`attendanceStatus` enum('confirmed','attended','late','no_show','excused') NOT NULL DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_attendances_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_attendances_event_user_unique` UNIQUE(`eventId`,`userId`),
	CONSTRAINT `event_attendances_application_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `event_deposits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`applicationId` int NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL,
	`depositStatus` enum('held','released','forfeited','refunded') NOT NULL DEFAULT 'held',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_deposits_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_deposits_application_unique` UNIQUE(`applicationId`)
);
--> statement-breakpoint
CREATE TABLE `event_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`punctualityScore` int NOT NULL,
	`politenessScore` int NOT NULL,
	`funScore` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_reviews_unique_pair` UNIQUE(`eventId`,`reviewerId`,`revieweeId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientId` int NOT NULL,
	`eventId` int,
	`applicationId` int,
	`notificationType` enum('application_submitted','application_approved','application_rejected','event_reminder','member_no_show','new_message','review_request') NOT NULL,
	`title` varchar(160) NOT NULL,
	`body` varchar(500) NOT NULL,
	`payload` json,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `gender` enum('woman','man','non_binary','prefer_not_to_say') DEFAULT 'prefer_not_to_say' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` varchar(280);--> statement-breakpoint
ALTER TABLE `users` ADD `pointBalance` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `creditScore` int DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `noShowCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dining_events` ADD CONSTRAINT `dining_events_hostId_users_id_fk` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_applications` ADD CONSTRAINT `event_applications_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_applications` ADD CONSTRAINT `event_applications_applicantId_users_id_fk` FOREIGN KEY (`applicantId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_applications` ADD CONSTRAINT `event_applications_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_attendances` ADD CONSTRAINT `event_attendances_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_attendances` ADD CONSTRAINT `event_attendances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_attendances` ADD CONSTRAINT `event_attendances_applicationId_event_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `event_applications`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_deposits` ADD CONSTRAINT `event_deposits_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_deposits` ADD CONSTRAINT `event_deposits_applicationId_event_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `event_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_deposits` ADD CONSTRAINT `event_deposits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_reviews` ADD CONSTRAINT `event_reviews_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_reviews` ADD CONSTRAINT `event_reviews_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_reviews` ADD CONSTRAINT `event_reviews_revieweeId_users_id_fk` FOREIGN KEY (`revieweeId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_eventId_dining_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `dining_events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_applicationId_event_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `event_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chat_messages_event_time_idx` ON `chat_messages` (`eventId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `dining_events_status_time_idx` ON `dining_events` (`eventStatus`,`eventStartAt`);--> statement-breakpoint
CREATE INDEX `dining_events_host_idx` ON `dining_events` (`hostId`);--> statement-breakpoint
CREATE INDEX `event_applications_event_status_idx` ON `event_applications` (`eventId`,`applicationStatus`);--> statement-breakpoint
CREATE INDEX `event_attendances_event_status_idx` ON `event_attendances` (`eventId`,`attendanceStatus`);--> statement-breakpoint
CREATE INDEX `notifications_recipient_read_idx` ON `notifications` (`recipientId`,`readAt`);