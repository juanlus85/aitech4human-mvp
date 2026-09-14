CREATE TABLE `messageDeletions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageDeletions_id` PRIMARY KEY(`id`),
	CONSTRAINT `messageDeletions_message_user_unique` UNIQUE(`messageId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `messageDeletions` ADD CONSTRAINT `messageDeletions_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageDeletions` ADD CONSTRAINT `messageDeletions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;