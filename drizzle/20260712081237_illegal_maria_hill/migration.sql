ALTER TABLE "clients" ADD COLUMN "client_id" varchar(70) NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "client_secret" varchar(70) NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_client_id_key" UNIQUE("client_id");