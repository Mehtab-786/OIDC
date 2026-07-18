CREATE TABLE "authcode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(80) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"client_id" varchar(70) NOT NULL,
	"redirect_uri" varchar(80) NOT NULL,
	"used" bool,
	"expires_at" timestamp NOT NULL
);
