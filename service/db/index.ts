import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import { createClient } from "@libsql/client/node";
import { SERVICE_DATABASE_FILES_PATH } from "@/server/env";
import { title } from "@/helpers/static";
import logr from "@/server/loggers";

//
const readyingDB = () => {
  const appDbName = title.toLowerCase();
  const sqlite = createClient({
    url: `file:${SERVICE_DATABASE_FILES_PATH}/${appDbName}.db`,
  });

  logr.log("Starting DB Schema Migration...");
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: "./drizzle" });
  logr.log("DB Schema Migration Done.");
  return db;
};

//
let db: ReturnType<typeof readyingDB> | null = null;

export const getDb = () => {
  return db ?? (db = readyingDB());
};
