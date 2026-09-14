-- Run once on the production MySQL database used by research.blancoguzman.es.
-- This enables removing a message from one participant's Inbox or Sent view
-- without deleting it for any other participant.

CREATE TABLE IF NOT EXISTS `messageDeletions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `messageId` int NOT NULL,
  `userId` int NOT NULL,
  `deletedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `messageDeletions_id` PRIMARY KEY (`id`),
  CONSTRAINT `messageDeletions_message_user_unique` UNIQUE (`messageId`, `userId`),
  CONSTRAINT `messageDeletions_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  CONSTRAINT `messageDeletions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
