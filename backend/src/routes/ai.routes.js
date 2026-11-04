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

    const prompt = `Tu es un rédacteur expert pour une bibliothèque numérique collaborative. Génère une description pertinente et utile en français.

Contexte:
${context.join("\n")}

Règles strictes:
- Entre 80 et 150 caractères
- 1 phrase maximum, fluide et naturelle
- Décris précisément le contenu probable du document
- Si le nom de fichier contient des mots-clés (cours, TD, TP, examen, rapport, mémoire, corrigé), utilise-les intelligemment
- Ne pas utiliser de guillemets, d'emojis, de hashtags
- Ne pas ajouter "Ce document", "Fichier", "Téléchargez"
- Ne pas inventer d'auteur, de date ou d'établissement
- Réponds UNIQUEMENT avec la description, aucun préfixe, aucun commentaire

Exemples:
- "Cours d'algèbre linéaire avec exercices et applications"
- "TD de physique sur les lois de Newton"
- "Annales d'examen de biologie cellulaire"`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 80,
        topP: 0.9,
        topK: 40
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
