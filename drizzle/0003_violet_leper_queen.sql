CREATE TABLE `email_delivery_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('sent','failed','bounced') NOT NULL,
	`errorMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_delivery_logs_id` PRIMARY KEY(`id`)
);
