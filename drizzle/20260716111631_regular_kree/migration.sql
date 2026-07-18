CREATE TABLE "refreshtoken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" varchar(255) NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "authcode" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "authcode" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "authcode" ALTER COLUMN "client_id" SET DATA TYPE varchar(255) USING "client_id"::varchar(255);--> statement-breakpoint
ALTER TABLE "authcode" ALTER COLUMN "redirect_uri" SET DATA TYPE varchar(255) USING "redirect_uri"::varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "redirect_uri" SET DATA TYPE varchar(255) USING "redirect_uri"::varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "client_id" SET DATA TYPE varchar(255) USING "client_id"::varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "client_secret" SET DATA TYPE varchar(255) USING "client_secret"::varchar(255);--> statement-breakpoint
ALTER TABLE "authcode" ADD CONSTRAINT "authcode_code_key" UNIQUE("code");