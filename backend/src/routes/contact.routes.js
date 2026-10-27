import express from "express";
import { authRequired, requireVerified } from "../middlewares/auth.js";
import { contactLimiter } from "../middlewares/rateLimit.js";
import { pool } from "../config/db.js";
import { sendEmail } from "../services/email.service.js";
import { buildContactEmail } from "../services/emailTemplates.js";
import { config } from "../config/env.js";
import { getSettings } from "../services/settings.service.js";

const router = express.Router();

router.post("/support", contactLimiter, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Tous les champs sont requis" } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Adresse e-mail invalide" } });
    }
    if (name.length > 80 || subject.length > 150 || message.length > 3000) {
      return res.status(400).json({ error: { code: "TOO_LONG", message: "Contenu trop long" } });
    }

    const safeSubject = String(subject).replace(/[\r\n]+/g, " ").trim();
    const settings = await getSettings();
    const { html, text } = buildContactEmail({
      intro: `Un nouveau message a été envoyé depuis le formulaire de contact du site ${settings.siteName}.`,
      fromName: name,
      fromEmail: email,
      subject: safeSubject,
      message,
      recipientName: `l'équipe ${settings.siteName}`,
      contextLabel: "Formulaire de contact",
      siteName: settings.siteName
    });

    try {
      await sendEmail({
        to: settings.contactEmail,
        toName: settings.siteName,
        subject: `[${settings.siteName}] Nouveau message : ${safeSubject}`,
        html,
        text,
        replyTo: { email, name }
      });
    } catch (err) {
      console.error("Contact support email failed:", err.message);
      return res.status(502).json({
        error: {
          code: "EMAIL_SEND_FAILED",
          message: `L'envoi du message a échoué. Réessayez plus tard ou écrivez à ${settings.contactEmail}.`
        }
      });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/", authRequired, requireVerified, contactLimiter, async (req, res, next) => {
  try {
    const { toUserId, documentId, subject, message } = req.body;
    if (!toUserId || !subject || !message) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    if (toUserId === req.user.id) return res.status(400).json({ error: { code: "FORBIDDEN", message: "Impossible" } });
    if (String(subject).length > 150 || String(message).length > 3000) {
      return res.status(400).json({ error: { code: "TOO_LONG", message: "Contenu trop long" } });
    }

    const ownerRes = await pool.query("SELECT email, display_name FROM users WHERE id = $1", [toUserId]);
    if (ownerRes.rows.length === 0) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Destinataire introuvable" } });
    const fromRes = await pool.query("SELECT email, display_name FROM users WHERE id = $1", [req.user.id]);

    let documentTitle = null;
    let documentUrl = null;
    if (documentId) {
      const docRes = await pool.query("SELECT title FROM documents WHERE id = $1 AND visibility = 'public'", [documentId]);
      if (docRes.rows.length > 0) {
        documentTitle = docRes.rows[0].title;
        documentUrl = `${config.frontendUrl}/documents/${documentId}`;
      }
    }

    const safeSubject = String(subject).replace(/[\r\n]+/g, " ").trim();
    const from = fromRes.rows[0];
    const owner = ownerRes.rows[0];
    const settings = await getSettings();
    const { html, text } = buildContactEmail({
      intro: documentTitle
        ? `Vous avez reçu un nouveau message concernant votre document « ${documentTitle} ».`
        : `Vous avez reçu un nouveau message depuis la plateforme ${settings.siteName}.`,
      fromName: from.display_name,
      fromEmail: from.email,
      subject: safeSubject,
      message,
      documentTitle,
      documentUrl,
      recipientName: owner.display_name,
      contextLabel: "Nouveau message",
      siteName: settings.siteName
    });

    try {
      await sendEmail({
        to: owner.email,
        toName: owner.display_name,
        subject: documentTitle ? `[${settings.siteName}] Message concernant : ${documentTitle.replace(/[\r\n]+/g, " ")}` : `[${settings.siteName}] ${safeSubject}`,
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

    await pool.query("INSERT INTO contact_messages (from_user_id, to_user_id, document_id, subject) VALUES ($1,$2,$3,$4)", [req.user.id, toUserId, documentId || null, safeSubject]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
