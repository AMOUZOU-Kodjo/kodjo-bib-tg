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
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || null,
    endpoint: process.env.R2_ENDPOINT || null,
    bucket: process.env.R2_BUCKET || null,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || null,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || null
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME || "Archives"
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    channelId: process.env.TELEGRAM_CHANNEL_ID || "@kodjobibtg",
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || null,
    newsSyncSecret: process.env.TELEGRAM_NEWS_SYNC_SECRET || "",
    newsMaxPerRun: positiveNumber(process.env.TELEGRAM_NEWS_MAX_PER_RUN, 3)
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || ""
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
  publicBrowsing: process.env.PUBLIC_BROWSING !== "false",
  salesEnabled: process.env.SALES_ENABLED === "true"
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
