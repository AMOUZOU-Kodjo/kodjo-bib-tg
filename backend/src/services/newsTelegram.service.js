import { config } from "../config/env.js";
import { ensureFeatureSchema, query } from "../config/db.js";
import { getNews } from "./news.service.js";
import { getSettings } from "./settings.service.js";
import { isTelegramConfigured, notifyTelegramNews } from "./telegram.service.js";

const SEND_DELAY_MS = 1200;
let syncInProgress = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildArticleUrl(article) {
  const base = String(config.frontendUrl || "").replace(/\/+$/, "");
  return `${base}/actualites/article?url=${encodeURIComponent(article.url)}`;
}

export async function syncNewsToTelegram({ maxPerRun, initialize = true } = {}) {
  if (syncInProgress) {
    return { skipped: true, reason: "already_running" };
  }
  syncInProgress = true;

  try {
    return await runNewsSync({ maxPerRun, initialize });
  } finally {
    syncInProgress = false;
  }
}

async function runNewsSync({ maxPerRun, initialize = true } = {}) {
  await ensureFeatureSchema();

  if (!isTelegramConfigured()) {
    return { skipped: true, reason: "telegram_not_configured" };
  }

  const parsedMax = Number(maxPerRun);
  const limit = Math.max(
    1,
    Math.min(Number.isFinite(parsedMax) ? parsedMax : config.telegram.newsMaxPerRun || 3, 10)
  );
  const news = await getNews({ includeImages: true });
  const articles = news.articles || [];
  if (articles.length === 0) {
    return { skipped: true, reason: "no_articles" };
  }

  const countRes = await query("SELECT COUNT(*)::int AS count FROM news_telegram_sent");
  const isFirstRun = Number(countRes.rows[0]?.count || 0) === 0;

  if (isFirstRun && initialize) {
    await query(
      `INSERT INTO news_telegram_sent (url)
       SELECT unnest($1::text[])
       ON CONFLICT (url) DO NOTHING`,
      [articles.map((article) => article.url)]
    );
    return { initialized: true, marked: articles.length };
  }

  const urls = articles.map((article) => article.url);
  const sentRes = await query(
    "SELECT url FROM news_telegram_sent WHERE url = ANY($1::text[])",
    [urls]
  );
  const sent = new Set(sentRes.rows.map((row) => row.url));
  const pending = articles
    .filter((article) => !sent.has(article.url))
    .sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0))
    .slice(0, limit);

  if (pending.length === 0) {
    return { sent: 0, failed: 0, pending: 0 };
  }

  const settings = await getSettings();
  let sentCount = 0;
  let failed = 0;

  for (let index = 0; index < pending.length; index += 1) {
    const article = pending[index];
    try {
      await notifyTelegramNews({
        title: article.title,
        description: article.description,
        source: article.source,
        siteName: settings.siteName,
        articleUrl: buildArticleUrl(article),
        sourceUrl: article.url,
        imageUrl: article.image
      });
      await query(
        "INSERT INTO news_telegram_sent (url) VALUES ($1) ON CONFLICT (url) DO NOTHING",
        [article.url]
      );
      sentCount += 1;
    } catch (err) {
      failed += 1;
      console.error(`[telegram-news] échec pour ${article.url}:`, err.message);
    }
    if (index < pending.length - 1) await sleep(SEND_DELAY_MS);
  }

  return { sent: sentCount, failed, pending: pending.length };
}
