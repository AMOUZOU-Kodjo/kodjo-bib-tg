import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ensureSecuritySchema, query } from "../config/db.js";
import { config } from "../config/env.js";
import { authRequired } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimit.js";
import { sendEmail, generateCode, hashCode } from "../services/email.service.js";
import { buildVerificationEmail } from "../services/emailTemplates.js";
import { ensureInitialCredits } from "../services/credits.service.js";
import { getSettings } from "../services/settings.service.js";

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    await ensureSecuritySchema();
    next();
  } catch (err) {
    next(err);
  }
});

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    email_verified: user.email_verified,
    credits: user.credits ?? 0,
    role: user.role
  };
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    if (password.length < 8) return res.status(400).json({ error: { code: "WEAK_PASSWORD", message: "Mot de passe trop court" } });
    const exists = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length > 0) return res.status(400).json({ error: { code: "EMAIL_EXISTS", message: "Cet e-mail est déjà utilisé" } });
    const passwordHash = await bcrypt.hash(password, 10);
    const { creditsInitiaux, siteName } = await getSettings();
    const userRes = await query(
      "INSERT INTO users (email, display_name, password_hash, credits) VALUES ($1,$2,$3,$4) RETURNING id, email, display_name, email_verified, role",
      [email.toLowerCase(), displayName, passwordHash, creditsInitiaux]
    );
    const user = userRes.rows[0];
    if (creditsInitiaux > 0) {
      await query("INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1,$2,'initial')", [user.id, creditsInitiaux]);
    }
    const code = generateCode();
    const codeHash = hashCode(code);
    await query(
      "INSERT INTO email_codes (user_id, purpose, code_hash, expires_at) VALUES ($1,'verify_email',$2, now() + interval '15 minutes')",
      [user.id, codeHash]
    );
    let emailSent = true;
    try {
      const content = buildVerificationEmail({
        code,
        displayName: user.display_name,
        email: user.email,
        siteName
      });
      await sendEmail({
        to: user.email,
        toName: user.display_name,
        subject: `Votre code de vérification - ${siteName}`,
        html: content.html,
        text: content.text
      });
    } catch (e) {
      emailSent = false;
      if (config.nodeEnv !== "production") {
        console.log("[DEV] CODE VERIFICATION", user.email, "->", code);
      }
    }
    res.json({
      ok: true,
      emailSent,
      message: emailSent
        ? "Compte créé. Vérifiez votre e-mail."
        : "Compte créé, mais l'e-mail de vérification n'a pas pu être envoyé. Utilisez « Renvoyer le code »."
    });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-email", authLimiter, async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    const userRes = await query("SELECT id, email, display_name, email_verified, role, credits, token_version FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    const user = userRes.rows[0];
    const codeRes = await query(
      "SELECT id, code_hash, attempts, expires_at, used_at FROM email_codes WHERE user_id = $1 AND purpose = 'verify_email' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [user.id]
    );
    if (codeRes.rows.length === 0) return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    const c = codeRes.rows[0];
    if (new Date(c.expires_at) < new Date()) return res.status(400).json({ error: { code: "EXPIRED_CODE", message: "Code expiré" } });
    if (c.attempts >= 5) return res.status(400).json({ error: { code: "TOO_MANY_ATTEMPTS", message: "Trop de tentatives" } });
    if (hashCode(code) !== c.code_hash) {
      await query("UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1", [c.id]);
      return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    }
    await query("UPDATE email_codes SET used_at = now() WHERE id = $1", [c.id]);
    await query("UPDATE users SET email_verified = true WHERE id = $1", [user.id]);
    await ensureInitialCredits(user.id);
    const creditsRes = await query("SELECT credits FROM users WHERE id = $1", [user.id]);
    user.email_verified = true;
    user.credits = creditsRes.rows[0]?.credits ?? 0;
    const token = jwt.sign({ id: user.id, email: user.email, displayName: user.display_name, emailVerified: true, role: user.role, tokenVersion: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.cookie("token", token, { httpOnly: true, sameSite: config.nodeEnv === "production" ? "none" : "lax", secure: config.nodeEnv === "production" });
    return res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/resend-code", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    const userRes = await query("SELECT id, email, display_name, email_verified FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.json({ ok: true });
    const user = userRes.rows[0];
    if (user.email_verified) return res.json({ ok: true });
    const last = await query("SELECT created_at FROM email_codes WHERE user_id = $1 AND purpose = 'verify_email' ORDER BY created_at DESC LIMIT 1", [user.id]);
    if (last.rows.length > 0) {
      const diff = (Date.now() - new Date(last.rows[0].created_at).getTime()) / 1000;
      if (diff < 60) return res.status(429).json({ error: { code: "RATE_LIMIT", message: "Attendez avant de renvoyer un code" } });
    }
    const code = generateCode();
    const codeHash = hashCode(code);
    await query("INSERT INTO email_codes (user_id, purpose, code_hash, expires_at) VALUES ($1,'verify_email',$2, now() + interval '15 minutes')", [user.id, codeHash]);
    const { siteName } = await getSettings();
    try {
      const content = buildVerificationEmail({
        code,
        displayName: user.display_name,
        email: user.email,
        siteName
      });
      await sendEmail({
        to: user.email,
        toName: user.display_name,
        subject: `Nouveau code de vérification - ${siteName}`,
        html: content.html,
        text: content.text
      });
    } catch (e) {
      if (config.nodeEnv !== "production") {
        console.log("[DEV] CODE RENVOYÉ", user.email, "->", code);
      }
      return res.status(502).json({
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Impossible d'envoyer le code de vérification. Réessayez dans un instant."
        }
      });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    const userRes = await query("SELECT id, email, display_name, password_hash, email_verified, role, credits, token_version FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Identifiants invalides" } });
    const user = userRes.rows[0];
    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Identifiants invalides" } });
    if (!user.email_verified) {
      return res.status(403).json({ error: { code: "EMAIL_NOT_VERIFIED", message: "Vérification de l'e-mail requise", email: user.email } });
    }
    const token = jwt.sign({ id: user.id, email: user.email, displayName: user.display_name, emailVerified: true, role: user.role, tokenVersion: user.token_version }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.cookie("token", token, { httpOnly: true, sameSite: config.nodeEnv === "production" ? "none" : "lax", secure: config.nodeEnv === "production" });
    res.json({ ok: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authRequired, (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: config.nodeEnv === "production" ? "none" : "lax",
    secure: config.nodeEnv === "production"
  });
  res.json({ ok: true });
});

