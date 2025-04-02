import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { SERVICE_DATABASE_FILES_PATH } from "@/server/env";

const sqlite = new Database(SERVICE_DATABASE_FILES_PATH + "/sqlite.db");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });

export const awaitMigration = () => db;
export default db;
