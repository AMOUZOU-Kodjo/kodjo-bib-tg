import express from "express";
import { getNews, getNewsSources } from "../services/news.service.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const news = await getNews({ force: req.query.refresh === "1" });
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
