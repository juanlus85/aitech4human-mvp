ALTER TABLE `congresses` MODIFY COLUMN `startDate` datetime;--> statement-breakpoint
ALTER TABLE `congresses` MODIFY COLUMN `endDate` datetime;--> statement-breakpoint
ALTER TABLE `congresses` MODIFY COLUMN `abstractDeadline` datetime;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `eventDate` datetime;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `endDate` datetime;--> statement-breakpoint
ALTER TABLE `meetingDateOptions` MODIFY COLUMN `proposedDate` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `meetings` MODIFY COLUMN `fixedDate` datetime;--> statement-breakpoint
ALTER TABLE `meetings` MODIFY COLUMN `pollDeadline` datetime;--> statement-breakpoint
ALTER TABLE `meetings` MODIFY COLUMN `finalDate` datetime;--> statement-breakpoint
ALTER TABLE `papers` MODIFY COLUMN `deadline` datetime;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `dueDate` datetime;