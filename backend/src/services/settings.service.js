import { query } from "../config/db.js";
import { config } from "../config/env.js";

const DEFAULTS = {
  siteName: "Archives",
  contactEmail: config.contactEmail,
  creditsInitiaux: config.creditsInitiaux,
  creditsParUpload: config.creditsParUpload,
  maxUploadSizeMb: config.maxFileSizeMb
};

let ensurePromise;
let cachedSettings;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60000;

function ensureTable() {
  if (!ensurePromise) {
    ensurePromise = query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `).catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

export async function getSettings({ fresh = false } = {}) {
  if (!fresh && cachedSettings && Date.now() < cacheExpiresAt) {
    return cachedSettings;
  }
  try {
    await ensureTable();
    const res = await query("SELECT key, value FROM site_settings");
    const settings = { ...DEFAULTS };
    for (const row of res.rows) {
      if (row.key === "siteName" || row.key === "contactEmail") {
        if (row.value) settings[row.key] = row.value;
      }
      if (row.key === "creditsInitiaux" || row.key === "creditsParUpload") {
        const value = Number(row.value);
        if (Number.isFinite(value)) settings[row.key] = value;
      }
      if (row.key === "maxUploadSizeMb") {
        const value = Number(row.value);
        if (Number.isInteger(value) && value >= 1 && value <= 100) settings[row.key] = value;
      }
    }
    cachedSettings = settings;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return settings;
  } catch (err) {
    console.error("Impossible de charger les paramètres du site:", err.message);
    return { ...DEFAULTS };
  }
}

export async function saveSettings(values) {
  await ensureTable();
  const entries = [
    ["siteName", values.siteName],
    ["contactEmail", values.contactEmail],
    ["creditsInitiaux", values.creditsInitiaux],
    ["creditsParUpload", values.creditsParUpload],
    ["maxUploadSizeMb", values.maxUploadSizeMb]
  ];
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    await query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, String(value)]
    );
  }
  cachedSettings = null;
  cacheExpiresAt = 0;
  return getSettings({ fresh: true });
}
