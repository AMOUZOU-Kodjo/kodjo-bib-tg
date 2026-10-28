import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { getSettings, saveSettings } from "../services/settings.service.js";
import { deleteRaw, deletePreview, getDocumentThumbnailUrl } from "../services/cloudinary.service.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.use(authRequired, requireAdmin);

// Site settings
router.get("/settings", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const siteName = String(req.body.siteName ?? "").replace(/[\r\n\t]+/g, " ").trim();
    const contactEmail = String(req.body.contactEmail ?? "").trim();
    const creditsInitiaux = Number(req.body.creditsInitiaux);
    const creditsParUpload = Number(req.body.creditsParUpload);
    const maxUploadSizeMb = Number(req.body.maxUploadSizeMb);

    if (siteName.length < 1 || siteName.length > 60) {
      return res.status(400).json({ error: { code: "INVALID_SITE_NAME", message: "Le nom du site doit contenir entre 1 et 60 caractères" } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Adresse e-mail de contact invalide" } });
    }
    if (!Number.isInteger(creditsInitiaux) || creditsInitiaux < 0 || creditsInitiaux > 1000) {
      return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits initiaux doivent être un entier entre 0 et 1000" } });
    }
    if (!Number.isInteger(creditsParUpload) || creditsParUpload < 0 || creditsParUpload > 1000) {
      return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits par dépôt doivent être un entier entre 0 et 1000" } });
    }
    if (!Number.isInteger(maxUploadSizeMb) || maxUploadSizeMb < 1 || maxUploadSizeMb > 100) {
      return res.status(400).json({ error: { code: "INVALID_MAX_FILE_SIZE", message: "La taille maximale doit être un entier entre 1 et 100 Mo" } });
    }

    const settings = await saveSettings({ siteName, contactEmail, creditsInitiaux, creditsParUpload, maxUploadSizeMb });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// Dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const usersCount = await query("SELECT COUNT(*) FROM users");
    const docsCount = await query("SELECT COUNT(*) FROM documents");
    const downloadsCount = await query("SELECT SUM(download_count) as total FROM documents");
    const commentsCount = await query("SELECT COUNT(*) FROM comments");
    res.json({
      stats: {
        users: parseInt(usersCount.rows[0].count),
        documents: parseInt(docsCount.rows[0].count),
        downloads: parseInt(downloadsCount.rows[0].total) || 0,
        comments: parseInt(commentsCount.rows[0].count)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await query(
      "SELECT id, email, display_name, email_verified, credits, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: users.rows });
  } catch (err) {
    next(err);
  }
});

// Update user role, credits or verification status
router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant utilisateur invalide" } });
    }
    const { role, credits, email_verified } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: { code: "INVALID_ROLE", message: "Rôle invalide" } });
      }
      if (req.params.id.toLowerCase() === String(req.user.id).toLowerCase() && role !== "admin") {
        return res.status(400).json({ error: { code: "SELF_DEMOTE", message: "Vous ne pouvez pas retirer votre propre rôle administrateur" } });
      }
      updates.push(`role = $${idx++}`);
      params.push(role);
      updates.push("token_version = token_version + 1");
    }

    if (credits !== undefined) {
      if (!Number.isInteger(credits) || credits < 0 || credits > 1000000) {
        return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits doivent être un entier positif" } });
      }
      updates.push(`credits = $${idx++}`);
      params.push(credits);
    }

    if (email_verified !== undefined) {
      if (typeof email_verified !== "boolean") {
        return res.status(400).json({ error: { code: "INVALID_VERIFICATION", message: "Statut de vérification invalide" } });
      }
      updates.push(`email_verified = $${idx++}`);
      params.push(email_verified);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { code: "NO_CHANGES", message: "Aucune modification fournie" } });
    }

    params.push(req.params.id);
    const result = await query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}
       RETURNING id, email, display_name, email_verified, role, credits, created_at`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Delete a user and their documents
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant utilisateur invalide" } });
    }
    if (req.params.id.toLowerCase() === String(req.user.id).toLowerCase()) {
      return res.status(400).json({ error: { code: "SELF_DELETE", message: "Vous ne pouvez pas supprimer votre propre compte" } });
    }
    const userRes = await query("SELECT id, display_name FROM users WHERE id = $1", [req.params.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } });
    }
    const docsRes = await query("SELECT cloudinary_public_id, preview_public_id FROM documents WHERE owner_id = $1", [req.params.id]);
    await Promise.allSettled(
      docsRes.rows.flatMap((doc) => [deleteRaw(doc.cloudinary_public_id), deletePreview(doc.preview_public_id)])
    );
    await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Get all documents
router.get("/documents", async (req, res, next) => {
  try {
    const docs = await query(`
      SELECT d.id, d.title, d.description, d.category, d.visibility, d.original_filename, d.mime_type,
             d.size_bytes, d.view_count, d.download_count, d.like_count, d.comment_count,
             d.created_at, d.cloudinary_public_id, d.preview_public_id,
             u.display_name as author_name, u.id as owner_id
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      ORDER BY d.created_at DESC
    `);
    const rows = docs.rows.map((row) => {
      let thumbnail = null;
      try {
        thumbnail = getDocumentThumbnailUrl(row.cloudinary_public_id, row.mime_type, row.preview_public_id);
      } catch {
        thumbnail = null;
      }
      const { cloudinary_public_id, preview_public_id, ...doc } = row;
      return { ...doc, thumbnail };
    });
    res.json({ documents: rows });
  } catch (err) {
    next(err);
  }
});

// Delete any document
router.delete("/documents/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant document invalide" } });
    }
    const docRes = await query("SELECT cloudinary_public_id, preview_public_id FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    await deleteRaw(docRes.rows[0].cloudinary_public_id);
    await deletePreview(docRes.rows[0].preview_public_id);
    await query("DELETE FROM documents WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
