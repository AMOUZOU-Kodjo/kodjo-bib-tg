import dotenv from "dotenv";
dotenv.config();

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
  contactEmail: process.env.CONTACT_EMAIL || process.env.BREVO_SENDER_EMAIL || "phipsipy@gmail.com",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 10),
  creditsInitiaux: Number(process.env.CREDITS_INITIAUX || 0),
  creditsParUpload: Number(process.env.CREDITS_PAR_UPLOAD || 2),
  publicBrowsing: process.env.PUBLIC_BROWSING !== "false"
};
