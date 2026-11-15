import express from "express";
import net from "node:net";
import { query } from "../config/db.js";
import { authRequired } from "../middlewares/auth.js";
import { getPushPublicKey, isPushConfigured } from "../services/notificationCenter.service.js";
import { getSignedDownloadUrl, getSignedViewUrl } from "../services/cloudinary.service.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function attachmentList(value) {
  return Array.isArray(value) ? value : [];
}

function publicAttachmentList(value) {
  return attachmentList(value).map((file) => ({
    filename: file.filename || "piece-jointe",
    mime_type: file.mime_type || "application/octet-stream",
    size: Number(file.size) || 0
  }));
}

async function signAttachments(attachments) {
  return Promise.all(attachmentList(attachments).map(async (file) => {
    const base = {
      filename: file.filename || "piece-jointe",
      mime_type: file.mime_type || "application/octet-stream",
      size: Number(file.size) || 0
    };
    if (!file.public_id) return { ...base, url: null, download_url: null };
    const [viewResult, downloadResult] = await Promise.allSettled([
      getSignedViewUrl(file.public_id, file.filename, file.resource_type || "raw"),
      getSignedDownloadUrl(file.public_id, file.filename, file.resource_type || "raw")
    ]);
    return {
      ...base,
      url: viewResult.status === "fulfilled" ? viewResult.value : null,
      download_url: downloadResult.status === "fulfilled" ? downloadResult.value : null
    };
  }));
}

function isValidPushEndpoint(value) {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) return false;
    if (net.isIP(url.hostname) !== 0 || !url.hostname.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const page = Math.min(Math.max(1, Number(req.query.page) || 1), 10000);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 50);
    const offset = (page - 1) * limit;
    const [listRes, totalRes, unreadRes] = await Promise.all([
      query(
        `SELECT id, type, title, message, link, attachments, read_at, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      query("SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1", [req.user.id]),
      query("SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND read_at IS NULL", [req.user.id])
    ]);
    res.json({
      notifications: listRes.rows.map((row) => ({ ...row, attachments: publicAttachmentList(row.attachments) })),
      total: totalRes.rows[0].total,
      unread: unreadRes.rows[0].unread,
      page,
      limit
    });
  } catch (err) {
    next(err);
  }
});

router.post("/read-all", async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL RETURNING id",
      [req.user.id]
    );
    res.json({ ok: true, updated: result.rowCount });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant de notification invalide" } });
    }
    const result = await query(
      "UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 AND read_at IS NULL RETURNING id, read_at",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      const exists = await query("SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification introuvable" } });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant de notification invalide" } });
    }
    const result = await query(
      `SELECT id, type, title, message, link, attachments, read_at, created_at
       FROM notifications
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification introuvable" } });
    }
    const notification = result.rows[0];
    notification.attachments = await signAttachments(notification.attachments);
    res.json({ notification });
  } catch (err) {
    next(err);
  }
});

router.get("/push/public-key", (req, res) => {
  res.json({ enabled: isPushConfigured(), publicKey: getPushPublicKey() });
});

router.post("/push/subscribe", async (req, res, next) => {
  try {
    const endpoint = String(req.body?.endpoint || "").trim();
    const p256dh = String(req.body?.keys?.p256dh || "").trim();
    const auth = String(req.body?.keys?.auth || "").trim();
    if (!isValidPushEndpoint(endpoint) || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
      return res.status(400).json({ error: { code: "INVALID_SUBSCRIPTION", message: "Abonnement push invalide" } });
    }
    const result = await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE
         SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
       RETURNING id`,
      [req.user.id, endpoint, p256dh, auth]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    next(err);
  }
});

router.delete("/push/subscribe", async (req, res, next) => {
  try {
    const endpoint = String(req.body?.endpoint || "").trim();
    if (endpoint) {
      await query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [req.user.id, endpoint]);
    } else {
      await query("DELETE FROM push_subscriptions WHERE user_id = $1", [req.user.id]);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
