import { Database } from "bun:sqlite";
import { SessionData, Store } from "express-session";

class DbSessionData {
  data!: string;
}

class SQLiteSessionStore extends Store {
  private db: Database;

  constructor(options: { dbPath?: string } = {}) {
    super();
    this.db = new Database(options.dbPath || "sessions.sqlite", {
      create: true,
    });
    this.init();
  }

  private init() {
    this.db
      .query(
        `
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        data TEXT,
        expires INTEGER
      )
    `,
      )
      .run();
  }

  get(sid: string, callback: (err: unknown, session?: SessionData) => void) {
    try {
      const row = this.db
        .query(
          "SELECT data FROM sessions WHERE sid = ? AND (expires IS NULL OR expires > ?)",
        )
        .as(DbSessionData)
        .get(sid, Date.now());
      callback(null, row ? JSON.parse(row.data) : null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, session: SessionData, callback?: (err?: unknown) => void) {
    try {
      const expires = session.cookie?.expires
        ? new Date(session.cookie.expires).getTime()
        : null;
      this.db
        .query(
          "INSERT INTO sessions (sid, data, expires) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires = excluded.expires",
        )
        .run(sid, JSON.stringify(session), expires);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void) {
    try {
      this.db.query("DELETE FROM sessions WHERE sid = ?").run(sid);
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  }
}

export default SQLiteSessionStore;
