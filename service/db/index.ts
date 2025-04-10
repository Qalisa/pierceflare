import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import { mkdirSync } from "fs";

import { createClient } from "@libsql/client/node";

import { title } from "#/helpers/static";
import { SERVICE_DATABASE_FILES_PATH } from "#/server/env";
import logr from "#/server/loggers";

//
const readyingDB = () => {
  //
  logr.log("Initiating DB...");
  mkdirSync(SERVICE_DATABASE_FILES_PATH, { recursive: true });

  //
  const appDbName = title.toLowerCase();
  const url = `file:${SERVICE_DATABASE_FILES_PATH}/${appDbName}.db`;

  //
  logr.log("Loading SQLite DB from", url);
  const sqlite = createClient({
    url,
  });
  const db = drizzle(sqlite);

  //
  logr.log("Starting DB Schema Migration...");
  migrate(db, { migrationsFolder: "./drizzle" });
  logr.log("DB Schema Migration Done");

  //
  logr.log("Database Ready !");
  return db;
};

//
let db: ReturnType<typeof readyingDB> | null = null;

export const getDb = () => {
  return db ?? (db = readyingDB());
};
