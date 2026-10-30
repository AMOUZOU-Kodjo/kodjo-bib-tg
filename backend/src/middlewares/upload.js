import path from "path";
import multer from "multer";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";

const storage = multer.memoryStorage();
const fallbackMaxSizeMb = Number.isFinite(config.maxFileSizeMb) && config.maxFileSizeMb > 0 ? config.maxFileSizeMb : 10;
const uploaders = new Map();

const ALLOWED_UPLOADS = new Map([
  [".pdf", new Set(["application/pdf"])],
  [".doc", new Set(["application/msword", "application/vnd.ms-word"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  [".xls", new Set(["application/vnd.ms-excel"])],
  [".xlsx", new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])],
  [".ppt", new Set(["application/vnd.ms-powerpoint"])],
  [".pptx", new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"])],
  [".txt", new Set(["text/plain"])]
]);

export function validateUploadFile(file) {
  const extension = path.extname(String(file?.originalname || "")).toLowerCase();
  const mimeType = String(file?.mimetype || "").toLowerCase().split(";")[0].trim();
  const allowedMimeTypes = ALLOWED_UPLOADS.get(extension);
  if (!allowedMimeTypes || !allowedMimeTypes.has(mimeType)) {
    const err = new Error("Type de fichier non autorisé");
    err.status = 400;
    err.code = "INVALID_FILE_TYPE";
    return err;
  }
  return null;
}

const fileFilter = (req, file, cb) => {
  const error = validateUploadFile(file);
  cb(error, !error);
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
