import express from "express";
import { getSettings } from "../services/settings.service.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      siteName: settings.siteName,
      contactEmail: settings.contactEmail,
      creditsParUpload: settings.creditsParUpload,
      maxUploadSizeMb: settings.maxUploadSizeMb
    });
  } catch (err) {
    next(err);
  }
});

export default router;
