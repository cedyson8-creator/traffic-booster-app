CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`websiteId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('social','content','seo') NOT NULL,
	`status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`targetVisits` int NOT NULL,
	`currentVisits` int NOT NULL DEFAULT 0,
	`duration` int NOT NULL,
	`budget` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google_analytics','fiverr','facebook','twitter','instagram') NOT NULL,
	`credentialData` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google_analytics','fiverr','facebook','twitter','instagram') NOT NULL,
	`websiteId` int,
	`status` enum('success','failed','pending') NOT NULL,
	`errorMessage` text,
	`syncedRecords` int NOT NULL DEFAULT 0,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integration_sync_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `traffic_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`websiteId` int NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`visits` int NOT NULL DEFAULT 0,
	`uniqueVisitors` int NOT NULL DEFAULT 0,
	`bounceRate` int NOT NULL DEFAULT 0,
	`avgSessionDuration` int NOT NULL DEFAULT 0,
	`source` enum('direct','social','referral','search','other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `traffic_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `websites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`category` enum('blog','ecommerce','portfolio','business','other') NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`totalVisits` int NOT NULL DEFAULT 0,
	`monthlyVisits` int NOT NULL DEFAULT 0,
	`weeklyGrowth` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `websites_id` PRIMARY KEY(`id`)
);
