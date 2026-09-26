CREATE TABLE `announcementReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('announcement','reply') NOT NULL,
	`targetId` int NOT NULL,
	`userId` int NOT NULL,
	`reactionType` enum('heart','thumbs_up') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementReactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `announcementReactions_target_user_type_unique` UNIQUE(`targetType`,`targetId`,`userId`,`reactionType`)
);
--> statement-breakpoint
ALTER TABLE `announcementReactions` ADD CONSTRAINT `announcementReactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;