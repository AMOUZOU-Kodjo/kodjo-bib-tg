import { randomUUID } from "crypto";
import cloudinary from "../config/cloudinary.js";
import { deleteR2Object, getR2SignedUrl, isR2Configured, isR2Key, uploadR2Object } from "./r2.service.js";

export async function uploadRaw(fileBuffer, originalName, mimeType) {
  if (isR2Configured()) {
    return uploadR2Object(fileBuffer, originalName, mimeType);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "archives",
        type: "authenticated",
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

export function uploadPreview(fileBuffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "authenticated",
        folder: "archives/previews",
        format: "jpg",
        width: 900,
        height: 1200,
        crop: "fill",
        gravity: "north",
        background: "white",
        quality: "auto:good"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

export function uploadAvatar(fileBuffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "archives/avatars",
        public_id: `user-${userId}-${randomUUID()}`,
        overwrite: false,
        invalidate: true,
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto:good", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

export function uploadArticleImage(fileBuffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "archives/articles",
        public_id: `article-${userId}-${randomUUID()}`,
        overwrite: false,
        invalidate: true,
        transformation: [
          { width: 1200, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

export async function deleteAvatar(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (err) {
    console.error("Erreur suppression de la photo de profil Cloudinary", err);
  }
}

export async function deleteRaw(publicId) {
  if (isR2Key(publicId)) {
    try {
      await deleteR2Object(publicId);
    } catch (err) {
      console.error("Erreur suppression R2", err);
    }
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated" });
  } catch (err) {
    console.error("Erreur suppression Cloudinary", err);
  }
}

export async function deletePreview(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", type: "authenticated" });
  } catch (err) {
    console.error("Erreur suppression de la miniature Cloudinary", err);
  }
}

function getAssetFormat(originalName, resourceType) {
  if (resourceType === "raw") return originalName;
  const extension = String(originalName).split(".").pop();
  return extension && extension !== originalName ? extension : originalName;
}

export async function getSignedDownloadUrl(publicId, originalName, resourceType = "raw") {
  if (isR2Key(publicId)) {
    return getR2SignedUrl({ key: publicId, originalName, expiresIn: 300, download: true });
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const url = cloudinary.utils.private_download_url(publicId, getAssetFormat(originalName, resourceType), {
    resource_type: resourceType,
    type: "authenticated",
    attachment: true,
    expires_at: expiresAt
  });
  return url;
}

export async function getSignedViewUrl(publicId, originalName, resourceType = "raw") {
  if (isR2Key(publicId)) {
    return getR2SignedUrl({ key: publicId, originalName, expiresIn: 3600, download: false });
  }
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const url = cloudinary.utils.private_download_url(publicId, getAssetFormat(originalName, resourceType), {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: expiresAt
  });
  return url;
}

export function getPdfThumbnailUrl(publicId) {
  return getDocumentThumbnailUrl(publicId, "application/pdf");
}

export function getPreviewUrl(publicId, { expiresIn = 7200 } = {}) {
  if (!publicId) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  try {
    return cloudinary.url(publicId, {
      resource_type: "image",
      type: "authenticated",
      format: "jpg",
      width: 600,
      height: 800,
      crop: "fill",
      gravity: "north",
      quality: "auto",
      sign_url: true,
      secure: true,
      expires_at: expiresAt
    });
  } catch (err) {
    return null;
  }
}

export function getDocumentThumbnailUrl(publicId, mimeType, previewPublicId, expiresIn = 7200) {
  if (previewPublicId) return getPreviewUrl(previewPublicId, { expiresIn });
  if (!publicId || isR2Key(publicId)) return null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  try {
    const url = cloudinary.url(publicId, {
      resource_type: "image",
      type: "authenticated",
      format: "jpg",
      page: 1,
      width: 600,
      height: 800,
      crop: "fill",
      gravity: "north",
      quality: "auto",
      sign_url: true,
      secure: true,
      expires_at: expiresAt
    });
    return url;
  } catch (e) {
    try {
      const url = cloudinary.url(publicId, {
        resource_type: "raw",
        type: "authenticated",
        format: "jpg",
        page: 1,
        transformation: [
          { width: 600, height: 800, crop: "fill", gravity: "north" },
          { quality: "auto" }
        ],
        sign_url: true,
        secure: true,
        expires_at: expiresAt
      });
      return url;
    } catch (err) {
      try {
        const url = cloudinary.url(publicId, {
          resource_type: "raw",
          type: "authenticated",
          transformation: [
            { page: 1 },
            { width: 600, height: 800, crop: "fill", gravity: "north" },
            { quality: "auto", fetch_format: "jpg" }
          ],
          sign_url: true,
          secure: true,
          expires_at: expiresAt
        });
        return url;
      } catch (e2) {
        return null;
      }
    }
  }
}
