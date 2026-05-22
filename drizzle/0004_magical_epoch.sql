CREATE TABLE `congressAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`congressId` int NOT NULL,
	`userId` int NOT NULL,
	`response` enum('attending','maybe','not_attending') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `congressAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `congressAttendance` ADD CONSTRAINT `congressAttendance_congressId_congresses_id_fk` FOREIGN KEY (`congressId`) REFERENCES `congresses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `congressAttendance` ADD CONSTRAINT `congressAttendance_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;