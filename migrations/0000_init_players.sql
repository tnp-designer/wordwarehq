CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sprite` text NOT NULL,
	`x` real NOT NULL,
	`y` real NOT NULL,
	`dir` text NOT NULL,
	`moving` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);

