import express from "express";
import crypto from "crypto";
import { pool, query } from "../config/db.js";
import { authRequired, optionalAuth, requireVerified } from "../middlewares/auth.js";
import { uploadSingle } from "../middlewares/upload.js";
import { uploadLimiter, globalLimiter } from "../middlewares/rateLimit.js";
import { uploadRaw, uploadPreview, deleteRaw, deletePreview, getSignedDownloadUrl, getSignedViewUrl, getDocumentThumbnailUrl } from "../services/cloudinary.service.js";
import { addCreditsOnUpload } from "../services/credits.service.js";
import { sendEmail } from "../services/email.service.js";
import { buildContactEmail } from "../services/emailTemplates.js";
import { optimizeDocumentBuffer } from "../services/optimize.service.js";
import { notifyDocumentUpload } from "../services/notifications.service.js";
import { streamDocumentFile } from "../services/documentStream.service.js";
import { createDocumentShareToken, getDocumentShareUrl } from "../services/share.service.js";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";
import { suggestCategory } from "../services/categoryClassifier.js";

const router = express.Router();

function getViewerKey(req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  return crypto.createHash("sha256").update(ip.trim()).digest("hex");
}

function canGeneratePreview(mimeType = "", filename = "") {
  const extension = String(filename).toLowerCase().split(".").pop();
  if (mimeType === "application/pdf" || extension === "pdf") return true;
  return mimeType.startsWith("image/") && mimeType !== "image/svg+xml";
}

function canAccessDocument(doc, user) {
  if (doc.visibility === "public") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return String(user.id) === String(doc.owner_id);
}

function isDocumentOwner(doc, user) {
  return Boolean(user && String(user.id) === String(doc.owner_id));
}

router.get("/meta/categories", globalLimiter, async (req, res, next) => {
  try {
    const [categoriesRes, totalRes] = await Promise.all([
      query(
        `SELECT category, COUNT(*)::int as count
         FROM documents
         WHERE visibility = 'public' AND category IS NOT NULL AND category <> ''
         GROUP BY category
         ORDER BY count DESC, category ASC`
      ),
      query("SELECT COUNT(*)::int as total FROM documents WHERE visibility = 'public'")
    ]);
    res.json({ categories: categoriesRes.rows, total: totalRes.rows[0].total });
  } catch (err) {
    next(err);
  }
});

router.post("/suggest-category", authRequired, requireVerified, globalLimiter, async (req, res, next) => {
  try {
    const filename = req.body?.filename || req.body?.originalFilename || "";
    if (!filename) {
      return res.json({ suggestedCategory: null });
    }
    const suggestedCategory = suggestCategory(filename);
    res.json({ suggestedCategory });
  } catch (err) {
    next(err);
  }
});

