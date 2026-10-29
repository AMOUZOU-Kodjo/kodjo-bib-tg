import { config } from "../config/env.js";

const TELEGRAM_API = "https://api.telegram.org";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function truncate(value, maxLength) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildCaption({ title, description, authorName, category, siteName, documentUrl }) {
  const lines = [`<b>Nouveau document${siteName ? ` sur ${escapeHtml(siteName)}` : ""}</b>`, ""];
  lines.push(`<b>${escapeHtml(title)}</b>`);
  if (description) lines.push("", escapeHtml(truncate(description, 250)));
  const meta = [];
  if (authorName) meta.push(`Auteur : ${escapeHtml(authorName)}`);
  if (category) meta.push(`Catégorie : ${escapeHtml(category)}`);
  if (meta.length) lines.push("", meta.join("\n"));
  lines.push("", `<a href="${escapeHtml(documentUrl)}">Ouvrir le document</a>`);
  return lines.join("\n");
}

async function callTelegram(method, payload) {
  const response = await fetch(`${TELEGRAM_API}/bot${config.telegram.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram HTTP ${response.status}`);
  }
  return data.result;
}

export function isTelegramConfigured() {
  return Boolean(config.telegram.botToken && config.telegram.channelId);
}

export async function notifyTelegramDocument({
  title,
  description,
  authorName,
  category,
  siteName,
  documentUrl,
  thumbnailUrl
}) {
  if (!isTelegramConfigured()) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN manquant, publication ignorée");
    return { skipped: true };
  }

  const caption = buildCaption({
    title,
    description,
    authorName,
    category,
    siteName,
    documentUrl
  });
  const payload = {
    chat_id: config.telegram.channelId,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Ouvrir le document", url: documentUrl }]]
    }
  };

  if (thumbnailUrl) {
    try {
      await callTelegram("sendPhoto", { ...payload, photo: thumbnailUrl, caption });
      return { ok: true, method: "sendPhoto" };
    } catch (err) {
      console.error("[telegram] échec de l'envoi de la miniature, repli sur le texte:", err.message);
    }
  }

  await callTelegram("sendMessage", {
    ...payload,
    text: caption,
    disable_web_page_preview: false
  });
  return { ok: true, method: "sendMessage" };
}
