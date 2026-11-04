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

    const prompt = `Génère une description courte en français pour un document de bibliothèque.

${context.join("\n")}

Fais une description entre 40 et 80 caractères, en 1 phrase simple. 
Sois direct et précis. 
N'utilise pas de guillemets, pas d'emojis, pas de préfixe comme "Ce document". 
Réponds uniquement par le texte de la description.`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 40
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
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
