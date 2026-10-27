import cloudinary from "../config/cloudinary.js";

export function uploadRaw(fileBuffer, originalName) {
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

export async function deleteRaw(publicId) {
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

export function getSignedDownloadUrl(publicId, originalName, resourceType = "raw") {
  const expiresAt = Math.floor(Date.now() / 1000) + 300;
  const url = cloudinary.utils.private_download_url(publicId, getAssetFormat(originalName, resourceType), {
    resource_type: resourceType,
    type: "authenticated",
    attachment: true,
    expires_at: expiresAt
  });
  return url;
}

export function getSignedViewUrl(publicId, originalName, resourceType = "raw") {
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
  if (!publicId) return null;
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
