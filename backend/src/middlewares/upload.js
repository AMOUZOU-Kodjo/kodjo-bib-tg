import path from "path";
import multer from "multer";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";

const storage = multer.memoryStorage();
const fallbackMaxSizeMb = Number.isFinite(config.maxFileSizeMb) && config.maxFileSizeMb > 0 ? config.maxFileSizeMb : 10;
const uploaders = new Map();
const AVATAR_MAX_SIZE_MB = 5;

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

const ALLOWED_AVATARS = new Map([
  [".jpg", new Set(["image/jpeg", "image/jpg", "image/pjpeg"])],
  [".jpeg", new Set(["image/jpeg", "image/jpg", "image/pjpeg"])],
  [".png", new Set(["image/png"])],
  [".webp", new Set(["image/webp"])]
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

export function validateAvatarFile(file) {
  const extension = path.extname(String(file?.originalname || "")).toLowerCase();
  const mimeType = String(file?.mimetype || "").toLowerCase().split(";")[0].trim();
  const allowedMimeTypes = ALLOWED_AVATARS.get(extension);
  if (!allowedMimeTypes || !allowedMimeTypes.has(mimeType)) {
    const err = new Error("Format d'image non autorisé. Utilisez JPG, PNG ou WebP.");
    err.status = 400;
    err.code = "INVALID_FILE_TYPE";
    return err;
  }
  return null;
}

export function validateAvatarBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    const err = new Error("Image invalide");
    err.status = 400;
    err.code = "INVALID_IMAGE";
    return err;
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    const err = new Error("Le contenu du fichier ne correspond pas à une image valide");
    err.status = 400;
    err.code = "INVALID_IMAGE";
    return err;
  }
  return null;
}

const fileFilter = (req, file, cb) => {
  const error = validateUploadFile(file);
  cb(error, !error);
};

const avatarFileFilter = (req, file, cb) => {
  const error = validateAvatarFile(file);
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

let avatarUploader;

export function uploadAvatarSingle(fieldName = "avatar") {
  if (!avatarUploader) {
    avatarUploader = multer({
      storage,
      fileFilter: avatarFileFilter,
      limits: { fileSize: AVATAR_MAX_SIZE_MB * 1024 * 1024, files: 1 }
    });
  }
  return (req, res, next) => {
    avatarUploader.single(fieldName)(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE") {
        err.message = `Image trop volumineuse. Taille maximale : ${AVATAR_MAX_SIZE_MB} Mo.`;
        err.maxUploadSizeMb = AVATAR_MAX_SIZE_MB;
      }
      next(err);
    });
  };
}


export function uploadMultiple(fieldName, maxFiles = 10) {
  return async (req, res, next) => {
    try {
      const settings = await getSettings();
      const configuredMaxSizeMb = Number(settings.maxUploadSizeMb) || fallbackMaxSizeMb;
      const maxSizeMb = Math.min(Math.max(configuredMaxSizeMb, 1), 100);
      const uploader = multer({
        storage,
        fileFilter,
        limits: { fileSize: maxSizeMb * 1024 * 1024, files: maxFiles }
      });
      uploader.array(fieldName, maxFiles)(req, res, (err) => {
        if (!err) return next();
        if (err.code === "LIMIT_FILE_SIZE") {
          err.message = `Fichier trop volumineux. Taille maximale : ${maxSizeMb} Mo.`;
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          err.message = `Trop de fichiers. Maximum : ${maxFiles}.`;
        }
        next(err);
      });
    } catch (err) {
      next(err);
    }
  };
}
