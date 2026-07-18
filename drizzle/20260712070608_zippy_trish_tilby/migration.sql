CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"application_name" varchar(255) NOT NULL UNIQUE,
	"application_url" varchar(255) NOT NULL UNIQUE,
	"redirect_uri" varchar(66) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
