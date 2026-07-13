import { boolean } from "drizzle-orm/cockroach-core";
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar("password", { length: 66 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: uuid().primaryKey().defaultRandom(),
  applicationName: varchar("application_name", { length: 255 })
    .notNull()
    .unique(),
  applicationUrl: varchar("application_url", { length: 255 })
    .notNull()
    .unique(),
  redirectUri: varchar("redirect_uri", { length: 66 }).notNull(),
  clientId: varchar("client_id", { length: 70 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 70 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authcode = pgTable("authcode", {
  id: uuid().primaryKey().defaultRandom(),
  code: varchar({length:80}).notNull(),
  userId: varchar({ length: 255 }).notNull(),
  clientId: varchar("client_id", { length: 70 }).notNull(),
  redirectUri: varchar("redirect_uri", { length: 80 }).notNull(),
  used:boolean().default(false),
  expiresAt: timestamp("expires_at").notNull(),
});

