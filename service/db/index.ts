import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import { createClient } from "@libsql/client/node";
import { SERVICE_DATABASE_FILES_PATH } from "@/server/env";
import { title } from "@/helpers/static";

console.log("LOADED WS DATABASE");

const db = (() => {
  const appDbName = title.toLowerCase();
  const sqlite = createClient({
    url: `file:${SERVICE_DATABASE_FILES_PATH}/${appDbName}.db`,
  });

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
