import { Router } from "express";
import { authRequired, requireVerified } from "../middlewares/auth.js";
import { rateLimit } from "express-rate-limit";
import { callGemini, cleanText } from "../services/gemini.service.js";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT", message: "Trop de demandes IA. Réessayez plus tard." } }
});

function asString(v) {
  return typeof v === "string" ? v : "";
}

function buildContext({ filename, title, category, description, text }) {
  const context = [];
  if (title) context.push(`Titre: ${title}`);
  if (filename) context.push(`Nom du fichier: ${filename}`);
  if (category) context.push(`Catégorie: ${category}`);
  if (description) context.push(`Description: ${description}`);
  if (text) context.push(`Extrait: ${cleanText(text, 1200)}`);
  return context.join("\n");
}

function handleAiError(error, res) {
  if (error?.code === "AI_NOT_CONFIGURED") return res.status(503).json({ error: { code: error.code, message: error.message } });
  if (error?.code) return res.status(502).json({ error: { code: error.code, message: error.message } });
  console.error("AI route error:", error);
  return res.status(500).json({ error: { code: "AI_ERROR", message: "Erreur IA" } });
}

router.post("/generate-description", authRequired, requireVerified, aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const context = buildContext(body);
    const prompt = `Génère une description détaillée et utile en français pour ce document dans une bibliothèque numérique.\n\n${context}\n\nRègles:\n- Longueur: 80 à 150 mots\n- 2 à 4 phrases claires et cohérentes\n- Décris le contenu probable, les thèmes abordés et l'intérêt pour les lecteurs\n- Si tu vois "cours", "TD", "TP", "examen", "corrigé", "rapport", "mémoire", précise-le\n- Ne commence pas par "Ce document", "Il s'agit de", "Ce fichier"\n- Évite les formules trop génériques comme "document intéressant"\n- Pas de guillemets, pas d'emojis\n- Réponds UNIQUEMENT avec la description.`;
    const description = await callGemini(prompt, { temperature: 0.5, maxOutputTokens: 260, thinkingBudget: 0 });
    return res.json({ description: cleanText(description.replace(/^["']|["']$/g, ""), 1200) });
  } catch (error) {
    return handleAiError(error, res);
  }
});

router.post("/suggest-metadata", authRequired, requireVerified, aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const context = buildContext(body);
    const prompt = `Suggère des métadonnées pour ce document de bibliothèque.\n\n${context}\n\nRéponds UNIQUEMENT en JSON valide avec ce format exact:\n{"title":"...","category":"...","tags":["...","..."]}\n\nRègles:\n- title: clair et court (max 80 caractères)\n- category: une seule parmi Éducation, Littérature, Science, Histoire, physique-chimie, Art, Société, Petite Enfance, Philosophie, Géographie, Politique, Sport, Divertissement, Santé, Cours, TD / TP, Examens / Annales, Rapports / Mémoires, Administration\n- tags: 3 à 6 mots-clés pertinents, sans #, en français si possible\n- si incertain, choisis la catégorie la plus plausible`;
    const text = await callGemini(prompt, { temperature: 0.2, maxOutputTokens: 180, thinkingBudget: 0 });
    let parsed = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch {
      parsed = null;
    }
    const title = cleanText(parsed?.title || asString(body.title) || "", 120);
    const category = cleanText(parsed?.category || asString(body.category) || "", 60);
    const tags = Array.isArray(parsed?.tags)
      ? parsed.tags.map((t) => cleanText(t, 40)).filter(Boolean).slice(0, 8)
      : [];
    return res.json({ title, category, tags });
  } catch (error) {
    return handleAiError(error, res);
  }
});

router.post("/improve-description", authRequired, requireVerified, aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const description = asString(body.description).trim();
    if (!description) return res.status(400).json({ error: { code: "MISSING_DESCRIPTION", message: "Description requise" } });
    const context = buildContext(body);
    const prompt = `Améliore cette description de document pour une bibliothèque numérique, en gardant le sens.\n\n${context}\nDescription actuelle:\n${description}\n\nRègles:\n- 80 à 150 mots\n- 2 à 4 phrases\n- Plus clair, plus utile, plus fluide\n- Conserve les informations importantes\n- Pas de guillemets, pas d'emojis\n- Réponds UNIQUEMENT avec la description améliorée.`;
    const improved = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 260, thinkingBudget: 0 });
    return res.json({ description: cleanText(improved.replace(/^["']|["']$/g, ""), 1200) });
  } catch (error) {
    return handleAiError(error, res);
  }
});

router.post("/summarize", aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const context = buildContext(body);
    if (!context) return res.status(400).json({ error: { code: "MISSING_CONTEXT", message: "Contexte requis" } });
    const prompt = `Fais un résumé court et utile de ce document pour affichage sur sa fiche.\n\n${context}\n\nRègles:\n- 2 à 3 phrases maximum\n- 35 à 70 mots\n- Très clair, factuel, sans remplissage\n- Réponds UNIQUEMENT avec le résumé.`;
    const summary = await callGemini(prompt, { temperature: 0.3, maxOutputTokens: 120, thinkingBudget: 0 });
    return res.json({ summary: cleanText(summary.replace(/^["']|["']$/g, ""), 500) });
  } catch (error) {
    return handleAiError(error, res);
  }
});

router.post("/translate", aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const text = asString(body.text).trim();
    const target = asString(body.target).trim().toLowerCase() || "en";
    if (!text) return res.status(400).json({ error: { code: "MISSING_TEXT", message: "Texte requis" } });
    const allowed = new Set(["en", "fr", "es", "de", "pt", "it"]);
    const targetLang = allowed.has(target) ? target : "en";
    const prompt = `Traduis ce texte en ${targetLang} de façon naturelle et fidèle.\n\nTexte:\n${text}\n\nRéponds UNIQUEMENT avec la traduction.`;
    const translation = await callGemini(prompt, { temperature: 0.2, maxOutputTokens: 400, thinkingBudget: 0 });
    return res.json({ translation: cleanText(translation.replace(/^["']|["']$/g, ""), 5000), target: targetLang });
  } catch (error) {
    return handleAiError(error, res);
  }
});

router.post("/enhance-search", aiLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const q = asString(body.q).trim();
    if (!q) return res.status(400).json({ error: { code: "MISSING_QUERY", message: "Requête requise" } });
    const prompt = `Améliore cette requête de recherche pour une bibliothèque de documents.\n\nRequête: ${q}\n\nRéponds UNIQUEMENT en JSON valide:\n{"query":"...","keywords":["..."]}\n\nRègles:\n- query: version plus claire et pertinente (max 80 caractères)\n- keywords: 2 à 5 mots-clés utiles, sans #`;
    const text = await callGemini(prompt, { temperature: 0.2, maxOutputTokens: 120, thinkingBudget: 0 });
    let parsed = null;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : text);
    } catch {
      parsed = null;
    }
    return res.json({
      query: cleanText(parsed?.query || q, 120),
      keywords: Array.isArray(parsed?.keywords) ? parsed.keywords.map((k) => cleanText(k, 40)).filter(Boolean).slice(0, 6) : []
    });
  } catch (error) {
    return handleAiError(error, res);
  }
});

export default router;
