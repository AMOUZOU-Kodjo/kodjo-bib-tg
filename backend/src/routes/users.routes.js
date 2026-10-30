import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ensureFeatureSchema, query } from "../config/db.js";
import { authRequired, optionalAuth, requireVerified } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import { deletePreview, deleteRaw, getDocumentThumbnailUrl } from "../services/cloudinary.service.js";
import { config } from "../config/env.js";
import { notifyNewFollower } from "../services/notificationCenter.service.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.param("id", (req, res, next, id) => {
  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant invalide" } });
  }
  next();
});

function mapDocumentRow(row) {
  let thumbnail = null;
  try {
    thumbnail = getDocumentThumbnailUrl(row.cloudinary_public_id, row.mime_type, row.preview_public_id);
  } catch {
    thumbnail = null;
  }
  const { cloudinary_public_id, preview_public_id, ...doc } = row;
  return { ...doc, thumbnail };
}

router.get("/me/documents", authRequired, async (req, res, next) => {
  try {
    const resDocs = await query(
      `SELECT id, title, description, category, tags, visibility, share_enabled, original_filename, mime_type, cloudinary_public_id, preview_public_id, size_bytes,
              view_count, download_count, like_count, comment_count, created_at
       FROM documents
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    const documents = resDocs.rows.map((row) => {
      let thumbnail = null;
      try {
        thumbnail = getDocumentThumbnailUrl(row.cloudinary_public_id, row.mime_type, row.preview_public_id);
      } catch (e) {
        thumbnail = null;
      }
      const { cloudinary_public_id, preview_public_id, share_enabled, ...doc } = row;
      return { ...doc, thumbnail, shareEnabled: share_enabled };
    });
    res.json({ documents });
  } catch (err) {
    next(err);
  }
});

router.get("/me/favorites", authRequired, async (req, res, next) => {
  try {
    await ensureFeatureSchema();
    const page = Math.min(Math.max(1, Number(req.query.page) || 1), 10000);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 12), 50);
    const offset = (page - 1) * limit;
    const visibilityFilter = req.user.role === "admin" ? "" : "AND (d.visibility = 'public' OR d.owner_id = $1)";
    const params = [req.user.id];
    const countRes = await query(
      `SELECT COUNT(*)::int AS total
       FROM favorites f JOIN documents d ON d.id = f.document_id
       WHERE f.user_id = $1 ${visibilityFilter}`,
      params
    );
    const listRes = await query(
      `SELECT d.id, d.title, d.description, d.category, d.tags, d.visibility, d.original_filename, d.mime_type,
              d.cloudinary_public_id, d.preview_public_id, d.size_bytes, d.download_count, d.like_count,
              d.comment_count, d.created_at, u.display_name AS author_name, u.id AS owner_id
       FROM favorites f
       JOIN documents d ON d.id = f.document_id
       JOIN users u ON u.id = d.owner_id
       WHERE f.user_id = $1 ${visibilityFilter}
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [...params, limit, offset]
    );
    res.json({
      documents: listRes.rows.map(mapDocumentRow),
      total: countRes.rows[0].total,
      page,
      limit
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me/credits", authRequired, async (req, res, next) => {
  try {
    const userRes = await query("SELECT credits FROM users WHERE id = $1", [req.user.id]);
    const hist = await query(
      `SELECT ct.id, ct.delta, ct.reason, ct.document_id, ct.created_at, d.title AS document_title
       FROM credit_transactions ct
       LEFT JOIN documents d ON d.id = ct.document_id
       WHERE ct.user_id = $1
       ORDER BY ct.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ credits: userRes.rows[0]?.credits || 0, history: hist.rows });
  } catch (err) {
    next(err);
  }
});

router.delete("/me", authRequired, authLimiter, async (req, res, next) => {
  try {
    const password = String(req.body?.password || "");
    if (!password) {
      return res.status(400).json({ error: { code: "MISSING_PASSWORD", message: "Mot de passe requis pour supprimer le compte" } });
    }
    const userRes = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (userRes.rows.length === 0 || !(await bcrypt.compare(password, userRes.rows[0].password_hash))) {
      return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Mot de passe incorrect" } });
    }
    const docsRes = await query(
      "SELECT cloudinary_public_id, preview_public_id FROM documents WHERE owner_id = $1",
      [req.user.id]
    );
    await Promise.allSettled(
      docsRes.rows.flatMap((doc) => [deleteRaw(doc.cloudinary_public_id), deletePreview(doc.preview_public_id)])
    );
    await query("DELETE FROM users WHERE id = $1", [req.user.id]);
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: config.nodeEnv === "production" ? "none" : "lax",
      secure: config.nodeEnv === "production"
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.patch("/me", authRequired, async (req, res, next) => {
  try {
    const rawDisplayName = req.body.displayName ?? req.body.display_name;
    const displayName = typeof rawDisplayName === "string" ? rawDisplayName.replace(/\s+/g, " ").trim() : "";
    if (!displayName) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Nom affiché requis" } });
    if (displayName.length < 2 || displayName.length > 60) {
      return res.status(400).json({ error: { code: "INVALID_NAME", message: "Le nom doit contenir entre 2 et 60 caractères" } });
    }

    const up = await query(
      "UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name, email_verified, credits, role, token_version, notify_email, notify_new_documents, notify_document_updates",
      [displayName, req.user.id]
    );
    const user = up.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.display_name, emailVerified: user.email_verified, role: user.role, tokenVersion: user.token_version },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.cookie("token", token, { httpOnly: true, sameSite: config.nodeEnv === "production" ? "none" : "lax", secure: config.nodeEnv === "production" });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.patch("/me/preferences", authRequired, async (req, res, next) => {
  try {
    const fields = [
      ["notify_email", "notifyEmail"],
      ["notify_new_documents", "notifyNewDocuments"],
      ["notify_document_updates", "notifyDocumentUpdates"]
    ];
    const updates = [];
    const values = [];
    for (const [column, key] of fields) {
      if (req.body[key] === undefined) continue;
      if (typeof req.body[key] !== "boolean") {
        return res.status(400).json({ error: { code: "INVALID_PREFERENCES", message: "Les préférences doivent être des booléens" } });
      }
      values.push(req.body[key]);
      updates.push(`${column} = $${values.length}`);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Aucune préférence à mettre à jour" } });
    }
    values.push(req.user.id);
    const up = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${values.length}
       RETURNING id, email, display_name, email_verified, credits, role,
                 notify_email, notify_new_documents, notify_document_updates`,
      values
    );
    res.json({ user: up.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/public", optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant auteur invalide" } });
    }
    await ensureFeatureSchema();
    const userRes = await query(
      "SELECT id, display_name, created_at FROM users WHERE id = $1",
      [req.params.id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Auteur introuvable" } });
    }
    const [docsRes, followersRes, followingRes] = await Promise.all([
      query("SELECT COUNT(*)::int AS total FROM documents WHERE owner_id = $1 AND visibility = 'public'", [req.params.id]),
      query("SELECT COUNT(*)::int AS total FROM follows WHERE author_id = $1", [req.params.id]),
      req.user
        ? query("SELECT 1 FROM follows WHERE follower_id = $1 AND author_id = $2", [req.user.id, req.params.id])
        : Promise.resolve({ rows: [] })
    ]);
    res.json({
      author: {
        ...userRes.rows[0],
        document_count: docsRes.rows[0].total,
        follower_count: followersRes.rows[0].total,
        is_following: followingRes.rows.length > 0,
        is_self: Boolean(req.user && String(req.user.id) === String(req.params.id))
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/documents", optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant auteur invalide" } });
    }
    await ensureFeatureSchema();
    const page = Math.min(Math.max(1, Number(req.query.page) || 1), 10000);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 12), 50);
    const offset = (page - 1) * limit;
    const countRes = await query(
      "SELECT COUNT(*)::int AS total FROM documents WHERE owner_id = $1 AND visibility = 'public'",
      [req.params.id]
    );
    const listRes = await query(
      `SELECT d.id, d.title, d.description, d.category, d.tags, d.visibility, d.original_filename, d.mime_type,
              d.cloudinary_public_id, d.preview_public_id, d.size_bytes, d.download_count, d.like_count,
              d.comment_count, d.created_at, u.display_name AS author_name, u.id AS owner_id
       FROM documents d JOIN users u ON u.id = d.owner_id
       WHERE d.owner_id = $1 AND d.visibility = 'public'
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json({
      documents: listRes.rows.map(mapDocumentRow),
      total: countRes.rows[0].total,
      page,
      limit
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/follow", authRequired, requireVerified, async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant auteur invalide" } });
    }
    if (String(req.user.id) === String(req.params.id)) {
      return res.status(400).json({ error: { code: "CANNOT_FOLLOW_SELF", message: "Vous ne pouvez pas vous suivre vous-même" } });
    }
    await ensureFeatureSchema();
    const authorRes = await query("SELECT id FROM users WHERE id = $1", [req.params.id]);
    if (authorRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Auteur introuvable" } });
    }
    const existing = await query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND author_id = $2",
      [req.user.id, req.params.id]
    );
    if (existing.rows.length > 0) {
      await query("DELETE FROM follows WHERE follower_id = $1 AND author_id = $2", [req.user.id, req.params.id]);
    } else {
      await query("INSERT INTO follows (follower_id, author_id) VALUES ($1,$2)", [req.user.id, req.params.id]);
      notifyNewFollower({ authorId: req.params.id, followerId: req.user.id }).catch((err) => {
        console.error("Échec de la notification d'abonnement:", err.message);
      });
    }
    const countRes = await query("SELECT COUNT(*)::int AS total FROM follows WHERE author_id = $1", [req.params.id]);
    res.json({ following: existing.rows.length === 0, follower_count: countRes.rows[0].total });
  } catch (err) {
    next(err);
  }
});

export default router;
