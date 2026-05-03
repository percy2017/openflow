import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "store.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)`);

const getStmt = db.prepare("SELECT value FROM store WHERE key = ?");
const setStmt = db.prepare("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)");
const delStmt = db.prepare("DELETE FROM store WHERE key = ?");

export function get(key: string): string | null {
  const row = getStmt.get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function set(key: string, value: string): void {
  setStmt.run(key, value);
}

export function remove(key: string): void {
  delStmt.run(key);
}
