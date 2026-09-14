CREATE TABLE `messageRecipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageRecipients_id` PRIMARY KEY(`id`),
	CONSTRAINT `messageRecipients_message_user_unique` UNIQUE(`messageId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `messageRecipients` ADD CONSTRAINT `messageRecipients_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageRecipients` ADD CONSTRAINT `messageRecipients_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT IGNORE INTO `messageRecipients` (`messageId`, `userId`, `isRead`, `createdAt`)
SELECT `messages`.`id`, `messages`.`recipientId`, `messages`.`isReadByRecipient`, `messages`.`createdAt`
FROM `messages`
INNER JOIN `users` ON `users`.`id` = `messages`.`recipientId`;
