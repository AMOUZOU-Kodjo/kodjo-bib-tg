import { config } from "../config/env.js";

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function formatDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(value);
}

const SANS = "'Manrope', 'Segoe UI', Arial, sans-serif";
const DISPLAY = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SIGNATURE = "'Tritopani', 'Segoe Script', 'Brush Script MT', cursive";

export function buildContactEmail({
  intro,
  fromName,
  fromEmail,
  subject,
  message,
  documentTitle,
  documentUrl,
  recipientName,
  contextLabel = "Nouveau message",
  siteName = "Archives"
}) {
  const brandName = String(siteName || "Archives").trim() || "Archives";
  const safeBrand = escapeHtml(brandName);
  const safeName = escapeHtml(fromName || "Utilisateur");
  const safeEmail = escapeHtml(fromEmail);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const safeDocumentTitle = documentTitle ? escapeHtml(documentTitle) : "";
  const safeDocumentUrl = documentUrl ? escapeHtml(documentUrl) : "";
  const safeRecipient = escapeHtml(recipientName || `l'équipe ${brandName}`);
  const receivedAt = formatDate();

  const siteUrl = config.frontendUrl || "";
  const safeSiteUrl = escapeHtml(siteUrl);
  const siteDisplay = escapeHtml(String(siteUrl).replace(/^https?:\/\//, "") || brandName);
  const replyHref = escapeHtml(`mailto:${fromEmail}?subject=${encodeURIComponent(`Re: [${brandName}] ${subject}`)}`);

  const documentRow = documentTitle
    ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:110px;vertical-align:top;">Document</td>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:500;">
          ${safeDocumentUrl ? `<a href="${safeDocumentUrl}" style="color:#0f766e;text-decoration:none;">${safeDocumentTitle}</a>` : safeDocumentTitle}
        </td>
      </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2f1;font-family:${SANS};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f1;font-size:1px;line-height:1px;">
      Nouveau message depuis le site ${safeBrand} — ${safeSubject}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f1;padding:26px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4e2;">
            <tr>
              <td style="background-color:#0b1f1c;padding:0;">
                <div style="height:4px;background-color:#0f766e;font-size:0;line-height:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:26px 30px 24px;">
                      <p style="margin:0 0 12px;display:inline-block;padding:5px 10px;border:1px solid #115e59;border-radius:999px;color:#99f6e4;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                        Message reçu depuis le site
                      </p>
                      <p style="margin:0;color:#ffffff;font-family:${DISPLAY};font-size:31px;font-weight:600;line-height:1.1;">${safeBrand}</p>
                      <p style="margin:6px 0 0;color:#99f6e4;font-family:${SANS};font-size:12px;letter-spacing:0.4px;">
                        Plateforme de partage de documents
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 20px;color:#374151;font-family:${SANS};font-size:15px;line-height:1.65;">${escapeHtml(intro)}</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:110px;">Expéditeur</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">E-mail</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;">
                      <a href="mailto:${safeEmail}" style="color:#0f766e;text-decoration:none;">${safeEmail}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Sujet</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${safeSubject}</td>
                  </tr>
                  ${documentRow}
                  <tr>
                    <td style="padding:10px 0;color:#6b7280;font-size:13px;">Reçu le</td>
                    <td style="padding:10px 0;color:#111827;font-size:14px;">${receivedAt}</td>
                  </tr>
                </table>

                <p style="margin:0 0 8px;color:#6b7280;font-family:${SANS};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Message</p>
                <div style="background-color:#f6f8f7;border-left:3px solid #0f766e;border-radius:0 10px 10px 0;padding:16px 18px;color:#1f2937;font-family:${SANS};font-size:15px;line-height:1.7;word-break:break-word;">
                  ${safeMessage}
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="border-radius:9px;background-color:#0f766e;">
                      <a href="${replyHref}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;text-decoration:none;border-radius:9px;">
                        Répondre à ${safeName}
                      </a>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;border-top:1px solid #e5e7eb;">
                  <tr>
                    <td style="padding-top:22px;">
                      <p style="margin:0;color:#0f766e;font-family:${SIGNATURE};font-size:32px;line-height:1.2;">L'équipe ${safeBrand}</p>
                      <p style="margin:4px 0 0;color:#6b7280;font-family:${SANS};font-size:12px;line-height:1.6;">
                        Plateforme de partage de documents<br />
                        ${safeSiteUrl ? `<a href="${safeSiteUrl}" style="color:#0f766e;text-decoration:none;">${siteDisplay}</a>` : siteDisplay}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 30px;background-color:#f6f8f7;border-top:1px solid #e5e7eb;">
                <p style="margin:0 0 6px;color:#6b7280;font-family:${SANS};font-size:12px;line-height:1.65;">
                  Cet e-mail provient du site <strong style="color:#374151;">${safeBrand}</strong>${safeSiteUrl ? ` (<a href="${safeSiteUrl}" style="color:#0f766e;text-decoration:none;">${siteDisplay}</a>)` : ""}
                  et a été adressé à ${safeRecipient}.
                </p>
                <p style="margin:0;color:#9ca3af;font-family:${SANS};font-size:11px;line-height:1.6;">
                  ${escapeHtml(contextLabel)} · Répondez directement à cet e-mail pour joindre l'expéditeur.
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:14px 0 0;color:#9ca3af;font-family:${SANS};font-size:11px;line-height:1.6;text-align:center;">
            © 2026 ${safeBrand} · E-mail généré automatiquement depuis la plateforme.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `MESSAGE REÇU DEPUIS LE SITE ${brandName.toUpperCase()}`,
    `${"=".repeat(44)}`,
    ``,
    intro,
    ``,
    `Expéditeur : ${fromName || "Utilisateur"}`,
    `E-mail : ${fromEmail}`,
    `Sujet : ${subject}`,
    ...(documentTitle ? [`Document : ${documentTitle}${documentUrl ? ` (${documentUrl})` : ""}`] : []),
    `Reçu le : ${receivedAt}`,
    ``,
    `Message :`,
    message,
    ``,
    `${"=".repeat(44)}`,
    `L'équipe ${brandName}`,
    `Plateforme de partage de documents`,
    ...(siteUrl ? [siteUrl] : []),
    ``,
    `Cet e-mail provient du site ${brandName} et a été adressé à ${recipientName || `l'équipe ${brandName}`}.`,
    `Répondez directement à cet e-mail pour joindre l'expéditeur.`
  ].join("\n");

  return { html, text };
}

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "";
  const mb = value / (1024 * 1024);
  if (mb >= 1) return `${mb.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
  return `${Math.max(1, Math.round(value / 1024))} Ko`;
}

function truncate(value, maxLength) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getSiteBaseUrl() {
  return String(config.frontendUrl || "").replace(/\/+$/, "");
}

function getFileType(originalFilename = "", mimeType = "") {
  const extension = String(originalFilename).includes(".") ? String(originalFilename).split(".").pop() : "";
  const subtype = String(mimeType).split("/").pop();
  return String(extension || subtype || "Document").toUpperCase();
}

export function buildVerificationEmail({
  code,
  displayName,
  email,
  siteName = "Archives",
  expiresMinutes = 15
}) {
  const brandName = String(siteName || "Archives").trim() || "Archives";
  const safeBrand = escapeHtml(brandName);
  const safeName = escapeHtml(displayName || "bonjour");
  const safeCode = escapeHtml(code);
  const siteBase = getSiteBaseUrl();
  const safeSiteUrl = escapeHtml(siteBase);
  const verifyUrl = escapeHtml(`${siteBase}/verify-email?email=${encodeURIComponent(email || "")}`);
  const siteDisplay = escapeHtml(siteBase.replace(/^https?:\/\//, "") || brandName);

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Votre code de vérification</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2f1;font-family:${SANS};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f1;font-size:1px;line-height:1px;">
      Votre code de vérification pour ${safeBrand}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f1;padding:26px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4e2;">
            <tr>
              <td style="background-color:#0b1f1c;padding:0;">
                <div style="height:4px;background-color:#0f766e;font-size:0;line-height:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:26px 30px 24px;">
                      <p style="margin:0 0 12px;display:inline-block;padding:5px 10px;border:1px solid #115e59;border-radius:999px;color:#99f6e4;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                        Confirmation de compte
                      </p>
                      <p style="margin:0;color:#ffffff;font-family:${DISPLAY};font-size:31px;font-weight:600;line-height:1.1;">${safeBrand}</p>
                      <p style="margin:6px 0 0;color:#99f6e4;font-family:${SANS};font-size:12px;letter-spacing:0.4px;">
                        Plateforme de partage de documents
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 16px;color:#111827;font-family:${DISPLAY};font-size:25px;line-height:1.25;">Bonjour ${safeName},</p>
                <p style="margin:0 0 22px;color:#374151;font-family:${SANS};font-size:15px;line-height:1.7;">
                  Merci pour votre inscription sur <strong>${safeBrand}</strong>. Pour activer votre compte, saisissez ce code de vérification :
                </p>
                <div style="margin:0 0 22px;padding:22px;background-color:#f6f8f7;border:1px dashed #0f766e;border-radius:12px;text-align:center;">
                  <p style="margin:0 0 6px;color:#6b7280;font-family:${SANS};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Code de vérification</p>
                  <p style="margin:0;color:#0f766e;font-family:${SANS};font-size:36px;font-weight:800;letter-spacing:9px;line-height:1.2;">${safeCode}</p>
                </div>
                <p style="margin:0 0 24px;color:#6b7280;font-family:${SANS};font-size:13px;line-height:1.65;">
                  Ce code est valable pendant <strong style="color:#374151;">${expiresMinutes} minutes</strong>. Ne le partagez avec personne.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
                  <tr>
                    <td style="border-radius:9px;background-color:#0f766e;">
                      <a href="${verifyUrl}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;text-decoration:none;border-radius:9px;">
                        Saisir mon code
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#9ca3af;font-family:${SANS};font-size:12px;line-height:1.65;">
                  Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet e-mail.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px;background-color:#f6f8f7;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-family:${SANS};font-size:12px;line-height:1.65;">
                  ${safeSiteUrl ? `<a href="${safeSiteUrl}" style="color:#0f766e;text-decoration:none;">${siteDisplay}</a>` : siteDisplay} · E-mail automatique, merci de ne pas répondre.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `VÉRIFICATION DE VOTRE COMPTE ${brandName.toUpperCase()}`,
    `${"=".repeat(48)}`,
    ``,
    `Bonjour ${displayName || ""},`,
    ``,
    `Votre code de vérification est : ${code}`,
    `Il est valable pendant ${expiresMinutes} minutes.`,
    ``,
    `Saisir le code : ${siteBase}/verify-email?email=${encodeURIComponent(email || "")}`,
    ``,
    `Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.`
  ].join("\n");

  return { html, text };
}

export function buildDocumentNotificationEmail({
  siteName = "Archives",
  recipientName,
  authorName,
  title,
  description,
  category,
  originalFilename,
  mimeType,
  sizeBytes,
  uploadedAt,
  documentUrl,
  thumbnailUrl
}) {
  const brandName = String(siteName || "Archives").trim() || "Archives";
  const safeBrand = escapeHtml(brandName);
  const safeRecipient = escapeHtml(recipientName || "");
  const safeAuthor = escapeHtml(authorName || "Un membre");
  const safeTitle = escapeHtml(title || "Nouveau document");
  const safeCategory = escapeHtml(category || "Document");
  const safeDescription = escapeHtml(truncate(description || "Un nouveau document vient d'être publié sur la plateforme.", 220));
  const safeType = escapeHtml(getFileType(originalFilename, mimeType));
  const safeSize = escapeHtml(formatFileSize(sizeBytes));
  const postedAt = formatDate(uploadedAt || new Date());
  const siteBase = getSiteBaseUrl();
  const safeSiteUrl = escapeHtml(siteBase);
  const siteDisplay = escapeHtml(siteBase.replace(/^https?:\/\//, "") || brandName);
  const documentHref = escapeHtml(documentUrl || `${siteBase}/documents`);
  const safeThumbnail = thumbnailUrl ? escapeHtml(thumbnailUrl) : "";
  const previewImageRow = safeThumbnail
    ? `<tr>
                    <td align="center" style="background-color:#0b1f1c;padding:22px 24px 0;">
                      <a href="${documentHref}" style="text-decoration:none;">
                        <img src="${safeThumbnail}" alt="${safeTitle}" width="240" height="320" style="display:block;width:240px;height:320px;object-fit:cover;object-position:top;border-radius:10px;border:1px solid #115e59;" />
                      </a>
                    </td>
                  </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>Nouveau document sur ${safeBrand}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2f1;font-family:${SANS};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f1;font-size:1px;line-height:1px;">
      ${safeTitle} — publié par ${safeAuthor} sur ${safeBrand}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f1;padding:26px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4e2;">
            <tr>
              <td style="background-color:#0b1f1c;padding:0;">
                <div style="height:4px;background-color:#0f766e;font-size:0;line-height:0;">&nbsp;</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:26px 30px 24px;">
                      <p style="margin:0 0 12px;display:inline-block;padding:5px 10px;border:1px solid #115e59;border-radius:999px;color:#99f6e4;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                        Nouvelle publication
                      </p>
                      <p style="margin:0;color:#ffffff;font-family:${DISPLAY};font-size:31px;font-weight:600;line-height:1.1;">${safeBrand}</p>
                      <p style="margin:6px 0 0;color:#99f6e4;font-family:${SANS};font-size:12px;letter-spacing:0.4px;">
                        Plateforme de partage de documents
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 20px;color:#374151;font-family:${SANS};font-size:15px;line-height:1.65;">
                  ${safeRecipient ? `Bonjour ${safeRecipient},` : "Bonjour,"}<br />
                  Un nouveau document vient d'être ajouté à la bibliothèque.
                </p>

                <p style="margin:0 0 8px;color:#6b7280;font-family:${SANS};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">Aperçu du document</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dbe4e2;border-radius:14px;overflow:hidden;background-color:#f6f8f7;">
                  ${previewImageRow}
                  <tr>
                    <td style="background-color:#0b1f1c;padding:22px 24px;">
                      <p style="margin:0 0 9px;display:inline-block;padding:4px 9px;border-radius:999px;background-color:#115e59;color:#ccfbf1;font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${safeCategory}</p>
                      <p style="margin:0;color:#ffffff;font-family:${DISPLAY};font-size:25px;font-weight:600;line-height:1.25;">${safeTitle}</p>
                      <p style="margin:9px 0 0;color:#99f6e4;font-family:${SANS};font-size:12px;line-height:1.5;">Publié par <strong style="color:#ffffff;">${safeAuthor}</strong></p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 24px;background-color:#ffffff;">
                      <p style="margin:0 0 18px;color:#4b5563;font-family:${SANS};font-size:14px;line-height:1.7;">${safeDescription}</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-family:${SANS};font-size:12px;width:110px;">Auteur</td>
                          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-family:${SANS};font-size:13px;font-weight:600;">${safeAuthor}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-family:${SANS};font-size:12px;">Format</td>
                          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-family:${SANS};font-size:13px;">${safeType}${safeSize ? ` · ${safeSize}` : ""}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;color:#6b7280;font-family:${SANS};font-size:12px;">Publié le</td>
                          <td style="padding:8px 0;color:#111827;font-family:${SANS};font-size:13px;">${escapeHtml(postedAt)}</td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:9px;background-color:#0f766e;">
                            <a href="${documentHref}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;text-decoration:none;border-radius:9px;">
                              Consulter le document
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;border-top:1px solid #e5e7eb;">
                  <tr>
                    <td style="padding-top:22px;">
                      <p style="margin:0;color:#0f766e;font-family:${SIGNATURE};font-size:32px;line-height:1.2;">L'équipe ${safeBrand}</p>
                      <p style="margin:4px 0 0;color:#6b7280;font-family:${SANS};font-size:12px;line-height:1.6;">
                        Plateforme de partage de documents<br />
                        ${safeSiteUrl ? `<a href="${safeSiteUrl}" style="color:#0f766e;text-decoration:none;">${siteDisplay}</a>` : siteDisplay}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px;background-color:#f6f8f7;border-top:1px solid #e5e7eb;">
                <p style="margin:0;color:#6b7280;font-family:${SANS};font-size:12px;line-height:1.65;">
                  Vous recevez cet e-mail car votre compte est inscrit sur <strong style="color:#374151;">${safeBrand}</strong>. Les notifications sont envoyées à chaque nouvelle publication.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;color:#9ca3af;font-family:${SANS};font-size:11px;line-height:1.6;text-align:center;">
            © 2026 ${safeBrand} · E-mail généré automatiquement depuis la plateforme.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `NOUVEAU DOCUMENT SUR ${brandName.toUpperCase()}`,
    `${"=".repeat(48)}`,
    ``,
    `${recipientName ? `Bonjour ${recipientName},` : "Bonjour,"}`,
    ``,
    `Titre : ${title}`,
    `Auteur : ${authorName || "Un membre"}`,
    `Catégorie : ${category || "Document"}`,
    `Format : ${getFileType(originalFilename, mimeType)}${formatFileSize(sizeBytes) ? ` · ${formatFileSize(sizeBytes)}` : ""}`,
    `Publié le : ${postedAt}`,
    ``,
    description || "Un nouveau document vient d'être publié sur la plateforme.",
    ``,
    `Consulter le document : ${documentUrl || `${siteBase}/documents`}`,
    ...(thumbnailUrl ? [`Aperçu : ${thumbnailUrl}`] : []),
    ``,
    `Vous recevez cet e-mail car votre compte est inscrit sur ${brandName}.`
  ].join("\n");

  return { html, text };
}
