CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`logId` int NOT NULL,
	`eventType` enum('delivered','opened','clicked','bounced','complained') NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
