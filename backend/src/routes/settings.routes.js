import express from "express";
import { getSettings } from "../services/settings.service.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      contactEmail: settings.contactEmail,
      creditsParUpload: settings.creditsParUpload,
      maxUploadSizeMb: settings.maxUploadSizeMb,
      allowRegistrations: settings.allowRegistrations,
      publicBrowsing: settings.publicBrowsing,
      creditPacks: settings.creditPacks,
      tMoneyNumber: settings.tMoneyNumber,
      moovNumber: settings.moovNumber,
      beneficiaryName: settings.beneficiaryName
    });
  } catch (err) {
    next(err);
  }
});

export default router;
