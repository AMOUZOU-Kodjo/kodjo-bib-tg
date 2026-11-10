import crypto from "crypto";
import { pool, query } from "../config/db.js";

export const CREDIT_ORDER_STATUSES = ["awaiting_payment", "pending", "approved", "rejected", "cancelled"];
export const MOBILE_MONEY_OPERATORS = ["tmoney", "moov"];

const TRANSACTION_RE = /^[A-Za-z0-9._-]{4,80}$/;

export function normalizeOperator(value) {
  const operator = String(value ?? "").trim().toLowerCase();
  return MOBILE_MONEY_OPERATORS.includes(operator) ? operator : null;
}

export function normalizeTransactionId(value) {
  const transactionId = String(value ?? "").replace(/\s+/g, "").trim().toUpperCase();
  return TRANSACTION_RE.test(transactionId) ? transactionId : null;
}

function buildReference() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `AC-${time}-${random}`;
}

export async function createCreditOrder({ userId, pack, operator }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await query(
        `INSERT INTO credit_orders (user_id, reference, pack_id, pack_label, credits, amount, operator)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, reference, pack_id, pack_label, credits, amount, currency, operator, status, created_at`,
        [userId, buildReference(), pack.id, pack.label, pack.credits, pack.price, operator]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code !== "23505" || attempt === 4) throw err;
    }
  }
  throw new Error("Impossible de générer une référence unique");
}

export async function submitCreditOrder({ userId, orderId, transactionId, payerName }) {
  const normalizedTransaction = normalizeTransactionId(transactionId);
  if (!normalizedTransaction) return { error: "INVALID_TRANSACTION" };

  const result = await query(
    `UPDATE credit_orders
     SET transaction_id = $1, payer_name = $2, status = 'pending', submitted_at = now()
     WHERE id = $3 AND user_id = $4 AND status = 'awaiting_payment'
     RETURNING id, reference, pack_id, pack_label, credits, amount, currency, operator,
               payer_name, transaction_id, status, created_at, submitted_at`,
    [normalizedTransaction, payerName || null, orderId, userId]
  );
  if (result.rows.length > 0) return { order: result.rows[0] };

  const existing = await query(
    "SELECT status FROM credit_orders WHERE id = $1 AND user_id = $2",
    [orderId, userId]
  );
  if (existing.rows.length === 0) return { error: "NOT_FOUND" };
  return { error: "ALREADY_SUBMITTED" };
}

export async function cancelCreditOrder({ userId, orderId }) {
  const result = await query(
    `UPDATE credit_orders
     SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status = 'awaiting_payment'
     RETURNING id, reference, status`,
    [orderId, userId]
  );
  if (result.rows.length > 0) return { order: result.rows[0] };
  const existing = await query(
    "SELECT status FROM credit_orders WHERE id = $1 AND user_id = $2",
    [orderId, userId]
  );
  if (existing.rows.length === 0) return { error: "NOT_FOUND" };
  return { error: "INVALID_STATUS" };
}

export async function reviewCreditOrder({ orderId, adminId, status, note }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(
      `SELECT o.*, u.display_name AS user_name, u.email AS user_email
       FROM credit_orders o
       JOIN users u ON u.id = o.user_id
       WHERE o.id = $1
       FOR UPDATE OF o`,
      [orderId]
    );
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { error: "NOT_FOUND" };
    }
    const order = orderRes.rows[0];
    if (order.status !== "pending") {
      await client.query("ROLLBACK");
      return { error: "INVALID_STATUS", order };
    }

    if (status === "approved") {
      const creditsRes = await client.query(
        "UPDATE users SET paid_credits = paid_credits + $1 WHERE id = $2 RETURNING paid_credits",
        [order.credits, order.user_id]
      );
      await client.query(
        `INSERT INTO credit_transactions (user_id, delta, reason, order_id)
         VALUES ($1,$2,'purchase',$3)`,
        [order.user_id, order.credits, order.id]
      );
      order.new_credits = creditsRes.rows[0]?.paid_credits ?? null;
    }

    const updated = await client.query(
      `UPDATE credit_orders
       SET status = $1, admin_note = $2, reviewed_by = $3, reviewed_at = now()
       WHERE id = $4
       RETURNING *`,
      [status, note || null, adminId, orderId]
    );
    await client.query("COMMIT");
    return { order: { ...order, ...updated.rows[0] } };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getCreditOrderSummary(userId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'awaiting_payment')::int AS awaiting_payment,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
       COALESCE(SUM(credits) FILTER (WHERE status = 'approved'), 0)::int AS approved_credits
     FROM credit_orders WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}
