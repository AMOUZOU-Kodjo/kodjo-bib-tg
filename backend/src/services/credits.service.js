import { query } from "../config/db.js";
import { getSettings } from "./settings.service.js";

export async function addCreditsOnUpload(client, userId, documentId) {
  const { creditsParUpload } = await getSettings();
  const updated = await client.query(
    "UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING credits",
    [creditsParUpload, userId]
  );
  await client.query(
    "INSERT INTO credit_transactions (user_id, delta, reason, document_id) VALUES ($1, $2, 'upload', $3)",
    [userId, creditsParUpload, documentId]
  );
  return updated.rows[0]?.credits ?? null;
}

export async function ensureInitialCredits(userId) {
  const { creditsInitiaux } = await getSettings();
  if (creditsInitiaux <= 0) return;
  const updated = await query(
    "UPDATE users SET credits = $1 WHERE id = $2 AND credits = 0 RETURNING id",
    [creditsInitiaux, userId]
  );
  if (updated.rows.length > 0) {
    await query(
      "INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1, $2, 'initial')",
      [userId, creditsInitiaux]
    );
  }
}
