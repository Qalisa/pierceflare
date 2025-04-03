CREATE TABLE `flare_domains` (
	`ddnsForDomain` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`description` text NOT NULL,
	`syncedIpAt` integer,
	`latestSyncedIp` text
);
--> statement-breakpoint
CREATE TABLE `flare_keys` (
	`apiKey` text PRIMARY KEY NOT NULL,
	`ddnsForDomain` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`ddnsForDomain`) REFERENCES `flare_domains`(`ddnsForDomain`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `flares_send` (
	`ofDomain` text,
	`receivedAt` integer NOT NULL,
	`flaredIp` text NOT NULL,
	`syncStatus` text DEFAULT 'waiting' NOT NULL,
	`statusAt` integer,
	`statusDescr` text,
	PRIMARY KEY(`receivedAt`, `ofDomain`),
	FOREIGN KEY (`ofDomain`) REFERENCES `flare_domains`(`ddnsForDomain`) ON UPDATE no action ON DELETE no action
);
