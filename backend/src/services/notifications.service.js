import { query } from "../config/db.js";
import { config } from "../config/env.js";
import { getSettings } from "./settings.service.js";
import { sendEmail } from "./email.service.js";
import { buildDocumentNotificationEmail } from "./emailTemplates.js";
import { getPreviewUrl } from "./cloudinary.service.js";
import { notifyTelegramDocument } from "./telegram.service.js";

const SEND_CONCURRENCY = 5;

export async function notifyDocumentUpload({ documentId }) {
  const docRes = await query(
    `SELECT d.id, d.title, d.description, d.category, d.original_filename, d.mime_type, d.size_bytes, d.created_at,
            d.preview_public_id, d.visibility, d.owner_id, u.display_name AS author_name, u.email AS owner_email
     FROM documents d
     JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1`,
    [documentId]
  );
  if (docRes.rows.length === 0) return { sent: 0, failed: 0 };

  const doc = docRes.rows[0];
  const isPrivate = doc.visibility === "private";
  const settings = await getSettings();
  const siteBase = String(config.frontendUrl || "").replace(/\/+$/, "");
  const documentUrl = `${siteBase}/documents/${doc.id}`;
  const subjectTitle = String(doc.title || "Nouveau document").replace(/[\r\n]+/g, " ").trim();
  const subjectSite = String(settings.siteName || "Archives").replace(/[\r\n]+/g, " ").trim();
  const subject = isPrivate
    ? `Votre document privé sur ${subjectSite} : ${subjectTitle}`
    : `Nouveau document sur ${subjectSite} : ${subjectTitle}`;
  const thumbnailUrl = getPreviewUrl(doc.preview_public_id, { expiresIn: 30 * 24 * 60 * 60 });

  let telegram = { skipped: true, reason: "private" };
  if (!isPrivate) {
    telegram = await notifyTelegramDocument({
      title: doc.title,
      description: doc.description,
      authorName: doc.author_name,
      category: doc.category,
      siteName: settings.siteName,
      documentUrl,
      thumbnailUrl
    }).catch((err) => {
      console.error("Échec de la publication Telegram:", err.message);
      return { ok: false, error: err.message };
    });
  }

  let recipients;
  if (isPrivate) {
    recipients = doc.owner_email
      ? [{ email: doc.owner_email, display_name: doc.author_name }]
      : [];
  } else {
    const usersRes = await query(
      "SELECT email, display_name FROM users WHERE email_verified = true ORDER BY created_at ASC"
    );
    recipients = usersRes.rows;
  }
  if (recipients.length === 0) return { sent: 0, failed: 0, telegram };
  let cursor = 0;
  let sent = 0;
  let failed = 0;

  const worker = async () => {
    while (cursor < recipients.length) {
      const recipient = recipients[cursor++];
      const content = buildDocumentNotificationEmail({
        siteName: settings.siteName,
        recipientName: recipient.display_name,
        authorName: doc.author_name,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        originalFilename: doc.original_filename,
        mimeType: doc.mime_type,
        sizeBytes: doc.size_bytes,
        uploadedAt: doc.created_at,
        documentUrl,
        thumbnailUrl,
        isPrivate
      });
      try {
        await sendEmail({
          to: recipient.email,
          toName: recipient.display_name,
          subject,
          html: content.html,
          text: content.text
        });
        sent++;
      } catch (err) {
        failed++;
        console.error(`Échec de la notification d'upload pour ${recipient.email}:`, err.message);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(SEND_CONCURRENCY, recipients.length) }, worker));
  return { sent, failed, telegram };
}
