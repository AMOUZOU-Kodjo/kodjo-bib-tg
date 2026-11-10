import express from "express";
import { optionalAuth } from "../middlewares/auth.js";
import { getSettings } from "../services/settings.service.js";
import { ensureCategoriesSchema, getCategoryTree } from "../services/categories.service.js";

const router = express.Router();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    if (!(await getSettings()).publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    await ensureCategoriesSchema();
    const categories = await getCategoryTree({ includeInactive: false, publicOnly: true });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

export default router;
