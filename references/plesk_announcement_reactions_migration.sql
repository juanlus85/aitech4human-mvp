-- Run once on the production MySQL database used by research.blancoguzman.es.
-- Adds member reactions to announcements and their replies.
-- Each member can apply one heart and one thumbs-up to the same target.

CREATE TABLE IF NOT EXISTS `announcementReactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `targetType` enum('announcement','reply') NOT NULL,
  `targetId` int NOT NULL,
  `userId` int NOT NULL,
  `reactionType` enum('heart','thumbs_up') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `announcementReactions_id` PRIMARY KEY (`id`),
  CONSTRAINT `announcementReactions_target_user_type_unique` UNIQUE (`targetType`, `targetId`, `userId`, `reactionType`),
  CONSTRAINT `announcementReactions_userId_users_id_fk`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
