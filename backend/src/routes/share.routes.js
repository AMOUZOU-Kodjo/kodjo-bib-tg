import express from "express";
import { query } from "../config/db.js";
import { getDocumentThumbnailUrl, getSignedDownloadUrl } from "../services/cloudinary.service.js";
import { streamDocumentFile } from "../services/documentStream.service.js";
import { createDocumentShareToken, verifyDocumentShareToken } from "../services/share.service.js";
import { getArticle } from "../services/news.service.js";
import { getUserArticle } from "../services/userArticles.service.js";
import { authRequired } from "../middlewares/auth.js";
import { config } from "../config/env.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

router.get("/news", async (req, res, next) => {
  try {
    const id = String(req.query.id || "").trim();
    const url = String(req.query.url || "").trim();
    let article = null;
    let pageUrl = `${frontendBaseUrl()}/actualites`;
    if (id) {
      article = await getUserArticle(id);
      pageUrl = `${frontendBaseUrl()}/actualites/article-utilisateur?id=${encodeURIComponent(id)}`;
    } else if (url) {
      article = await getArticle(url);
      pageUrl = `${frontendBaseUrl()}/actualites/article?url=${encodeURIComponent(url)}`;
    }
    if (!article) return res.redirect(302, pageUrl);

    const title = escapeHtml(article.title || "Actualité");
    const description = escapeHtml(article.description || "").slice(0, 200);
    const image = article.image || `${frontendBaseUrl()}/og-image.png`;
    const backendOrigin = backendBaseUrl(req);
    const shareUrl = `${backendOrigin}/share/news?${id ? `id=${encodeURIComponent(id)}` : `url=${encodeURIComponent(url)}`}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Archivia">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
  <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
</head>
<body></body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    next(err);
  }
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
  if (doc.visibility === "private") {
    if (!doc.share_enabled) return null;
    if (doc.share_version !== payload.shareVersion) return null;
    return doc;
  }
  if (doc.visibility === "public") {
    return doc;
  }
  return null;
}

async function loadPublicDocument(id) {
  if (!UUID_RE.test(id)) return null;
  const docRes = await query(
    `SELECT d.*, u.display_name AS author_name
     FROM documents d
     JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1 AND d.visibility = 'public'`,
    [id]
  );
  return docRes.rows[0] || null;
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
    visibility: doc.visibility,
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

function frontendBaseUrl() {
  return String(config.frontendUrl || "https://archivia.pages.dev").replace(/\/+$/, "");
}

function backendBaseUrl(req) {
  const configured = process.env.BACKEND_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  return String(configured || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
}

function isSocialCrawler(req) {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  return [
    "facebookexternalhit", "facebot", "twitterbot", "linkedinbot",
    "whatsapp", "telegrambot", "slackbot", "discordbot", "pinterest",
    "embedly", "quora link preview", "outbrain", "vkshare", "w3c_validator"
  ].some((bot) => ua.includes(bot));
}

function buildShareHtml(doc, { shareUrl, ogImageUrl, pageUrl, redirect = true }) {
  const title = escapeHtml(doc.title || "Document partagé");
  const author = escapeHtml(doc.author_name || "Auteur inconnu");
  const description = doc.description
    ? escapeHtml(doc.description).slice(0, 200)
    : `Document partagé par ${author} sur Archives de Documents`;
  const mimeType = String(doc.mime_type || "").toLowerCase();
  const hasThumbnail = Boolean(doc.preview_public_id) || mimeType === "application/pdf" || mimeType.startsWith("image/");
  const imageUrl = hasThumbnail ? ogImageUrl : `${frontendBaseUrl()}/og-image.png`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Document partagé</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Archives de Documents">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(pageUrl || shareUrl)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="800">
  <meta property="og:image:alt" content="${title} - Document partagé par ${author}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${title} - Document partagé par ${author}">
  <meta name="author" content="${author}">
  <link rel="canonical" href="${escapeHtml(pageUrl || shareUrl)}">
  ${redirect ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(shareUrl)}">
  <script>window.location.replace(${JSON.stringify(shareUrl)});</script>` : ""}
</head>
<body></body>
</html>`;
}

async function sendOgImage(doc, res) {
  let thumbUrl = null;
  try {
    thumbUrl = getDocumentThumbnailUrl(doc.cloudinary_public_id, doc.mime_type, doc.preview_public_id, 7200);
  } catch {
    thumbUrl = null;
  }
  if (!thumbUrl) return res.status(404).end();

  const response = await fetch(thumbUrl);
  if (!response.ok) return res.status(404).end();

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", buffer.length);
  res.setHeader(
    "Cache-Control",
    doc.visibility === "public"
      ? "public, max-age=86400, s-maxage=86400"
      : "no-store, max-age=0"
  );
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.send(buffer);
}

function sendNotFound(req, res) {
  const accept = req.headers.accept || "";
  if (accept.includes("application/json")) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" } });
  }
  const frontendUrl = frontendBaseUrl();
  return res
    .status(404)
    .send(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lien de partage invalide</title><meta http-equiv="refresh" content="0;url=${frontendUrl}/"></head><body></body></html>`);
}

router.get("/public/:id/og-image", async (req, res, next) => {
  try {
    const doc = await loadPublicDocument(req.params.id);
    if (!doc) return res.status(404).end();
    await sendOgImage(doc, res);
  } catch (err) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    next(err);
  }
});

router.get("/public/:id", async (req, res, next) => {
  try {
    const doc = await loadPublicDocument(req.params.id);
    if (!doc) return sendNotFound(req, res);

    const accept = req.headers.accept || "";
    if (accept.includes("application/json")) {
      return res.json({ document: serializeSharedDocument(doc) });
    }

    const frontendUrl = frontendBaseUrl();
    const token = createDocumentShareToken(doc.id, doc.share_version);
    const shareUrl = `${frontendUrl}/share/${token}`;
    const backendOrigin = backendBaseUrl(req);
    const pageUrl = `${backendOrigin}/share/public/${doc.id}`;
    const ogImageUrl = `${backendOrigin}/share/public/${doc.id}/og-image`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildShareHtml(doc, { shareUrl, ogImageUrl, pageUrl, redirect: !isSocialCrawler(req) }));
  } catch (err) {
    next(err);
  }
});

router.get("/:token/og-image", async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) return res.status(404).end();
    await sendOgImage(doc, res);
  } catch (err) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    next(err);
  }
});

router.get("/:token", async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) return sendNotFound(req, res);

    const accept = req.headers.accept || "";
    if (accept.includes("application/json")) {
      return res.json({ document: serializeSharedDocument(doc) });
    }

    const frontendUrl = frontendBaseUrl();
    const shareUrl = `${frontendUrl}/share/${req.params.token}`;
    const backendOrigin = backendBaseUrl(req);
    const pageUrl = `${backendOrigin}/share/${req.params.token}`;
    const ogImageUrl = `${backendOrigin}/share/${req.params.token}/og-image`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildShareHtml(doc, { shareUrl, ogImageUrl, pageUrl, redirect: !isSocialCrawler(req) }));
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

router.get("/:token/download", authRequired, async (req, res, next) => {
  try {
    const doc = await loadSharedDocument(req.params.token);
    if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Lien de partage invalide ou expiré" } });
    await query("UPDATE documents SET download_count = download_count + 1 WHERE id = $1", [doc.id]);
    const url = await getSignedDownloadUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});



export default router;
