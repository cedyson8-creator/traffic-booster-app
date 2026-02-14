CREATE TABLE `performance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scheduleId` int,
	`alertType` enum('low_success_rate','high_bounce_rate','delivery_failure') NOT NULL,
	`threshold` int NOT NULL,
	`currentValue` int NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL,
	`message` text NOT NULL,
	`isResolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `performance_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_delivery_logs` ADD `retryCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_delivery_logs` ADD `nextRetryAt` timestamp DEFAULT (now()) NOT NULL;