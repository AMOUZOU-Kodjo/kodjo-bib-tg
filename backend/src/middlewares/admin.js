import { query } from "../config/db.js";

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    }
    const result = await query("SELECT role FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Accès administrateur requis" } });
    }
    req.user.role = result.rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
}
