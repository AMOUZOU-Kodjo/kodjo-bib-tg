import express from "express";
import { ensureFeatureSchema, query } from "../config/db.js";
import { authRequired, requireVerified } from "../middlewares/auth.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REASONS = new Set(["spam", "inappropriate", "copyright", "misleading", "other"]);

function canAccessDocument(doc, user) {
  if (doc.visibility === "public") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return String(user.id) === String(doc.owner_id);
}

router.post("/", authRequired, requireVerified, async (req, res, next) => {
  try {
    await ensureFeatureSchema();
    const documentId = typeof req.body.documentId === "string" ? req.body.documentId.trim() : null;
    const commentId = typeof req.body.commentId === "string" ? req.body.commentId.trim() : null;
    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    const details = (typeof req.body.details === "string" ? req.body.details : "").trim().slice(0, 1000);

    if (Boolean(documentId) === Boolean(commentId)) {
      return res.status(400).json({ error: { code: "INVALID_TARGET", message: "Indiquez un document ou un commentaire" } });
    }
    if ((documentId && !UUID_RE.test(documentId)) || (commentId && !UUID_RE.test(commentId))) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant invalide" } });
    }
    if (!REASONS.has(reason)) {
      return res.status(400).json({ error: { code: "INVALID_REASON", message: "Motif de signalement invalide" } });
    }

    if (commentId) {
      const commentRes = await query(
        `SELECT c.user_id, d.owner_id, d.visibility
         FROM comments c JOIN documents d ON d.id = c.document_id
         WHERE c.id = $1`,
        [commentId]
      );
      if (commentRes.rows.length === 0 || !canAccessDocument(commentRes.rows[0], req.user)) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Commentaire introuvable" } });
      }
      if (String(commentRes.rows[0].user_id) === String(req.user.id)) {
        return res.status(400).json({ error: { code: "CANNOT_REPORT_SELF", message: "Vous ne pouvez pas signaler votre propre commentaire" } });
      }
    } else {
      const docRes = await query("SELECT owner_id, visibility FROM documents WHERE id = $1", [documentId]);
      if (docRes.rows.length === 0 || !canAccessDocument(docRes.rows[0], req.user)) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
      }
      if (String(docRes.rows[0].owner_id) === String(req.user.id)) {
        return res.status(400).json({ error: { code: "CANNOT_REPORT_SELF", message: "Vous ne pouvez pas signaler votre propre document" } });
      }
    }

    const inserted = await query(
      `INSERT INTO reports (reporter_id, document_id, comment_id, reason, details)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, status, created_at`,
      [req.user.id, documentId, commentId, reason, details || null]
    );
    res.json({ ok: true, report: inserted.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: { code: "ALREADY_REPORTED", message: "Vous avez déjà signalé ce contenu" } });
    }
    next(err);
  }
});

export default router;
