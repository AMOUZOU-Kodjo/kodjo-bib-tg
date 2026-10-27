import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { query } from "../config/db.js";

function getToken(req) {
  return req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
}

function verifyUserToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  if (!payload.id) throw new Error("Token utilisateur invalide");
  return payload;
}

export function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next();
  try {
    req.user = verifyUserToken(token);
  } catch (err) {
    req.user = null;
  }
  next();
}

export function authRequired(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    req.user = verifyUserToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token invalide" } });
  }
}

export async function requireVerified(req, res, next) {
  try {
    const result = await query("SELECT email_verified, role FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Utilisateur introuvable" } });
    }
    req.user.emailVerified = result.rows[0].email_verified;
    req.user.role = result.rows[0].role;
    if (!result.rows[0].email_verified) {
      return res.status(403).json({ error: { code: "EMAIL_NOT_VERIFIED", message: "Vérification de l'e-mail requise" } });
    }
    next();
  } catch (err) {
    next(err);
  }
}
