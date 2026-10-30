import webpush from "web-push";
import { query } from "../config/db.js";
import { config } from "../config/env.js";

let pushReady = false;
if (config.push.publicKey && config.push.privateKey) {
  try {
    webpush.setVapidDetails(config.push.subject, config.push.publicKey, config.push.privateKey);
    pushReady = true;
  } catch (err) {
    console.error("Configuration Web Push invalide:", err.message);
  }
}

function clean(value, maxLength = 160) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function isPushConfigured() {
  return pushReady;
}

export function getPushPublicKey() {
  return pushReady ? config.push.publicKey : null;
}

async function sendPushToSubscriptions(subscriptions, payload) {
  if (!pushReady || subscriptions.length === 0) return;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]).catch(() => {});
        } else {
          console.error("Échec de l'envoi push:", err.message);
        }
      }
    })
  );
}

export async function sendPushToUser(userId, payload) {
  if (!pushReady) return;
  const subs = await query("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1", [userId]);
  await sendPushToSubscriptions(subs.rows, payload);
}

async function sendPushToUsers(userIds, payload) {
  if (!pushReady || userIds.length === 0) return;
  const subs = await query(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ANY($1::uuid[])",
    [userIds]
  );
  await sendPushToSubscriptions(subs.rows, payload);
}

export async function createNotification({ userId, type, title, message, link, actorId = null, documentId = null }) {
  const res = await query(
    `INSERT INTO notifications (user_id, type, title, message, link, actor_id, document_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, type, title, message, link, read_at, created_at`,
    [userId, type, clean(title), clean(message, 300) || null, link || null, actorId, documentId]
  );
  sendPushToUser(userId, { title: res.rows[0].title, body: res.rows[0].message, url: link || "/" }).catch((err) => {
    console.error("Échec du push de notification:", err.message);
  });
  return res.rows[0];
}

export async function notifyFollowersNewDocument({ documentId }) {
  const docRes = await query(
    `SELECT d.id, d.title, d.visibility, d.owner_id, u.display_name AS author_name
     FROM documents d JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1`,
    [documentId]
  );
  if (docRes.rows.length === 0) return;
  const doc = docRes.rows[0];
  if (doc.visibility !== "public") return;

  const inserted = await query(
    `INSERT INTO notifications (user_id, type, title, message, link, actor_id, document_id)
     SELECT f.follower_id, 'new_document', $1, $2, $3, $4, $5
     FROM follows f
     WHERE f.author_id = $4
     RETURNING user_id`,
    [
      `Nouveau document de ${doc.author_name}`,
      doc.title,
      `/documents/${doc.id}`,
      doc.owner_id,
      doc.id
    ]
  );

  const userIds = inserted.rows.map((row) => row.user_id);
  await sendPushToUsers(userIds, {
    title: `Nouveau document de ${doc.author_name}`,
    body: doc.title,
    url: `/documents/${doc.id}`
  });
}

export async function notifyDocumentComment({ documentId, actorId }) {
  const docRes = await query(
    `SELECT d.owner_id, d.title, u.display_name AS actor_name
     FROM documents d JOIN users u ON u.id = $2
     WHERE d.id = $1`,
    [documentId, actorId]
  );
  if (docRes.rows.length === 0) return;
  const doc = docRes.rows[0];
  if (!doc.owner_id || String(doc.owner_id) === String(actorId)) return;

  await createNotification({
    userId: doc.owner_id,
    type: "new_comment",
    title: "Nouveau commentaire",
    message: `${doc.actor_name} a commenté « ${doc.title} »`,
    link: `/documents/${documentId}#comments`,
    actorId,
    documentId
  });
}

export async function notifyNewFollower({ authorId, followerId }) {
  if (String(authorId) === String(followerId)) return;
  const followerRes = await query("SELECT display_name FROM users WHERE id = $1", [followerId]);
  if (followerRes.rows.length === 0) return;
  await createNotification({
    userId: authorId,
    type: "new_follower",
    title: "Nouvel abonné",
    message: `${followerRes.rows[0].display_name} vous suit`,
    link: `/authors/${followerId}`,
    actorId: followerId
  });
}

export async function notifyReportUpdate({ reportId }) {
  const reportRes = await query(
    `SELECT r.reporter_id, r.document_id, r.comment_id, r.status
     FROM reports r WHERE r.id = $1`,
    [reportId]
  );
  if (reportRes.rows.length === 0) return;
  const report = reportRes.rows[0];
  if (!report.reporter_id || report.status === "pending") return;

  const label = report.status === "resolved" ? "traité" : "classé sans suite";
  await createNotification({
    userId: report.reporter_id,
    type: "report_update",
    title: "Mise à jour de votre signalement",
    message: `Votre signalement a été ${label}.`,
    link: report.document_id ? `/documents/${report.document_id}` : null,
    documentId: report.document_id
  });
}
