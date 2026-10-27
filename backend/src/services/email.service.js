import crypto from "crypto";
import { config } from "../config/env.js";

export async function sendEmail({ to, toName, subject, html, text, replyTo }) {
  if (!config.brevo.apiKey) {
    console.log("[EMAIL DEV]", { to, toName, subject, html, text, replyTo });
    return { ok: true, dev: true };
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
        replyTo: replyTo ? { email: replyTo.email, name: replyTo.name } : undefined
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
  return crypto.createHash("sha256").update(code).digest("hex");
}
