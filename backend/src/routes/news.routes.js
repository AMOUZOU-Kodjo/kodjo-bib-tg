import express from "express";
import { authRequired } from "../middlewares/auth.js";
import { uploadSingle } from "../middlewares/upload.js";
import { uploadArticleImage } from "../services/cloudinary.service.js";
import { config } from "../config/env.js";
import { getArticle, getNews, getNewsSources, getScienceNews, getWorldNews, getResearchNews } from "../services/news.service.js";
import { getScientificPublications } from "../services/science.service.js";
import { createUserArticle, getUserArticle, listUserArticles } from "../services/userArticles.service.js";
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
      }).catch((err) => {
        console.error("[science] OpenAlex:", err?.message || err);
        return null;
      })
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

router.get("/world", async (req, res, next) => {
  try {
    const news = await getWorldNews({
      force: req.query.refresh === "1",
      includeImages: req.query.images !== "0"
    });
    res.json({
      articles: news.articles,
      updatedAt: news.updatedAt ? new Date(news.updatedAt).toISOString() : null,
      sources: getNewsSources("world")
    });
  } catch (err) {
    next(err);
  }
});

router.get("/research", async (req, res, next) => {
  try {
    const news = await getResearchNews({
      force: req.query.refresh === "1",
      includeImages: req.query.images !== "0"
    });
    res.json({
      articles: news.articles,
      updatedAt: news.updatedAt ? new Date(news.updatedAt).toISOString() : null,
      sources: getNewsSources("research")
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

router.get("/user-articles", async (req, res, next) => {
  try {
    const articles = await listUserArticles({ limit: req.query.limit });
    res.json({ articles });
  } catch (err) {
    next(err);
  }
});

router.get("/user-article", async (req, res, next) => {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Paramètre id requis" });
    const article = await getUserArticle(id);
    if (!article) return res.status(404).json({ error: "Article introuvable" });
    res.json({ article });
  } catch (err) {
    next(err);
  }
});

router.post("/user-articles", authRequired, async (req, res, next) => {
  try {
    const { title, content, category, imageUrl } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    const article = await createUserArticle({
      userId: req.user.id,
      authorName: req.user.displayName || req.user.email,
      title: String(title).trim(),
      content: String(content).trim(),
      category: category ? String(category).trim() : null,
      imageUrl: imageUrl ? String(imageUrl).trim() : null
    });
    res.status(201).json({ article });
  } catch (err) {
    next(err);
  }
});

router.post("/user-articles/image", authRequired, uploadSingle("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image requise" });
    const result = await uploadArticleImage(req.file.buffer, req.user.id);
    res.json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

export default router;
