CREATE TABLE `researchRepositoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`type` enum('poster','paper','book','book_chapter','report','other') NOT NULL DEFAULT 'paper',
	`title` varchar(512) NOT NULL,
	`authors` text,
	`citation` text,
	`abstract` text,
	`publicationDate` datetime,
	`publicationVenue` varchar(512),
	`publisher` varchar(512),
	`volume` varchar(64),
	`issue` varchar(64),
	`pages` varchar(128),
	`isbn` varchar(64),
	`doi` varchar(255),
	`externalUrl` text,
	`keywords` text,
	`language` varchar(64),
	`notes` text,
	`pdfFileName` varchar(512),
	`pdfFileKey` text,
	`pdfFileUrl` text,
	`pdfFileSize` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchRepositoryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchRepositoryParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repositoryItemId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('author','editor','contributor') NOT NULL DEFAULT 'author',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchRepositoryParticipants_id` PRIMARY KEY(`id`),
	CONSTRAINT `researchRepositoryParticipants_item_user_unique` UNIQUE(`repositoryItemId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `researchRepositoryItems` ADD CONSTRAINT `researchRepositoryItems_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchRepositoryParticipants` ADD CONSTRAINT `repositoryParticipants_item_fk` FOREIGN KEY (`repositoryItemId`) REFERENCES `researchRepositoryItems`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchRepositoryParticipants` ADD CONSTRAINT `repositoryParticipants_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;