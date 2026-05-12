CREATE TABLE `collectionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`topicId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`monitoringId` int,
	`title` varchar(255) NOT NULL,
	`message` text,
	`type` enum('new_trend','monitoring_update','system') NOT NULL DEFAULT 'system',
	`isRead` boolean NOT NULL DEFAULT false,
	`relatedTopicIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`niche` varchar(255),
	`resultCount` int DEFAULT 0,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`contentAngle` enum('question','problem','trend','seasonal') NOT NULL,
	`trendScore` decimal(5,2) NOT NULL,
	`sources` json NOT NULL,
	`suggestedFormats` json NOT NULL,
	`whyTrending` text,
	`exampleQuestions` json,
	`relatedKeywords` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trendMonitoring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`niche` varchar(255),
	`frequency` enum('daily','weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trendMonitoring_id` PRIMARY KEY(`id`)
);