router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    const userRes = await query("SELECT id, email, display_name FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.json({ ok: true });
    const user = userRes.rows[0];
    const code = generateCode();
    const codeHash = hashCode(code);
    await query("INSERT INTO email_codes (user_id, purpose, code_hash, expires_at) VALUES ($1,'reset_password',$2, now() + interval '15 minutes')", [user.id, codeHash]);
    try {
      await sendEmail({ to: user.email, subject: "Réinitialisation du mot de passe", html: `<p>Votre code : <strong>${code}</strong></p>` });
    } catch (e) {
      if (config.nodeEnv !== "production") {
        console.log("[DEV] CODE RESET MOT DE PASSE", user.email, "->", code);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) return res.status(400).json({ error: { code: "MISSING_FIELDS", message: "Champs manquants" } });
    if (password.length < 8) return res.status(400).json({ error: { code: "WEAK_PASSWORD", message: "Mot de passe trop court" } });
    const userRes = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (userRes.rows.length === 0) return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    const user = userRes.rows[0];
    const codeRes = await query("SELECT id, code_hash, attempts, expires_at, used_at FROM email_codes WHERE user_id = $1 AND purpose = 'reset_password' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1", [user.id]);
    if (codeRes.rows.length === 0) return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    const c = codeRes.rows[0];
    if (new Date(c.expires_at) < new Date()) return res.status(400).json({ error: { code: "EXPIRED_CODE", message: "Code expiré" } });
    if (c.attempts >= 5) return res.status(400).json({ error: { code: "TOO_MANY_ATTEMPTS", message: "Trop de tentatives" } });
    if (hashCode(code) !== c.code_hash) {
      await query("UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1", [c.id]);
      return res.status(400).json({ error: { code: "INVALID_CODE", message: "Code invalide" } });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await query("UPDATE email_codes SET used_at = now() WHERE id = $1", [c.id]);
    await query("UPDATE users SET password_hash = $1, token_version = token_version + 1 WHERE id = $2", [passwordHash, user.id]);
    res.clearCookie("token", { httpOnly: true, sameSite: config.nodeEnv === "production" ? "none" : "lax", secure: config.nodeEnv === "production" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const userRes = await query("SELECT id, email, display_name, email_verified, credits, role FROM users WHERE id = $1", [req.user.id]);
    res.json({ user: userRes.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
