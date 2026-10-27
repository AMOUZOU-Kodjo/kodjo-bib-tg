import { query } from "../config/db.js";
import { getSettings } from "./settings.service.js";

export async function addCreditsOnUpload(client, userId, documentId) {
  const { creditsParUpload } = await getSettings();
  await client.query("UPDATE users SET credits = credits + $1 WHERE id = $2", [creditsParUpload, userId]);
  await client.query(
    "INSERT INTO credit_transactions (user_id, delta, reason, document_id) VALUES ($1, $2, 'upload', $3)",
    [userId, creditsParUpload, documentId]
  );
}

export async function ensureInitialCredits(userId) {
  const { creditsInitiaux } = await getSettings();
  if (creditsInitiaux <= 0) return;
  const res = await query("SELECT credits FROM users WHERE id = $1", [userId]);
  if (res.rows[0] && res.rows[0].credits === 0) {
    await query("UPDATE users SET credits = $1 WHERE id = $2", [creditsInitiaux, userId]);
    await query(
      "INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1, $2, 'initial')",
      [userId, creditsInitiaux]
    );
  }
}
