import express from "express";
import { query } from "../config/db.js";
import { getDocumentThumbnailUrl, getSignedDownloadUrl } from "../services/cloudinary.service.js";
import { streamDocumentFile } from "../services/documentStream.service.js";
import { verifyDocumentShareToken } from "../services/share.service.js";
import { config } from "../config/env.js";

const router = express.Router();

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

async function loadSharedDocument(token) {
  let payload;
  try {
    payload = verifyDocumentShareToken(token);
  } catch {
    return null;
  }
  const docRes = await query(
    `SELECT d.*, u.display_name AS author_name
     FROM documents d
     JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1`,
    [payload.documentId]
  );
  const doc = docRes.rows[0];
  if (!doc) return null;
  if (doc.visibility !== "private") return null;
  if (!doc.share_enabled) return null;
  if (doc.share_version !== payload.shareVersion) return null;
  return doc;
}

function serializeSharedDocument(doc) {
  let thumbnail = null;
  try {
    thumbnail = getDocumentThumbnailUrl(doc.cloudinary_public_id, doc.mime_type, doc.preview_public_id, 3600);
  } catch {
    thumbnail = null;
  }
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    author_name: doc.author_name,
    original_filename: doc.original_filename,
    mime_type: doc.mime_type,
    size_bytes: doc.size_bytes,
    created_at: doc.created_at,
    view_count: doc.view_count,
    download_count: doc.download_count,
    thumbnail
  };
}

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

router.get("/:token", async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) {
      const accept = req.headers.accept || "";
      if (accept.includes("application/json")) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" } });
      }
      const frontendUrl = config.frontendUrl || "https://kodjo-bib-tg.pages.dev";
      return res.status(404).send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lien de partage invalide</title><meta http-equiv="refresh" content="0;url=${frontendUrl}/"></head><body></body></html>`);
    }
    const accept = req.headers.accept || "";
    if (accept.includes("application/json")) {
      return res.json({ document: serializeSharedDocument(doc) });
    }

    const frontendUrl = config.frontendUrl || "https://kodjo-bib-tg.pages.dev";
    const shareUrl = `${frontendUrl}/shared/${req.params.token}`;
    const title = escapeHtml(doc.title || "Document partagé");
    const author = escapeHtml(doc.author_name || "Auteur inconnu");
    const description = doc.description
      ? escapeHtml(doc.description).slice(0, 200)
      : `Document partagé par ${author} sur ${frontendUrl.replace(/^https?:\/\//, "")}`;
    let image = "";
    try {
      const thumb = getDocumentThumbnailUrl(doc.cloudinary_public_id, doc.mime_type, doc.preview_public_id, 1200);
      if (thumb) image = escapeHtml(thumb);
    } catch {
      image = "";
    }

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Document partagé</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Archives de Documents">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  ${image ? `<meta property="og:image" content="${image}">` : ""}
  <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${image ? `<meta name="twitter:image" content="${image}">` : ""}
  <meta name="author" content="${author}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(shareUrl)}">
  <script>window.location.replace(${JSON.stringify(shareUrl)});</script>
</head>
<body></body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
});

router.get("/:token/file", async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" } });
    await streamDocumentFile(doc, req, res, { cacheControl: "no-store" });
  } catch (err) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    next(err);
  }
});

router.get("/:token/download", async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" } });
    await query("UPDATE documents SET download_count = download_count + 1 WHERE id = $1", [doc.id]);
    const url = getSignedDownloadUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
