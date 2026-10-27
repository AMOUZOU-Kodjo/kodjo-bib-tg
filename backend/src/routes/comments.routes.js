import express from "express";
import { query, pool } from "../config/db.js";
import { authRequired, optionalAuth, requireVerified } from "../middlewares/auth.js";
import { config } from "../config/env.js";

const router = express.Router();

function canAccessDocument(doc, user) {
  if (doc.visibility === "public") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return String(user.id) === String(doc.owner_id);
}

router.get("/documents/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    if (!config.publicBrowsing && !req.user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    const docRes = await query("SELECT owner_id, visibility FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0 || !canAccessDocument(docRes.rows[0], req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.min(Math.max(1, Number(page) || 1), 10000);
    const limitNum = Math.min(Math.max(1, Number(limit) || 10), 50);
    const offset = (pageNum - 1) * limitNum;
    const resC = await query(
      `SELECT c.id, c.content, c.created_at, u.display_name as author_name, u.id as user_id
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.document_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limitNum, offset]
    );
    const countRes = await query("SELECT COUNT(*)::int as total FROM comments WHERE document_id = $1", [req.params.id]);
    res.json({ comments: resC.rows, total: countRes.rows[0].total });
  } catch (err) {
    next(err);
  }
});

router.post("/documents/:id/comments", authRequired, requireVerified, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Contenu requis" } });
    if (content.length > 1000) return res.status(400).json({ error: { code: "TOO_LONG", message: "Trop long" } });
    const docRes = await query("SELECT owner_id, visibility FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0 || !canAccessDocument(docRes.rows[0], req.user)) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const ins = await client.query("INSERT INTO comments (user_id, document_id, content) VALUES ($1,$2,$3) RETURNING id, content, created_at", [req.user.id, req.params.id, content.trim()]);
      await client.query("UPDATE documents SET comment_count = comment_count + 1 WHERE id = $1", [req.params.id]);
      await client.query("COMMIT");
      res.json({ comment: { ...ins.rows[0], author_name: req.user.displayName } });
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

router.delete("/comments/:id", authRequired, requireVerified, async (req, res, next) => {
  try {
    const cRes = await query("SELECT user_id, document_id FROM comments WHERE id = $1", [req.params.id]);
    if (cRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Commentaire introuvable" } });
    const comment = cRes.rows[0];
    const docRes = await query("SELECT owner_id FROM documents WHERE id = $1", [comment.document_id]);
    if (comment.user_id !== req.user.id && docRes.rows[0]?.owner_id !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Interdit" } });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM comments WHERE id = $1", [req.params.id]);
      await client.query("UPDATE documents SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1", [comment.document_id]);
      await client.query("COMMIT");
      res.json({ ok: true });
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

export default router;
