import express from "express";
import { ensureFeatureSchema, pool, query } from "../config/db.js";
import { notifyReportUpdate } from "../services/notificationCenter.service.js";
import { authRequired } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { getSettings, saveSettings } from "../services/settings.service.js";
import { deleteRaw, deletePreview, getDocumentThumbnailUrl } from "../services/cloudinary.service.js";

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function audit(req, action, targetType, targetId = null, details = null) {
  try {
    await query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user.id, action, targetType, targetId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error("Échec de l'écriture du journal d'audit:", err.message);
  }
}

router.use(authRequired, requireAdmin);

// Site settings
router.get("/settings", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const siteName = String(req.body.siteName ?? "").replace(/[\r\n\t]+/g, " ").trim();
    const contactEmail = String(req.body.contactEmail ?? "").trim();
    const creditsInitiaux = Number(req.body.creditsInitiaux);
    const creditsParUpload = Number(req.body.creditsParUpload);
    const maxUploadSizeMb = Number(req.body.maxUploadSizeMb);

    if (siteName.length < 1 || siteName.length > 60) {
      return res.status(400).json({ error: { code: "INVALID_SITE_NAME", message: "Le nom du site doit contenir entre 1 et 60 caractères" } });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return res.status(400).json({ error: { code: "INVALID_EMAIL", message: "Adresse e-mail de contact invalide" } });
    }
    if (!Number.isInteger(creditsInitiaux) || creditsInitiaux < 0 || creditsInitiaux > 1000) {
      return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits initiaux doivent être un entier entre 0 et 1000" } });
    }
    if (!Number.isInteger(creditsParUpload) || creditsParUpload < 0 || creditsParUpload > 1000) {
      return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits par dépôt doivent être un entier entre 0 et 1000" } });
    }
    if (!Number.isInteger(maxUploadSizeMb) || maxUploadSizeMb < 1 || maxUploadSizeMb > 100) {
      return res.status(400).json({ error: { code: "INVALID_MAX_FILE_SIZE", message: "La taille maximale doit être un entier entre 1 et 100 Mo" } });
    }

    const settings = await saveSettings({ siteName, contactEmail, creditsInitiaux, creditsParUpload, maxUploadSizeMb });
    await audit(req, "settings.update", "settings", null, { siteName, contactEmail, creditsInitiaux, creditsParUpload, maxUploadSizeMb });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

// Dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const usersCount = await query("SELECT COUNT(*) FROM users");
    const docsCount = await query("SELECT COUNT(*) FROM documents");
    const downloadsCount = await query("SELECT SUM(download_count) as total FROM documents");
    const commentsCount = await query("SELECT COUNT(*) FROM comments");
    res.json({
      stats: {
        users: parseInt(usersCount.rows[0].count),
        documents: parseInt(docsCount.rows[0].count),
        downloads: parseInt(downloadsCount.rows[0].total) || 0,
        comments: parseInt(commentsCount.rows[0].count)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Activity analytics
router.get("/analytics", async (req, res, next) => {
  try {
    const requestedDays = Number(req.query.days);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const seriesRes = await query(
      `WITH days AS (
         SELECT generate_series((CURRENT_DATE - ($1::int - 1)), CURRENT_DATE, interval '1 day')::date AS day
       )
       SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
              COALESCE(u.total, 0)::int AS users,
              COALESCE(d.total, 0)::int AS documents,
              COALESCE(dl.total, 0)::int AS downloads,
              COALESCE(c.total, 0)::int AS comments
       FROM days
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*)::int AS total
         FROM users WHERE created_at >= CURRENT_DATE - ($1::int - 1)
         GROUP BY 1
       ) u ON u.day = days.day
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*)::int AS total
         FROM documents WHERE created_at >= CURRENT_DATE - ($1::int - 1)
         GROUP BY 1
       ) d ON d.day = days.day
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*)::int AS total
         FROM downloads WHERE created_at >= CURRENT_DATE - ($1::int - 1)
         GROUP BY 1
       ) dl ON dl.day = days.day
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*)::int AS total
         FROM comments WHERE created_at >= CURRENT_DATE - ($1::int - 1)
         GROUP BY 1
       ) c ON c.day = days.day
       ORDER BY days.day`,
      [days]
    );

    const [storageRes, topDocsRes, reportsRes] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS documents,
                COALESCE(SUM(size_bytes), 0)::bigint AS total_size,
                COALESCE(ROUND(AVG(size_bytes)), 0)::bigint AS average_size,
                COUNT(*) FILTER (WHERE visibility = 'public')::int AS public_documents,
                COUNT(*) FILTER (WHERE visibility = 'private')::int AS private_documents
         FROM documents`
      ),
      query(
        `SELECT d.id, d.title, d.visibility, d.view_count, d.download_count, d.like_count, d.comment_count,
                u.display_name AS author_name
         FROM documents d
         JOIN users u ON u.id = d.owner_id
         ORDER BY (d.view_count + d.download_count * 2 + d.like_count * 3) DESC, d.created_at DESC
         LIMIT 5`
      ),
      query("SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending FROM reports")
    ]);

    const series = seriesRes.rows.map((row) => ({
      date: row.date,
      users: Number(row.users),
      documents: Number(row.documents),
      downloads: Number(row.downloads),
      comments: Number(row.comments)
    }));
    const totals = series.reduce(
      (acc, row) => ({
        users: acc.users + row.users,
        documents: acc.documents + row.documents,
        downloads: acc.downloads + row.downloads,
        comments: acc.comments + row.comments
      }),
      { users: 0, documents: 0, downloads: 0, comments: 0 }
    );
    const storage = storageRes.rows[0];

    res.json({
      analytics: {
        days,
        series,
        totals,
        storage: {
          documents: Number(storage.documents),
          totalBytes: Number(storage.total_size),
          averageBytes: Number(storage.average_size),
          publicDocuments: Number(storage.public_documents),
          privateDocuments: Number(storage.private_documents)
        },
        pendingReports: Number(reportsRes.rows[0].pending),
        topDocuments: topDocsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

function csvCell(value) {
  const raw = Array.isArray(value) ? value.join(" | ") : value === null || value === undefined ? "" : String(value);
  const text = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(headers, rows) {
  const lines = [headers.map(([, label]) => csvCell(label)).join(",")];
  for (const row of rows) {
    lines.push(headers.map(([key]) => csvCell(row[key])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

const EXPORTS = {
  users: {
    filename: "utilisateurs",
    query: `SELECT id, email, display_name, role, credits, email_verified,
                   to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at
            FROM users ORDER BY created_at DESC`,
    headers: [["id", "ID"], ["email", "E-mail"], ["display_name", "Nom"], ["role", "Rôle"], ["credits", "Crédits"], ["email_verified", "E-mail vérifié"], ["created_at", "Inscrit le"]]
  },
  documents: {
    filename: "documents",
    query: `SELECT d.id, d.title, u.display_name AS author_name, u.email AS author_email,
                   d.category, array_to_string(d.tags, ' | ') AS tags, d.visibility, d.size_bytes,
                   d.view_count, d.download_count, d.like_count, d.comment_count,
                   d.original_filename, to_char(d.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
            FROM documents d JOIN users u ON u.id = d.owner_id
            ORDER BY d.created_at DESC`,
    headers: [["id", "ID"], ["title", "Titre"], ["author_name", "Auteur"], ["author_email", "E-mail auteur"], ["category", "Catégorie"], ["tags", "Tags"], ["visibility", "Visibilité"], ["size_bytes", "Taille (octets)"], ["view_count", "Vues"], ["download_count", "Téléchargements"], ["like_count", "Likes"], ["comment_count", "Commentaires"], ["original_filename", "Fichier"], ["created_at", "Ajouté le"]]
  },
  audit: {
    filename: "journal-audit",
    query: `SELECT to_char(a.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
                   u.display_name AS admin_name, u.email AS admin_email,
                   a.action, a.target_type, a.target_id, a.details::text AS details
            FROM admin_audit_log a LEFT JOIN users u ON u.id = a.admin_id
            ORDER BY a.created_at DESC`,
    headers: [["created_at", "Date"], ["admin_name", "Administrateur"], ["admin_email", "E-mail admin"], ["action", "Action"], ["target_type", "Type de cible"], ["target_id", "ID cible"], ["details", "Détails"]]
  }
};

router.get("/export/:type", async (req, res, next) => {
  try {
    const definition = EXPORTS[req.params.type];
    if (!definition) {
      return res.status(400).json({ error: { code: "INVALID_EXPORT", message: "Type d'export invalide" } });
    }
    const result = await query(definition.query);
    const csv = buildCsv(definition.headers, result.rows);
    const date = new Date().toISOString().slice(0, 10);
    await audit(req, "export.download", "export", null, { type: req.params.type, rows: result.rowCount });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${definition.filename}-${date}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// Get all users
router.get("/users", async (req, res, next) => {
  try {
    const users = await query(
      "SELECT id, email, display_name, email_verified, credits, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users: users.rows });
  } catch (err) {
    next(err);
  }
});

// Update user role, credits or verification status
router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant utilisateur invalide" } });
    }
    const { role, credits, email_verified } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ error: { code: "INVALID_ROLE", message: "Rôle invalide" } });
      }
      if (req.params.id.toLowerCase() === String(req.user.id).toLowerCase() && role !== "admin") {
        return res.status(400).json({ error: { code: "SELF_DEMOTE", message: "Vous ne pouvez pas retirer votre propre rôle administrateur" } });
      }
      updates.push(`role = $${idx++}`);
      params.push(role);
      updates.push("token_version = token_version + 1");
    }

    if (credits !== undefined) {
      if (!Number.isInteger(credits) || credits < 0 || credits > 1000000) {
        return res.status(400).json({ error: { code: "INVALID_CREDITS", message: "Les crédits doivent être un entier positif" } });
      }
      updates.push(`credits = $${idx++}`);
      params.push(credits);
    }

    if (email_verified !== undefined) {
      if (typeof email_verified !== "boolean") {
        return res.status(400).json({ error: { code: "INVALID_VERIFICATION", message: "Statut de vérification invalide" } });
      }
      updates.push(`email_verified = $${idx++}`);
      params.push(email_verified);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: { code: "NO_CHANGES", message: "Aucune modification fournie" } });
    }

    params.push(req.params.id);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let previousCredits = null;
      if (credits !== undefined) {
        const previous = await client.query("SELECT credits FROM users WHERE id = $1 FOR UPDATE", [req.params.id]);
        if (previous.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } });
        }
        previousCredits = previous.rows[0].credits;
      }
      const result = await client.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx}
         RETURNING id, email, display_name, email_verified, role, credits, created_at`,
        params
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } });
      }
      if (credits !== undefined && credits !== previousCredits) {
        await client.query(
          "INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1,$2,'admin')",
          [req.params.id, credits - previousCredits]
        );
      }
      await client.query("COMMIT");
      await audit(req, "user.update", "user", result.rows[0].id, { role, credits, email_verified });
      res.json({ user: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// Delete a user and their documents
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant utilisateur invalide" } });
    }
    if (req.params.id.toLowerCase() === String(req.user.id).toLowerCase()) {
      return res.status(400).json({ error: { code: "SELF_DELETE", message: "Vous ne pouvez pas supprimer votre propre compte" } });
    }
    const userRes = await query("SELECT id, display_name FROM users WHERE id = $1", [req.params.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable" } });
    }
    const docsRes = await query("SELECT cloudinary_public_id, preview_public_id FROM documents WHERE owner_id = $1", [req.params.id]);
    await Promise.allSettled(
      docsRes.rows.flatMap((doc) => [deleteRaw(doc.cloudinary_public_id), deletePreview(doc.preview_public_id)])
    );
    await query("DELETE FROM users WHERE id = $1", [req.params.id]);
    await audit(req, "user.delete", "user", req.params.id, { display_name: userRes.rows[0].display_name });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Get all documents
router.get("/documents", async (req, res, next) => {
  try {
    const docs = await query(`
      SELECT d.id, d.title, d.description, d.category, d.tags, d.visibility, d.original_filename, d.mime_type,
             d.size_bytes, d.view_count, d.download_count, d.like_count, d.comment_count,
             d.created_at, d.cloudinary_public_id, d.preview_public_id,
             u.display_name as author_name, u.id as owner_id
      FROM documents d
      JOIN users u ON u.id = d.owner_id
      ORDER BY d.created_at DESC
    `);
    const rows = docs.rows.map((row) => {
      let thumbnail = null;
      try {
        thumbnail = getDocumentThumbnailUrl(row.cloudinary_public_id, row.mime_type, row.preview_public_id);
      } catch {
        thumbnail = null;
      }
      const { cloudinary_public_id, preview_public_id, ...doc } = row;
      return { ...doc, thumbnail };
    });
    res.json({ documents: rows });
  } catch (err) {
    next(err);
  }
});

// Audit log
router.get("/audit", async (req, res, next) => {
  try {
    const page = Math.min(Math.max(1, Number(req.query.page) || 1), 10000);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 30), 100);
    const offset = (page - 1) * limit;
    const action = req.query.action ? String(req.query.action).slice(0, 80) : null;
    const [listRes, countRes] = await Promise.all([
      query(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at,
                u.display_name AS admin_name, u.email AS admin_email
         FROM admin_audit_log a
         LEFT JOIN users u ON u.id = a.admin_id
         WHERE ($1::text IS NULL OR a.action = $1)
         ORDER BY a.created_at DESC
         LIMIT $2 OFFSET $3`,
        [action, limit, offset]
      ),
      query(
        "SELECT COUNT(*)::int AS total FROM admin_audit_log WHERE ($1::text IS NULL OR action = $1)",
        [action]
      )
    ]);
    res.json({ entries: listRes.rows, total: countRes.rows[0].total, page, limit });
  } catch (err) {
    next(err);
  }
});

function parseDocumentIds(value) {
  if (!Array.isArray(value)) return null;
  const ids = [...new Set(value.map((id) => String(id).trim().toLowerCase()))];
  if (ids.length === 0 || ids.length > 100) return null;
  if (ids.some((id) => !UUID_RE.test(id))) return null;
  return ids;
}

router.post("/documents/bulk-delete", async (req, res, next) => {
  try {
    const ids = parseDocumentIds(req.body.ids);
    if (!ids) {
      return res.status(400).json({ error: { code: "INVALID_IDS", message: "Sélectionnez entre 1 et 100 documents valides" } });
    }
    const docsRes = await query(
      "SELECT id, title, cloudinary_public_id, preview_public_id FROM documents WHERE id = ANY($1::uuid[])",
      [ids]
    );
    if (docsRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Aucun document trouvé" } });
    }
    await Promise.allSettled(
      docsRes.rows.flatMap((doc) => [deleteRaw(doc.cloudinary_public_id), deletePreview(doc.preview_public_id)])
    );
    const deleted = await query("DELETE FROM documents WHERE id = ANY($1::uuid[]) RETURNING id", [ids]);
    await audit(req, "document.bulk_delete", "document", null, {
      count: deleted.rowCount,
      titles: docsRes.rows.map((doc) => doc.title).slice(0, 20)
    });
    res.json({ ok: true, deleted: deleted.rowCount });
  } catch (err) {
    next(err);
  }
});

router.post("/documents/bulk-visibility", async (req, res, next) => {
  try {
    const ids = parseDocumentIds(req.body.ids);
    const visibility = String(req.body.visibility || "");
    if (!ids) {
      return res.status(400).json({ error: { code: "INVALID_IDS", message: "Sélectionnez entre 1 et 100 documents valides" } });
    }
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: { code: "INVALID_VISIBILITY", message: "Visibilité invalide" } });
    }
    const result = await query(
      `UPDATE documents
       SET visibility = $1,
           share_enabled = CASE WHEN visibility <> $1 THEN false ELSE share_enabled END,
           share_version = CASE WHEN visibility <> $1 THEN share_version + 1 ELSE share_version END
       WHERE id = ANY($2::uuid[])
       RETURNING id`,
      [visibility, ids]
    );
    await audit(req, "document.bulk_visibility", "document", null, { count: result.rowCount, visibility });
    res.json({ ok: true, updated: result.rowCount });
  } catch (err) {
    next(err);
  }
});

// Delete any document
router.delete("/documents/:id", async (req, res, next) => {
  try {
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant document invalide" } });
    }
    const docRes = await query("SELECT cloudinary_public_id, preview_public_id FROM documents WHERE id = $1", [req.params.id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Document introuvable" } });
    }
    await deleteRaw(docRes.rows[0].cloudinary_public_id);
    await deletePreview(docRes.rows[0].preview_public_id);
    await query("DELETE FROM documents WHERE id = $1", [req.params.id]);
    await audit(req, "document.delete", "document", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


// Reports / moderation
router.get("/reports", async (req, res, next) => {
  try {
    await ensureFeatureSchema();
    const status = req.query.status ? String(req.query.status) : null;
    if (status && !["pending", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ error: { code: "INVALID_STATUS", message: "Statut de signalement invalide" } });
    }
    const result = await query(
      `SELECT r.id, r.reason, r.details, r.status, r.created_at, r.resolved_at,
              r.document_id, r.comment_id, cd.id AS comment_document_id,
              reporter.display_name AS reporter_name, reporter.email AS reporter_email,
              COALESCE(d.title, cd.title) AS document_title,
              d.owner_id AS document_owner_id,
              c.content AS comment_content, c.user_id AS comment_author_id,
              cu.display_name AS comment_author_name
       FROM reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN documents d ON d.id = r.document_id
       LEFT JOIN comments c ON c.id = r.comment_id
       LEFT JOIN documents cd ON cd.id = c.document_id
       LEFT JOIN users cu ON cu.id = c.user_id
       WHERE ($1::text IS NULL OR r.status = $1)
       ORDER BY r.created_at DESC
       LIMIT 200`,
      [status]
    );
    res.json({ reports: result.rows });
  } catch (err) {
    next(err);
  }
});

router.patch("/reports/:id", async (req, res, next) => {
  try {
    await ensureFeatureSchema();
    if (!UUID_RE.test(req.params.id)) {
      return res.status(400).json({ error: { code: "INVALID_ID", message: "Identifiant signalement invalide" } });
    }
    const status = String(req.body.status || "");
    if (!["pending", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ error: { code: "INVALID_STATUS", message: "Statut de signalement invalide" } });
    }
    const result = await query(
      `UPDATE reports
       SET status = $1,
           resolved_at = CASE WHEN $1 = 'pending' THEN NULL ELSE now() END,
           resolved_by = CASE WHEN $1 = 'pending' THEN NULL ELSE $2::uuid END
       WHERE id = $3
       RETURNING id, status, resolved_at`,
      [status, req.user.id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Signalement introuvable" } });
    }
    notifyReportUpdate({ reportId: result.rows[0].id }).catch((err) => {
      console.error("Échec de la notification de signalement:", err.message);
    });
    await audit(req, "report.update", "report", result.rows[0].id, { status });
    res.json({ report: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
