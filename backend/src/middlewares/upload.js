import multer from "multer";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";

const storage = multer.memoryStorage();
const fallbackMaxSizeMb = Number.isFinite(config.maxFileSizeMb) && config.maxFileSizeMb > 0 ? config.maxFileSizeMb : 10;
const uploaders = new Map();

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

function getUploader(maxSizeMb) {
  if (!uploaders.has(maxSizeMb)) {
    uploaders.set(
      maxSizeMb,
      multer({
        storage,
        fileFilter,
        limits: { fileSize: maxSizeMb * 1024 * 1024 }
      })
    );
  }
  return uploaders.get(maxSizeMb);
}

export function uploadSingle(fieldName) {
  return async (req, res, next) => {
    try {
      const settings = await getSettings();
      const configuredMaxSizeMb = Number(settings.maxUploadSizeMb) || fallbackMaxSizeMb;
      const maxSizeMb = Math.min(Math.max(configuredMaxSizeMb, 1), 100);
      getUploader(maxSizeMb).single(fieldName)(req, res, (err) => {
        if (!err) return next();
        if (err.code === "LIMIT_FILE_SIZE") {
          err.message = `Fichier trop volumineux. Taille maximale : ${maxSizeMb} Mo.`;
          err.maxUploadSizeMb = maxSizeMb;
        }
        next(err);
      });
    } catch (err) {
      next(err);
    }
  };
}
