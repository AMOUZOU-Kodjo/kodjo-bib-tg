import express from "express";
import { getArticle, getNews, getNewsSources } from "../services/news.service.js";

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
