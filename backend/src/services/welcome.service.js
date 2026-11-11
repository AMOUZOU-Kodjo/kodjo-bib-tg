import { query } from "../config/db.js";
import { getSettings } from "./settings.service.js";
import { sendEmail } from "./email.service.js";
import { createNotification } from "./notificationCenter.service.js";

async function alreadySent(userId, type) {
  const res = await query(
    "SELECT 1 FROM notifications WHERE user_id = $1 AND type = $2 LIMIT 1",
    [userId, type]
  );
  return res.rows.length > 0;
}

export async function sendWelcomeMessage({ userId }) {
  try {
    if (!userId || await alreadySent(userId, "welcome")) return;
    const userRes = await query(
      "SELECT id, email, display_name, notify_email FROM users WHERE id = $1",
      [userId]
    );
    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];
    const { siteName } = await getSettings();
    const brand = String(siteName || "Archives").trim() || "Archives";
    await createNotification({
      userId: user.id,
      type: "welcome",
      title: `Bienvenue sur ${brand}`,
      message: "Merci pour votre inscription. Votre compte est prêt.",
      link: "/profile"
    });
    if (user.notify_email && user.email) {
      await sendEmail({
        to: user.email,
        toName: user.display_name,
        subject: `Bienvenue sur ${brand}`,
        html: `<p>Bonjour ${escape(user.display_name)},</p><p>Merci pour votre inscription sur ${escape(brand)}. Votre compte est prêt.</p>`,
        text: `Bonjour ${user.display_name},\n\nMerci pour votre inscription sur ${brand}. Votre compte est prêt.`
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Échec du message de bienvenue:", err.message);
  }
}

export async function sendFirstPublicationThanks({ userId, documentId }) {
  try {
    if (!userId || await alreadySent(userId, "first_publication")) return;
    const userRes = await query(
      "SELECT id, email, display_name, notify_email FROM users WHERE id = $1",
      [userId]
    );
    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];
    const countRes = await query("SELECT COUNT(*)::int AS c FROM documents WHERE owner_id = $1", [userId]);
    if ((countRes.rows[0]?.c || 0) !== 1) return;
    const { siteName } = await getSettings();
    const brand = String(siteName || "Archives").trim() || "Archives";
    await createNotification({
      userId: user.id,
      type: "first_publication",
      title: "Merci pour votre première publication",
      message: "Votre premier document a bien été publié. Merci de contribuer à la plateforme.",
      link: documentId ? `/documents/${documentId}` : "/documents"
    });
    if (user.notify_email && user.email) {
      await sendEmail({
        to: user.email,
        toName: user.display_name,
        subject: `Merci pour votre première publication - ${brand}`,
        html: `<p>Bonjour ${escape(user.display_name)},</p><p>Merci pour votre première publication sur ${escape(brand)}. Votre document est maintenant en ligne.</p>`,
        text: `Bonjour ${user.display_name},\n\nMerci pour votre première publication sur ${brand}. Votre document est maintenant en ligne.`
      }).catch(() => {});
    }
  } catch (err) {
    console.error("Échec du message de remerciement:", err.message);
  }
}

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
