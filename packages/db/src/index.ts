import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as schema from './schema';

export * from './schema';

// Helper to resolve the storage directory path by walking up
function resolveDatabasePath(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  let currentDir = process.cwd();
  // Limit walk to 10 parent directories to avoid infinite loops
  for (let i = 0; i < 10; i++) {
    const storagePath = path.join(currentDir, 'storage');
    if (fs.existsSync(storagePath) && fs.statSync(storagePath).isDirectory()) {
      return path.join(storagePath, 'sqlite.db');
    }
    // Also check if turbo.json exists (monorepo root)
    if (fs.existsSync(path.join(currentDir, 'turbo.json'))) {
      const targetStorage = path.join(currentDir, 'storage');
      if (!fs.existsSync(targetStorage)) {
        fs.mkdirSync(targetStorage, { recursive: true });
      }
      return path.join(targetStorage, 'sqlite.db');
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  // Fallback to process.cwd() / storage / sqlite.db
  const fallbackDir = path.join(process.cwd(), 'storage');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return path.join(fallbackDir, 'sqlite.db');
}

const dbPath = resolveDatabasePath();
// Make sure the directory for the database exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export function closeConnection() {
  sqlite.close();
}
