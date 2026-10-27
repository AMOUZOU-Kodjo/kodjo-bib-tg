import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: "RATE_LIMIT", message: "Trop de tentatives, réessayez plus tard" } }
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  skipFailedRequests: true,
  message: { error: { code: "RATE_LIMIT", message: "Limite de messages atteinte" } }
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: { code: "RATE_LIMIT", message: "Limite d'upload atteinte" } }
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
