import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { Database } from "bun:sqlite";
import { SERVICE_DATABASE_FILES_PATH } from "@/server/env";
import { title } from "@/helpers/static";

const appDbName = title.toLowerCase();
const sqlite = new Database(SERVICE_DATABASE_FILES_PATH + `/${appDbName}.db`);

//

const db = (() => {
  console.log(`[${title}]`, "Starting DB Schema Migration...");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log(`[${title}]`, "DB Schema Migration Done.");
  return db;
})();

//
export const prewarmDb = () => {
  return db;
};

//
export default db;
