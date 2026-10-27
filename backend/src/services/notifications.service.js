import { query } from "../config/db.js";
import { config } from "../config/env.js";
import { getSettings } from "./settings.service.js";
import { sendEmail } from "./email.service.js";
import { buildDocumentNotificationEmail } from "./emailTemplates.js";
import { getPreviewUrl } from "./cloudinary.service.js";

const SEND_CONCURRENCY = 5;

export async function notifyDocumentUpload({ documentId }) {
  const docRes = await query(
    `SELECT d.id, d.title, d.description, d.category, d.original_filename, d.mime_type, d.size_bytes, d.created_at,
            d.preview_public_id, u.display_name AS author_name
     FROM documents d
     JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1`,
    [documentId]
  );
  if (docRes.rows.length === 0) return { sent: 0, failed: 0 };

  const doc = docRes.rows[0];
  const usersRes = await query(
    "SELECT email, display_name FROM users WHERE email_verified = true ORDER BY created_at ASC"
  );
  if (usersRes.rows.length === 0) return { sent: 0, failed: 0 };

  const settings = await getSettings();
  const siteBase = String(config.frontendUrl || "").replace(/\/+$/, "");
  const documentUrl = `${siteBase}/documents/${doc.id}`;
  const subjectTitle = String(doc.title || "Nouveau document").replace(/[\r\n]+/g, " ").trim();
  const subjectSite = String(settings.siteName || "Archives").replace(/[\r\n]+/g, " ").trim();
  const subject = `Nouveau document sur ${subjectSite} : ${subjectTitle}`;
  const thumbnailUrl = getPreviewUrl(doc.preview_public_id, { expiresIn: 30 * 24 * 60 * 60 });

  const recipients = usersRes.rows;
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
        thumbnailUrl
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
  return { sent, failed };
}
