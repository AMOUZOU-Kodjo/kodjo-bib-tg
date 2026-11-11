import express from "express";
import { config } from "../config/env.js";
import { getArticle, getNews, getNewsSources, getScienceNews } from "../services/news.service.js";
import { getScientificPublications } from "../services/science.service.js";
import { getContentCategories } from "../services/contentCategories.js";
import { syncNewsToTelegram } from "../services/newsTelegram.service.js";

const router = express.Router();

router.get("/article", async (req, res, next) => {
  try {
    const url = String(req.query.url || "").trim();
    if (!url) return res.status(400).json({ error: "Paramètre url requis" });
    const article = await getArticle(url);
    if (!article) return res.status(404).json({ error: "Article introuvable" });
    res.json({ article });
  } catch (err) {
    next(err);
  }
});

router.get("/categories", (_req, res) => {
  res.json({ categories: getContentCategories() });
});

function isTelegramSyncAuthorized(req) {
  const secret = config.telegram.newsSyncSecret;
  if (!secret) return false;
  const authorization = req.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : req.get("x-news-sync-secret") || "";
  return provided === secret;
}

router.get("/science", async (req, res, next) => {
  try {
    const [news, publications] = await Promise.all([
      getScienceNews({
        force: req.query.refresh === "1",
        includeImages: req.query.images !== "0"
      }),
      getScientificPublications({
        force: req.query.refresh === "1",
        limit: req.query.limit
      }).catch(() => null)
    ]);
    res.json({
      articles: news.articles,
      publications: publications?.publications || [],
      updatedAt: news.updatedAt ? new Date(news.updatedAt).toISOString() : null,
      sources: getNewsSources("science")
    });
  } catch (err) {
    next(err);
  }
});

router.post("/telegram/sync", async (req, res, next) => {
  try {
    if (!config.telegram.newsSyncSecret) {
      return res.status(503).json({ error: "Synchronisation Telegram non configurée" });
    }
    if (!isTelegramSyncAuthorized(req)) {
      return res.status(401).json({ error: "Non autorisé" });
    }
    const result = await syncNewsToTelegram({
      maxPerRun: req.query.max,
      initialize: req.query.initialize !== "0"
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const news = await getNews({
      force: req.query.refresh === "1",
      includeImages: req.query.images !== "0"
    });
    res.json({
      articles: news.articles,
      updatedAt: news.updatedAt ? new Date(news.updatedAt).toISOString() : null,
      sources: getNewsSources()
    });
  } catch (err) {
    next(err);
  }
});

export default router;
