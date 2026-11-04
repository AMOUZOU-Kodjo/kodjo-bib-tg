import { Router } from "express";
import { authRequired, requireVerified } from "../middlewares/auth.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT", message: "Trop de demandes. Réessayez plus tard." } }
});

router.post("/generate-description", authRequired, requireVerified, aiLimiter, async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: { code: "AI_NOT_CONFIGURED", message: "Service IA non configuré" } });
    }

    const { filename, title, category, text } = req.body || {};
    const context = [];
    if (title) context.push(`Titre proposé: ${title}`);
    if (filename) context.push(`Nom du fichier: ${filename}`);
    if (category) context.push(`Catégorie: ${category}`);
    if (text && typeof text === "string" && text.trim()) {
      const excerpt = text.trim().replace(/\s+/g, " ").slice(0, 1500);
      context.push(`Extrait du contenu: ${excerpt}`);
    }

    const prompt = `Tu es un rédacteur pour une bibliothèque de documents. Génère une description courte, claire et utile en français pour aider les utilisateurs à comprendre de quoi traite ce document.

Règles:
- Maximum 200 caractères
- 1-2 phrases
- Ne pas utiliser de guillemets, emojis ou hashtags
- Ne pas inventer d'informations non présentes
- Être factuel et concis
- Si peu d'informations, fais une description neutre basée sur le nom de fichier

Contexte:
${context.join("\n")}

Réponds uniquement avec la description, sans explication.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 100
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", errText);
      return res.status(502).json({ error: { code: "AI_ERROR", message: "Échec de génération" } });
    }

    const data = await response.json();
    const description = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().replace(/\n+/g, " ").replace(/^["']|["']$/g, "");
    
    if (!description) {
      return res.status(502).json({ error: { code: "AI_EMPTY", message: "Aucune description générée" } });
    }

    return res.json({ description: description.slice(0, 500) });
  } catch (error) {
    next(error);
  }
});

export default router;
