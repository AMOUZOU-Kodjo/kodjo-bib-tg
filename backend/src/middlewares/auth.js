import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import { ensureFeatureSchema, ensureSecuritySchema, query } from "../config/db.js";

function getToken(req) {
  return req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
}

function authError(message) {
  const err = new Error(message);
  err.status = 401;
  err.code = "UNAUTHORIZED";
  return err;
}

function getTokenVersion(payload) {
  const version = Number(payload?.tokenVersion ?? 0);
  return Number.isInteger(version) && version >= 0 ? version : 0;
}

function isAuthError(err) {
  return err?.status === 401 || err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError";
}

async function loadUserFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw authError("Token invalide");
  }
  if (!payload.id) throw authError("Token utilisateur invalide");

  await ensureSecuritySchema();
  await ensureFeatureSchema();
  const result = await query(
    "SELECT id, email, display_name, email_verified, role, token_version FROM users WHERE id = $1",
    [payload.id]
  );
  const user = result.rows[0];
  if (!user) throw authError("Session expirée");
  const tokenVersion = Number(user.token_version ?? 0);
  if (getTokenVersion(payload) !== tokenVersion) throw authError("Session expirée");

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    emailVerified: user.email_verified,
    role: user.role,
    tokenVersion
  };
}

export async function optionalAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next();
  try {
    req.user = await loadUserFromToken(token);
  } catch (err) {
    if (!isAuthError(err)) return next(err);
    req.user = null;
  }
  return next();
}

export async function authRequired(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Authentification requise" } });
    req.user = await loadUserFromToken(token);
    return next();
  } catch (err) {
    if (!isAuthError(err)) return next(err);
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Token invalide" } });
  }
}

export async function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Utilisateur introuvable" } });
  }
  if (!req.user.emailVerified) {
    return res.status(403).json({ error: { code: "EMAIL_NOT_VERIFIED", message: "Vérification de l'e-mail requise" } });
  }
  return next();
}
