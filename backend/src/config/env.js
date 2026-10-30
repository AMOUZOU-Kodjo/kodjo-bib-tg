import dotenv from "dotenv";
dotenv.config();

function nonNegativeInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME || "Archives"
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    channelId: process.env.TELEGRAM_CHANNEL_ID || "@kodjobibtg"
  },
  push: {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || "mailto:contact@archives.local"
  },
  contactEmail: process.env.CONTACT_EMAIL || process.env.BREVO_SENDER_EMAIL || null,
  maxFileSizeMb: positiveNumber(process.env.MAX_FILE_SIZE_MB, 10),
  creditsInitiaux: nonNegativeInt(process.env.CREDITS_INITIAUX, 0),
  creditsParUpload: nonNegativeInt(process.env.CREDITS_PAR_UPLOAD, 2),
  publicBrowsing: process.env.PUBLIC_BROWSING !== "false"
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL est requis");
}
if (!config.jwtSecret) {
  throw new Error("JWT_SECRET est requis");
}
if (config.nodeEnv === "production" && String(config.jwtSecret).length < 32) {
  throw new Error("JWT_SECRET doit contenir au moins 32 caractères en production");
}
