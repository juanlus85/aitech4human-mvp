CREATE TABLE `announcementAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int,
	`replyId` int,
	`fileName` varchar(512) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` bigint,
	`mimeType` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcementReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcementReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`isPinned` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commProposalAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`communicationId` int NOT NULL,
	`userId` int NOT NULL,
	`response` enum('attending','maybe','not_attending') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commProposalAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`description` text,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectProposalInterests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectProposalInterests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text,
	`objectives` text,
	`methodology` text,
	`expectedOutcomes` text,
	`fundingSource` varchar(255),
	`budget` varchar(128),
	`startDate` datetime,
	`endDate` datetime,
	`status` enum('idea','draft','submitted','approved','rejected','active','completed') NOT NULL DEFAULT 'idea',
	`keywords` text,
	`additionalInfo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `congresses` MODIFY COLUMN `modality` enum('in-person','online','hybrid');--> statement-breakpoint
ALTER TABLE `congresses` ADD `acronym` varchar(64);--> statement-breakpoint
ALTER TABLE `congresses` ADD `country` varchar(128);--> statement-breakpoint
ALTER TABLE `congresses` ADD `paperDeadline` datetime;--> statement-breakpoint
ALTER TABLE `congresses` ADD `registrationDeadline` datetime;--> statement-breakpoint
ALTER TABLE `congresses` ADD `cfpPdfKey` text;--> statement-breakpoint
ALTER TABLE `commProposalAttendance` ADD CONSTRAINT `commProposalAttendance_communicationId_commProposals_id_fk` FOREIGN KEY (`communicationId`) REFERENCES `commProposals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commProposalAttendance` ADD CONSTRAINT `commProposalAttendance_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectProposalInterests` ADD CONSTRAINT `projectProposalInterests_proposalId_projectProposals_id_fk` FOREIGN KEY (`proposalId`) REFERENCES `projectProposals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectProposalInterests` ADD CONSTRAINT `projectProposalInterests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectProposals` ADD CONSTRAINT `projectProposals_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `congresses` DROP COLUMN `cfpFileKey`;--> statement-breakpoint
ALTER TABLE `congresses` DROP COLUMN `cfpFileUrl`;