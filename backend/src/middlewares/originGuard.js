import { config } from "../config/env.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const allowedOrigins = new Set(
  [config.frontendUrl, ...(process.env.FRONTEND_ORIGINS || "").split(",")]
    .map(normalizeOrigin)
    .filter(Boolean)
);

function getRequestOrigin(req) {
  const origin = normalizeOrigin(req.get("origin"));
  if (origin) return origin;
  const referer = req.get("referer");
  if (!referer) return null;
  return normalizeOrigin(referer);
}

export function originGuard(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();
  if (/^Bearer\s+/i.test(req.headers.authorization || "")) return next();

  const requestOrigin = getRequestOrigin(req);
  if (requestOrigin && allowedOrigins.has(requestOrigin)) return next();

  return res.status(403).json({
    error: {
      code: "ORIGIN_NOT_ALLOWED",
      message: "Origine de la requête non autorisée"
    }
  });
}
