import { query } from "../config/db.js";
import { config } from "../config/env.js";

export const DEFAULT_CREDIT_PACKS = [
  { id: "starter", label: "Découverte", credits: 10, price: 500 },
  { id: "plus", label: "Confort", credits: 30, price: 1200 },
  { id: "pro", label: "Passion", credits: 60, price: 2000 }
];

const DEFAULTS = {
  siteName: "Archives",
  siteTagline: "Plateforme de documents",
  contactEmail: config.contactEmail,
  creditsInitiaux: config.creditsInitiaux,
  creditsParUpload: config.creditsParUpload,
  maxUploadSizeMb: config.maxFileSizeMb,
  allowRegistrations: true,
  publicBrowsing: config.publicBrowsing,
  creditPacks: DEFAULT_CREDIT_PACKS,
  tMoneyNumber: "",
  moovNumber: "",
  beneficiaryName: ""
};

const MAX_PACKS = 8;
const PACK_ID_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;

export function normalizeCreditPacks(value) {
  if (!Array.isArray(value)) return null;
  const packs = [];
  const seen = new Set();
  for (const [index, raw] of value.slice(0, MAX_PACKS).entries()) {
    if (!raw || typeof raw !== "object") continue;
    const credits = Number(raw.credits);
    const price = Number(raw.price);
    if (!Number.isInteger(credits) || credits < 1 || credits > 100000) continue;
    if (!Number.isInteger(price) || price < 0 || price > 100000000) continue;
    let id = typeof raw.id === "string" ? raw.id.trim() : "";
    if (!PACK_ID_RE.test(id) || seen.has(id.toLowerCase())) id = `pack-${index + 1}`;
    while (seen.has(id.toLowerCase())) id = `${id}-${index + 1}`;
    seen.add(id.toLowerCase());
    const label = String(raw.label ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    packs.push({ id, label: label || `${credits} crédits`, credits, price });
  }
  return packs;
}

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
      if (row.key === "siteTagline") {
        settings.siteTagline = String(row.value).slice(0, 120);
      }
      if (row.key === "creditsInitiaux" || row.key === "creditsParUpload") {
        const value = Number(row.value);
        if (Number.isFinite(value)) settings[row.key] = value;
      }
      if (row.key === "maxUploadSizeMb") {
        const value = Number(row.value);
        if (Number.isInteger(value) && value >= 1 && value <= 100) settings[row.key] = value;
      }
      if (row.key === "allowRegistrations" || row.key === "publicBrowsing") {
        settings[row.key] = row.value !== "false";
      }
      if (row.key === "creditPacks") {
        try {
          const packs = normalizeCreditPacks(JSON.parse(row.value));
          if (packs) settings.creditPacks = packs;
        } catch {
          // conserve les packs par défaut si la valeur stockée est invalide
        }
      }
      if (row.key === "tMoneyNumber" || row.key === "moovNumber" || row.key === "beneficiaryName") {
        settings[row.key] = String(row.value ?? "").slice(0, 80);
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
    ["siteTagline", values.siteTagline],
    ["contactEmail", values.contactEmail],
    ["creditsInitiaux", values.creditsInitiaux],
    ["creditsParUpload", values.creditsParUpload],
    ["maxUploadSizeMb", values.maxUploadSizeMb],
    ["allowRegistrations", values.allowRegistrations],
    ["publicBrowsing", values.publicBrowsing],
    ["creditPacks", values.creditPacks === undefined ? undefined : JSON.stringify(values.creditPacks)],
    ["tMoneyNumber", values.tMoneyNumber],
    ["moovNumber", values.moovNumber],
    ["beneficiaryName", values.beneficiaryName]
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
