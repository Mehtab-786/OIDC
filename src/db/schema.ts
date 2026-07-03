import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().defaultRandom(),
  username: varchar({ length: 255 }),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar("password", { length: 66 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
