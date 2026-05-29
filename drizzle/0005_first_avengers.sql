CREATE TABLE `researchLineMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lineId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('lead','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `researchLineMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `researchLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`objectives` text,
	`keywords` varchar(512),
	`status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `researchLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `researchLineMembers` ADD CONSTRAINT `researchLineMembers_lineId_researchLines_id_fk` FOREIGN KEY (`lineId`) REFERENCES `researchLines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchLineMembers` ADD CONSTRAINT `researchLineMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `researchLines` ADD CONSTRAINT `researchLines_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;