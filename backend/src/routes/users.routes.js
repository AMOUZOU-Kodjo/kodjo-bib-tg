import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { authRequired } from "../middlewares/auth.js";
import { getDocumentThumbnailUrl } from "../services/cloudinary.service.js";
import { config } from "../config/env.js";

const router = express.Router();

router.get("/me/documents", authRequired, async (req, res, next) => {
  try {
    const resDocs = await query(
      `SELECT id, title, description, category, visibility, share_enabled, original_filename, mime_type, cloudinary_public_id, preview_public_id, size_bytes,
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

router.patch("/me", authRequired, async (req, res, next) => {
  try {
    const displayName = String(req.body.displayName ?? req.body.display_name ?? "").trim();
    if (!displayName) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Nom affiché requis" } });
    if (displayName.length < 2 || displayName.length > 60) {
      return res.status(400).json({ error: { code: "INVALID_NAME", message: "Le nom doit contenir entre 2 et 60 caractères" } });
    }

    const up = await query(
      "UPDATE users SET display_name = $1 WHERE id = $2 RETURNING id, email, display_name, email_verified, credits, role",
      [displayName, req.user.id]
    );
    const user = up.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, displayName: user.display_name, emailVerified: user.email_verified, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.cookie("token", token, { httpOnly: true, sameSite: config.nodeEnv === "production" ? "none" : "lax", secure: config.nodeEnv === "production" });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
