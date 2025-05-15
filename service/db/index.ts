import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql/node";
import { mkdirSync } from "fs";

import { createClient } from "@libsql/client/node";

import { title } from "#/helpers/static";
import logr from "#/server/helpers/loggers";

//
//
//

/**
 * @dev Adapt to your needs. Theses will be accessible to your extra migrations
 * @example
 * type ExtraMigrationsPayload = {
 *    defaultAdminUser: string;
 * }
 */
type ExtraMigrationsPayload = null;

//
//
//

/**
 * @dev may adapt the logic to your needs, depending on DB technology (sqlite, postgres...)
 */
type DatabasePrewarmConfig = {
  dbFilePath: string;
  extraMigrationsPayload?: ExtraMigrationsPayload;
};

/**
 * Ensures migrations and maintenance tasks are due
 * @dev may adapt the logic to your needs, depending on DB technology (sqlite, postgres...)
 * */
export const readyingDB = async (options: DatabasePrewarmConfig) => {
  //
  logr.log("Initiating DB...");
  mkdirSync(options.dbFilePath, { recursive: true });

  //
  const appDbName = title.toLowerCase();
  const url = `file:${options.dbFilePath}/${appDbName}.db`;

  //
  logr.log("Loading SQLite DB from", url);
  const sqlite = createClient({
    url,
  });
  const db = drizzle(sqlite);

  //
  logr.log("Starting DB Schema Migration...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  logr.log("DB Schema Migration Done");

  //
  await maybeProcessExtraMigrations(db, options.extraMigrationsPayload);

  //
  logr.log("Database Ready !");

  //
  _db = db;
};

//
//
//

//
type DBType = ReturnType<typeof drizzle>;

//
type ExtraMigrationsConfig = Array<{
  /** description of the job */
  description: string;

  /** What to do for this job */
  job: (
    /** Transaction handler, use to apply migrations (similar to "db", but automatically rollback on failure) */
    tx: Parameters<Parameters<DBType["transaction"]>[0]>[0],

    /** Used to customize behavior of your job; put there names, credentials, group names... */
    payload?: ExtraMigrationsPayload,
  ) => Promise<void>;
}>;

/**
 * @dev
 * Define here any extra migrations to be ran after Drizzle migrations.
 *
 * These will be executed sequentially.
 *
 * If any of those may fail, will rollback all operations.
 *
 * @example
 * const extraMigrations: ExtraMigrationsConfig = [
 *  {
 *    description: "May create default admin user",
 *    job: async (tx, payload) => {
 *      //
 *      const { username } = payload;
 *
 *      // Put here any step (filling tables...)
 *      await tx.insert(mytable).values({ username, ...})
 *    },
 *  },
 *  // maybe other jobs...
 * ]
 *
 *
 *
 */
const extraMigrations: ExtraMigrationsConfig = [];

//
const maybeProcessExtraMigrations = async (
  db: DBType,
  payload?: ExtraMigrationsPayload,
) => {
  //
  if (extraMigrations.length == 0) return;

  await db.transaction(async (tx) => {
    //
    for (const extraMigration of extraMigrations) {
      logr.log(
        `Processing extra migration: "${extraMigration.description}"...`,
      );

      //
      await extraMigration.job(tx, payload).catch((e) => {
        logr.log(`Extra migration "${extraMigration.description}" failed !`);
        throw e;
      });
    }
  });

  //
  logr.log("Extra migrations OK !");
};

//
//
//

//
let _db: DBType | null = null;

//
export const getDb = () => {
  // failsafe
  if (!_db) {
    const message =
      'Call to "readyingDB" is required before interacting with the database.';
    logr.error(message);
    throw new Error(message);
  }

  //
  return _db;
};
