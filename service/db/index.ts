import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { Database } from "bun:sqlite";
import { SERVICE_DATABASE_FILES_PATH } from "@/server/env";
import { title } from "@/server/static";

const appDbName = title.toLowerCase();
const sqlite = new Database(SERVICE_DATABASE_FILES_PATH + `/${appDbName}.db`);

//
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });

//
export const awaitMigration = () => {
  console.log("Starting DB Schema Migration...");
  return db;
};

//
export default db;
