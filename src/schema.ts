import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sprite: text("sprite").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  dir: text("dir").notNull(),
  moving: integer("moving").notNull().default(0),
  updated_at: integer("updated_at").notNull(),
});
