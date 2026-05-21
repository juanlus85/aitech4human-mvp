CREATE TABLE `commProposalInterests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communicationId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commProposalInterests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`congressId` int NOT NULL,
	`proposerId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`topic` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `congressCommunicationInterests`;--> statement-breakpoint
DROP TABLE `congressCommunications`;--> statement-breakpoint
ALTER TABLE `commProposalInterests` ADD CONSTRAINT `commProposalInterests_communicationId_commProposals_id_fk` FOREIGN KEY (`communicationId`) REFERENCES `commProposals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commProposalInterests` ADD CONSTRAINT `commProposalInterests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commProposals` ADD CONSTRAINT `commProposals_congressId_congresses_id_fk` FOREIGN KEY (`congressId`) REFERENCES `congresses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commProposals` ADD CONSTRAINT `commProposals_proposerId_users_id_fk` FOREIGN KEY (`proposerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;