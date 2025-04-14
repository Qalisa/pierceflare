import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import { mkdirSync } from "fs";

import { createClient } from "@libsql/client/node";

import { title } from "#/helpers/static";
import logr from "#/server/helpers/loggers";

//
const readyingDB = (dbFilePath: string | null) => {
  //
  if (!dbFilePath) {
    const message =
      "Call to defineDbCharacteristics is required before using database.";
    logr.error(message);
    throw new Error(message);
  }

  //
  logr.log("Initiating DB...");
  mkdirSync(dbFilePath, { recursive: true });

  //
  const appDbName = title.toLowerCase();
  const url = `file:${dbFilePath}/${appDbName}.db`;

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

//
//
//

//
let _dbFilePath: string | null = null;
export const defineDbCharacteristics = (options: { dbFilePath: string }) => {
  _dbFilePath = options.dbFilePath;
};

//
export const getDb = () => {
  return db ?? (db = readyingDB(_dbFilePath));
};
