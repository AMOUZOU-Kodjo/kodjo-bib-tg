import pg from "pg";
import { config } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 300000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

let lastActivityAt = 0;

export function touchDatabaseActivity() {
  lastActivityAt = Date.now();
}

export async function query(text, params) {
  touchDatabaseActivity();
  const res = await pool.query(text, params);
  return res;
}

let keepAliveTimer;

export function startDatabaseKeepAlive() {
  if (keepAliveTimer) return;
  const interval = Number(process.env.DATABASE_KEEPALIVE_MS || 180000);
  const activityWindow = Number(process.env.DATABASE_ACTIVITY_WINDOW_MS || 600000);
  if (!Number.isFinite(interval) || interval <= 0) return;
  if (!Number.isFinite(activityWindow) || activityWindow <= 0) return;

  keepAliveTimer = setInterval(() => {
    if (Date.now() - lastActivityAt > activityWindow) return;
    pool.query("SELECT 1").catch((err) => {
      console.error("Keepalive base de données échoué:", err.message);
    });
  }, interval);
  keepAliveTimer.unref();
}
