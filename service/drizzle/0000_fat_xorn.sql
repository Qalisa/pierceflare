CREATE TABLE `flare_domains` (
	`ddnsForDomain` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`description` text NOT NULL,
	`syncedIpAt` integer,
	`latestSyncedIPv6` text,
	`latestSyncedIPv4` text
);
--> statement-breakpoint
CREATE TABLE `flare_keys` (
	`apiKey` text PRIMARY KEY NOT NULL,
	`ddnsForDomain` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`ddnsForDomain`) REFERENCES `flare_domains`(`ddnsForDomain`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `flares_send` (
	`ofDomain` text NOT NULL,
	`receivedAt` integer NOT NULL,
	`flaredIPv4` text,
	`flaredIPv6` text,
	`syncStatus` text DEFAULT 'waiting' NOT NULL,
	`statusAt` integer,
	`statusDescr` text,
	PRIMARY KEY(`receivedAt`, `ofDomain`),
	FOREIGN KEY (`ofDomain`) REFERENCES `flare_domains`(`ddnsForDomain`) ON UPDATE no action ON DELETE cascade
);
