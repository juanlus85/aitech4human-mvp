-- ============================================================
-- AI&Tech4Human — Full Schema for Plesk/MySQL deployment
-- Run this script on your MySQL database in Plesk to create
-- or update all tables. Uses CREATE TABLE IF NOT EXISTS so it
-- is safe to run multiple times.
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- Profiles
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `bio` text,
  `institution` varchar(512),
  `position` varchar(512),
  `researchAreas` text,
  `website` text,
  `linkedIn` text,
  `twitter` text,
  `orcid` varchar(64),
  `photoUrl` text,
  `photoKey` text,
  `cvPdfUrl` text,
  `cvPdfKey` text,
  `phone` varchar(64),
  `country` varchar(128),
  `city` varchar(128),
  `languages` text,
  `availability` varchar(64),
  `isPublic` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`),
  CONSTRAINT `profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

-- News
CREATE TABLE IF NOT EXISTS `news` (
  `id` int AUTO_INCREMENT NOT NULL,
  `authorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `content` text NOT NULL,
  `summary` text,
  `category` varchar(128),
  `imageUrl` text,
  `isPublished` boolean NOT NULL DEFAULT false,
  `publishedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `news_id` PRIMARY KEY(`id`),
  CONSTRAINT `news_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`)
);

-- Messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `senderId` int NOT NULL,
  `recipientId` int NOT NULL,
  `subject` varchar(512),
  `body` text NOT NULL,
  `isRead` boolean NOT NULL DEFAULT false,
  `parentId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `messages_id` PRIMARY KEY(`id`),
  CONSTRAINT `messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`),
  CONSTRAINT `messages_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`)
);

-- Message Attachments
CREATE TABLE IF NOT EXISTS `messageAttachments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `messageId` int NOT NULL,
  `fileName` varchar(512) NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` text NOT NULL,
  `mimeType` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `messageAttachments_id` PRIMARY KEY(`id`),
  CONSTRAINT `messageAttachments_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE
);

-- Meetings
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizerId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `description` text,
  `modality` enum('online','in-person','hybrid') NOT NULL,
  `location` text,
  `meetingLink` text,
  `agenda` text,
  `type` enum('fixed','poll') NOT NULL DEFAULT 'fixed',
  `fixedDate` timestamp NULL,
  `pollDeadline` timestamp NULL,
  `finalDate` timestamp NULL,
  `status` enum('scheduled','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `meetings_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetings_organizerId_users_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`)
);

-- Meeting Attendance
CREATE TABLE IF NOT EXISTS `meetingAttendance` (
  `id` int AUTO_INCREMENT NOT NULL,
  `meetingId` int NOT NULL,
  `userId` int NOT NULL,
  `response` enum('attending','maybe','not_attending') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `meetingAttendance_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingAttendance_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meetingAttendance_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Meeting Date Options (for poll-type meetings)
CREATE TABLE IF NOT EXISTS `meetingDateOptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `meetingId` int NOT NULL,
  `proposedDate` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `meetingDateOptions_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingDateOptions_meetingId_meetings_id_fk` FOREIGN KEY (`meetingId`) REFERENCES `meetings`(`id`) ON DELETE CASCADE
);

