CREATE TABLE `alert_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`alertType` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`status` enum('sent','failed','bounced') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`alertType` enum('error_rate','webhook_failure','rate_limit_exceeded','api_key_rotated') NOT NULL,
	`threshold` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`errorId` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`level` enum('fatal','error','warning','info','debug') NOT NULL,
	`endpoint` varchar(255),
	`statusCode` int,
	`stackTrace` text,
	`context` json,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `error_logs_errorId_unique` UNIQUE(`errorId`)
);
--> statement-breakpoint
CREATE TABLE `webhook_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`webhookId` varchar(255) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`eventType` varchar(255) NOT NULL,
	`attempt` int NOT NULL DEFAULT 1,
	`statusCode` int,
	`response` text,
	`error` text,
	`nextRetryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_logs_id` PRIMARY KEY(`id`)
);
