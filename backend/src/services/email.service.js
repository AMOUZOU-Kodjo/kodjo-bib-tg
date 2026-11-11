import crypto from "crypto";
import { config } from "../config/env.js";

export async function sendEmail({ to, toName, subject, html, text, replyTo, attachments = [] }) {
  if (!config.brevo.apiKey) {
    if (config.nodeEnv === "production") {
      const error = new Error("Service e-mail non configuré");
      error.code = "EMAIL_NOT_CONFIGURED";
      throw error;
    }
    console.log("[EMAIL DEV]", { to, toName, subject, html, text, replyTo });
    return { ok: true, dev: true };
  }
  if (!config.brevo.senderEmail) {
    const error = new Error("BREVO_SENDER_EMAIL est requis");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": config.brevo.apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { email: config.brevo.senderEmail, name: config.brevo.senderName },
        to: [{ email: to, ...(toName ? { name: toName } : {}) }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
        replyTo: replyTo ? { email: replyTo.email, name: replyTo.name } : undefined,
        ...(Array.isArray(attachments) && attachments.length > 0
          ? {
              attachment: attachments.map((file) => ({
                name: file.filename || file.name || "piece-jointe",
                content: Buffer.isBuffer(file.content) ? file.content.toString("base64") : String(file.content || "")
              }))
            }
          : {})
      })
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Brevo error", res.status, text);
      const error = new Error(`Echec envoi email (Brevo ${res.status})`);
      error.code = "EMAIL_SEND_FAILED";
      error.providerStatus = res.status;
      throw error;
    }
    return { ok: true };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashCode(code) {
  return crypto.createHmac("sha256", config.jwtSecret).update(code).digest("hex");
}