-- Meeting Date Votes
CREATE TABLE IF NOT EXISTS `meetingDateVotes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `optionId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `meetingDateVotes_id` PRIMARY KEY(`id`),
  CONSTRAINT `meetingDateVotes_optionId_meetingDateOptions_id_fk` FOREIGN KEY (`optionId`) REFERENCES `meetingDateOptions`(`id`) ON DELETE CASCADE,
  CONSTRAINT `meetingDateVotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Congresses
CREATE TABLE IF NOT EXISTS `congresses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `name` varchar(512) NOT NULL,
  `description` text,
  `location` varchar(512),
  `modality` enum('in-person','online','hybrid'),
  `startDate` timestamp NULL,
  `endDate` timestamp NULL,
  `cfpDeadline` timestamp NULL,
  `cfpUrl` text,
  `cfpFileKey` text,
  `cfpFileUrl` text,
  `websiteUrl` text,
  `topic` text,
  `status` enum('upcoming','ongoing','past') NOT NULL DEFAULT 'upcoming',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `congresses_id` PRIMARY KEY(`id`),
  CONSTRAINT `congresses_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

-- Communication Proposals
CREATE TABLE IF NOT EXISTS `commProposals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `congressId` int NOT NULL,
  `proposerId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `topic` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `commProposals_id` PRIMARY KEY(`id`),
  CONSTRAINT `commProposals_congressId_congresses_id_fk` FOREIGN KEY (`congressId`) REFERENCES `congresses`(`id`) ON DELETE CASCADE,
  CONSTRAINT `commProposals_proposerId_users_id_fk` FOREIGN KEY (`proposerId`) REFERENCES `users`(`id`)
);

-- Communication Proposal Interests
CREATE TABLE IF NOT EXISTS `commProposalInterests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `communicationId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `commProposalInterests_id` PRIMARY KEY(`id`),
  CONSTRAINT `commProposalInterests_communicationId_commProposals_id_fk` FOREIGN KEY (`communicationId`) REFERENCES `commProposals`(`id`) ON DELETE CASCADE,
  CONSTRAINT `commProposalInterests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Papers
CREATE TABLE IF NOT EXISTS `papers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `abstract` text,
  `keywords` text,
  `targetJournal` varchar(512),
  `methodology` text,
  `status` enum('idea','in_progress','submitted','published','rejected') NOT NULL DEFAULT 'idea',
  `deadline` timestamp NULL,
  `doiUrl` text,
  `additionalInfo` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `papers_id` PRIMARY KEY(`id`),
  CONSTRAINT `papers_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

-- Paper Contributors
CREATE TABLE IF NOT EXISTS `paperContributors` (
  `id` int AUTO_INCREMENT NOT NULL,
  `paperId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `paperContributors_id` PRIMARY KEY(`id`),
  CONSTRAINT `paperContributors_paperId_papers_id_fk` FOREIGN KEY (`paperId`) REFERENCES `papers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `paperContributors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Events
CREATE TABLE IF NOT EXISTS `events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `title` varchar(512) NOT NULL,
  `description` text,
  `eventDate` timestamp NULL,
  `endDate` timestamp NULL,
  `location` varchar(512),
  `modality` enum('in-person','online','hybrid'),
  `websiteUrl` text,
  `topic` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `events_id` PRIMARY KEY(`id`),
  CONSTRAINT `events_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

-- Event Interests
CREATE TABLE IF NOT EXISTS `eventInterests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `userId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `eventInterests_id` PRIMARY KEY(`id`),
  CONSTRAINT `eventInterests_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  CONSTRAINT `eventInterests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Document Folders
CREATE TABLE IF NOT EXISTS `documentFolders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `parentId` int,
  `name` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `documentFolders_id` PRIMARY KEY(`id`),
  CONSTRAINT `documentFolders_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`)
);

-- Documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `uploaderId` int NOT NULL,
  `folderId` int,
  `fileName` varchar(512) NOT NULL,
  `fileKey` text NOT NULL,
  `fileUrl` text NOT NULL,
  `fileSize` bigint,
  `mimeType` varchar(128),
  `description` text,
  `accessLevel` enum('all','admin') NOT NULL DEFAULT 'all',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `documents_id` PRIMARY KEY(`id`),
  CONSTRAINT `documents_uploaderId_users_id_fk` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`),
  CONSTRAINT `documents_folderId_documentFolders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `documentFolders`(`id`)
);

-- Tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creatorId` int NOT NULL,
  `assigneeId` int,
  `title` varchar(512) NOT NULL,
  `description` text,
  `status` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `dueDate` timestamp NULL,
  `relatedModule` varchar(64),
  `relatedId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
  CONSTRAINT `tasks_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`),
  CONSTRAINT `tasks_assigneeId_users_id_fk` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`)
);

-- Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(512) NOT NULL,
  `body` text,
  `relatedModule` varchar(64),
  `relatedId` int,
  `isRead` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
  CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Drizzle migrations tracking table (required by drizzle-kit migrate)
CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `hash` text NOT NULL,
  `created_at` bigint,
  CONSTRAINT `__drizzle_migrations_id` PRIMARY KEY(`id`)
);