router.get("/", globalLimiter, optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    const { q, category, sort = "recent", page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 12);
    const offset = (pageNum - 1) * limitNum;
    let where = ["d.visibility = 'public'"];
    let params = [];
    let idx = 1;
    if (q) {
      where.push(`(d.title ILIKE $${idx} OR d.description ILIKE $${idx} OR u.display_name ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (category) {
      where.push(`d.category = $${idx++}`);
      params.push(category);
    }
    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
    let order = "d.created_at DESC";
    if (sort === "likes") order = "d.like_count DESC, d.created_at DESC";
    if (sort === "views") order = "d.view_count DESC, d.created_at DESC";
    if (sort === "downloads") order = "d.download_count DESC, d.created_at DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM documents d JOIN users u ON u.id = d.owner_id ${whereSql}`;
    let listIndex = idx;
    const likedSelect = req.user
      ? `, EXISTS (SELECT 1 FROM likes l WHERE l.user_id = $${listIndex++} AND l.document_id = d.id) AS liked_by_me`
      : "";
    const listParams = [...params];
    if (req.user) listParams.push(req.user.id);
    const limitIndex = listIndex++;
    const offsetIndex = listIndex;
    listParams.push(limitNum, offset);

    const sql = `SELECT d.id, d.title, d.description, d.category, d.visibility, d.original_filename, d.mime_type, d.cloudinary_public_id, d.preview_public_id, d.size_bytes, d.view_count, d.download_count, d.like_count, d.comment_count, d.created_at, u.display_name as author_name, u.id as owner_id${likedSelect}
      FROM documents d JOIN users u ON u.id = d.owner_id
      ${whereSql}
      ORDER BY ${order}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}`;

    const [countRes, resDocs] = await Promise.all([
      query(countSql, params),
      query(sql, listParams)
    ]);
    const total = countRes.rows[0].total;
    const rows = resDocs.rows.map((r) => {
      let thumbnail = null;
      try {
        thumbnail = getDocumentThumbnailUrl(r.cloudinary_public_id, r.mime_type, r.preview_public_id);
      } catch (e) {
        thumbnail = null;
      }
      const { liked_by_me, ...doc } = r;
      return {
        ...doc,
        likedByMe: !!liked_by_me,
        isOwner: req.user?.id === r.owner_id,
        thumbnail,
        cloudinary_public_id: undefined,
        preview_public_id: undefined
      };
    });
    res.json({ documents: rows, total, page: pageNum, limit: limitNum });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", globalLimiter, optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    const [docRes, likedRes] = await Promise.all([
      query(
        `SELECT d.*, u.display_name as author_name, u.id as owner_id FROM documents d JOIN users u ON u.id = d.owner_id WHERE d.id = $1`,
        [req.params.id]
      ),
      req.user
        ? query("SELECT 1 FROM likes WHERE user_id = $1 AND document_id = $2", [req.user.id, req.params.id])
        : Promise.resolve({ rows: [] })
    ]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const d = docRes.rows[0];
    if (!canAccessDocument(d, req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const likedByMe = likedRes.rows.length > 0;
    const isOwner = isDocumentOwner(d, req.user);
    let thumbnail = null;
    try {
      thumbnail = getDocumentThumbnailUrl(d.cloudinary_public_id, d.mime_type, d.preview_public_id);
    } catch (e) {
      thumbnail = null;
    }
    const { cloudinary_public_id, preview_public_id, share_version, share_enabled, ...docClean } = d;
    res.json({
      document: {
        ...docClean,
        likedByMe,
        isOwner,
        thumbnail,
        shareEnabled: isOwner ? share_enabled : undefined
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", authRequired, requireVerified, uploadLimiter, uploadSingle("file"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: { code: "NO_FILE", message: "Fichier requis" } });
  const { title, description, category, visibility = "public" } = req.body;
  if (!title) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Titre requis" } });
  if (!["public", "private"].includes(visibility)) {
    return res.status(400).json({ error: { code: "INVALID_VISIBILITY", message: "Visibilité invalide" } });
  }

  let client;
  let uploaded;
  let preview;
  let committed = false;
  try {
    const optimizedFile = await optimizeDocumentBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
    uploaded = await uploadRaw(optimizedFile.buffer, req.file.originalname);
    if (canGeneratePreview(req.file.mimetype, req.file.originalname)) {
      try {
        preview = await uploadPreview(optimizedFile.buffer);
      } catch (err) {
        console.error("Impossible de générer la miniature Cloudinary:", err.message);
      }
    }
    client = await pool.connect();
    await client.query("BEGIN");
    const docRes = await client.query(
      `INSERT INTO documents (owner_id, title, description, category, original_filename, mime_type, size_bytes, cloudinary_public_id, cloudinary_resource_type, preview_public_id, visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'raw',$9,$10) RETURNING *`,
      [req.user.id, title, description || null, category || null, req.file.originalname, req.file.mimetype, optimizedFile.finalSize, uploaded.public_id, preview?.public_id || null, visibility]
    );
    const doc = docRes.rows[0];
    await addCreditsOnUpload(client, req.user.id, doc.id);
    await client.query("COMMIT");
    committed = true;
    if (visibility === "public") {
      notifyDocumentUpload({ documentId: doc.id }).catch((err) => {
        console.error("Échec de l'envoi des notifications d'upload:", err.message);
      });
    }
    res.json({
      ok: true,
      document: doc,
      compression: {
        optimized: optimizedFile.optimized,
        originalSize: optimizedFile.originalSize,
        finalSize: optimizedFile.finalSize
      }
    });
  } catch (err) {
    if (client && !committed) {
      await client.query("ROLLBACK").catch(() => {});
    }
    if (uploaded && !committed) {
      await deleteRaw(uploaded.public_id);
    }
    if (preview && !committed) {
      await deletePreview(preview.public_id);
    }
    next(err);
  } finally {
    if (client) client.release();
  }
});

router.patch("/:id", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query("SELECT owner_id FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    if (docRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    const { title, description, category, visibility } = req.body;
    const nextVisibility = visibility ?? null;
    if (nextVisibility !== null && !["public", "private"].includes(nextVisibility)) {
      return res.status(400).json({ error: { code: "INVALID_VISIBILITY", message: "Visibilité invalide" } });
    }
    const up = await query(
      `UPDATE documents
       SET title = COALESCE($1,title),
           description = COALESCE($2,description),
           category = COALESCE($3,category),
           visibility = COALESCE($4,visibility),
           share_enabled = CASE WHEN $4 IS NOT NULL AND $4 <> visibility THEN false ELSE share_enabled END,
           share_version = CASE WHEN $4 IS NOT NULL AND $4 <> visibility THEN share_version + 1 ELSE share_version END
       WHERE id = $5
       RETURNING id, title, description, category, visibility, share_enabled, original_filename, mime_type, size_bytes, created_at`,
      [title, description, category, nextVisibility, req.params.id]
    );
    res.json({ document: up.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/share", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query(
      "SELECT id, owner_id, visibility, share_enabled, share_version FROM documents WHERE id = $1",
      [req.params.id]
    );
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    }
    if (doc.visibility !== "private" || !doc.share_enabled) {
      return res.json({ enabled: false, visibility: doc.visibility });
    }
    const token = createDocumentShareToken(doc.id, doc.share_version);
    res.json({ enabled: true, url: getDocumentShareUrl(token) });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/share", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query(
      "SELECT id, owner_id, visibility, share_version FROM documents WHERE id = $1",
      [req.params.id]
    );
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (doc.owner_id !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    }
    if (doc.visibility !== "private") {
      return res.status(400).json({ error: { code: "NOT_PRIVATE", message: "Le document doit être privé pour générer un lien" } });
    }
    const rotate = req.body?.rotate === true;
    const up = await query(
      `UPDATE documents
       SET share_enabled = true,
           share_version = CASE WHEN $1 THEN share_version + 1 ELSE share_version END
       WHERE id = $2
       RETURNING share_version`,
      [rotate, doc.id]
    );
    const token = createDocumentShareToken(doc.id, up.rows[0].share_version);
    res.json({ enabled: true, url: getDocumentShareUrl(token) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/share", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query("SELECT id, owner_id FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    if (docRes.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    }
    await query(
      "UPDATE documents SET share_enabled = false, share_version = share_version + 1 WHERE id = $1",
      [docRes.rows[0].id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query("SELECT owner_id, cloudinary_public_id, preview_public_id FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    if (docRes.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    await deleteRaw(docRes.rows[0].cloudinary_public_id);
    await deletePreview(docRes.rows[0].preview_public_id);
    await query("DELETE FROM documents WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/view", optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    const docRes = await query("SELECT owner_id, visibility FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0 || !canAccessDocument(docRes.rows[0], req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const viewerKey = req.user ? req.user.id : getViewerKey(req);
    const last = await query("SELECT viewed_at FROM views WHERE document_id = $1 AND viewer_key = $2 ORDER BY viewed_at DESC LIMIT 1", [req.params.id, viewerKey]);
    if (last.rows.length > 0) {
      const diff = (Date.now() - new Date(last.rows[0].viewed_at).getTime()) / 1000 / 3600;
      if (diff < 24) return res.json({ ok: true, counted: false });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO views (document_id, viewer_key) VALUES ($1,$2)", [req.params.id, viewerKey]);
      await client.query("UPDATE documents SET view_count = view_count + 1 WHERE id = $1", [req.params.id]);
      await client.query("COMMIT");
      res.json({ ok: true, counted: true });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.post("/:id/like", authRequired, requireVerified, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const docRes = await client.query("SELECT owner_id, visibility FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0 || !canAccessDocument(docRes.rows[0], req.user)) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const exists = await client.query("SELECT 1 FROM likes WHERE user_id = $1 AND document_id = $2", [req.user.id, req.params.id]);
    if (exists.rows.length > 0) {
      await client.query("DELETE FROM likes WHERE user_id = $1 AND document_id = $2", [req.user.id, req.params.id]);
      await client.query("UPDATE documents SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1", [req.params.id]);
      await client.query("COMMIT");
      return res.json({ liked: false });
    }
    await client.query("INSERT INTO likes (user_id, document_id) VALUES ($1,$2)", [req.user.id, req.params.id]);
    await client.query("UPDATE documents SET like_count = like_count + 1 WHERE id = $1", [req.params.id]);
    await client.query("COMMIT");
    res.json({ liked: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.post("/:id/download", authRequired, requireVerified, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userRes = await client.query("SELECT id, credits FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    const docRes = await client.query("SELECT id, owner_id, visibility, cloudinary_public_id, cloudinary_resource_type, original_filename FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (!canAccessDocument(doc, req.user)) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    if (doc.owner_id === req.user.id || req.user.role === "admin") {
      const url = getSignedDownloadUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
      await client.query("COMMIT");
      return res.json({ url });
    }
    const already = await client.query("SELECT 1 FROM downloads WHERE user_id = $1 AND document_id = $2", [req.user.id, req.params.id]);
    if (already.rows.length > 0) {
      const url = getSignedDownloadUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
      await client.query("COMMIT");
      return res.json({ url });
    }
    if (userRes.rows[0].credits < 1) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: { code: "INSUFFICIENT_CREDITS", message: "Crédits insuffisants. Déposez un document pour en obtenir." } });
    }
    await client.query("UPDATE users SET credits = credits - 1 WHERE id = $1", [req.user.id]);
    await client.query("INSERT INTO credit_transactions (user_id, delta, reason, document_id) VALUES ($1,-1,'download',$2)", [req.user.id, req.params.id]);
    await client.query("INSERT INTO downloads (user_id, document_id) VALUES ($1,$2)", [req.user.id, req.params.id]);
    await client.query("UPDATE documents SET download_count = download_count + 1 WHERE id = $1", [req.params.id]);
    await client.query("COMMIT");
    const url = getSignedDownloadUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
    res.json({ url });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

router.get("/:id/preview", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query("SELECT id, owner_id, visibility, cloudinary_public_id, cloudinary_resource_type, original_filename, mime_type FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (!canAccessDocument(doc, req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const url = getSignedViewUrl(doc.cloudinary_public_id, doc.original_filename, doc.cloudinary_resource_type);
    res.json({ url, mimeType: doc.mime_type, fileName: doc.original_filename });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/view-file", authRequired, requireVerified, async (req, res, next) => {
  try {
    const docRes = await query("SELECT id, owner_id, visibility, cloudinary_public_id, cloudinary_resource_type, original_filename, mime_type FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (!canAccessDocument(doc, req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    await streamDocumentFile(doc, req, res);
  } catch (err) {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    next(err);
  }
});

router.post("/:id/contact", authRequired, requireVerified, async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    if (String(subject).length > 150 || String(message).length > 3000) {
      return res.status(400).json({ error: { code: "TOO_LONG", message: "Contenu trop long" } });
    }
    const docRes = await query("SELECT id, owner_id, visibility, title FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    const doc = docRes.rows[0];
    if (!canAccessDocument(doc, req.user)) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    if (doc.owner_id === req.user.id) return res.status(400).json({ error: { code: "FORBIDDEN", message: "Impossible de contacter votre propre document" } });
    const ownerRes = await query("SELECT email, display_name FROM users WHERE id = $1", [doc.owner_id]);
    const fromRes = await query("SELECT email, display_name FROM users WHERE id = $1", [req.user.id]);

    const from = fromRes.rows[0];
    const owner = ownerRes.rows[0];
    const safeSubject = String(subject).replace(/[\r\n]+/g, " ").trim();
    const settings = await getSettings();
    const { html, text } = buildContactEmail({
      intro: `Vous avez reçu un nouveau message concernant votre document « ${doc.title} ».`,
      fromName: from.display_name,
      fromEmail: from.email,
      subject: safeSubject,
      message,
      documentTitle: doc.title,
      documentUrl: `${config.frontendUrl}/documents/${doc.id}`,
      recipientName: owner.display_name,
      contextLabel: "Nouveau message sur un document",
      siteName: settings.siteName
    });

    try {
      await sendEmail({
        to: owner.email,
        toName: owner.display_name,
        subject: `[${settings.siteName}] Message concernant : ${doc.title.replace(/[\r\n]+/g, " ")}`,
        html,
        text,
        replyTo: { email: from.email, name: from.display_name }
      });
    } catch (err) {
      console.error("Contact author email failed:", err.message);
      return res.status(502).json({
        error: { code: "EMAIL_SEND_FAILED", message: "L'envoi du message a échoué. Réessayez plus tard." }
      });
    }
    await query("INSERT INTO contact_messages (from_user_id, to_user_id, document_id, subject) VALUES ($1,$2,$3,$4)", [req.user.id, doc.owner_id, req.params.id, safeSubject]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
