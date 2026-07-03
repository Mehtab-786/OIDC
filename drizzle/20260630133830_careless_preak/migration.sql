CREATE TABLE "users" (
	"id" uuid DEFAULT gen_random_uuid(),
	"username" varchar(255),
	"email" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
