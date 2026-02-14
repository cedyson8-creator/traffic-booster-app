CREATE TABLE `scheduled_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`websiteId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`metrics` json NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL,
	`dayOfWeek` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday'),
	`dayOfMonth` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`nextSendAt` timestamp NOT NULL,
	`lastSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_reports_id` PRIMARY KEY(`id`)
);
