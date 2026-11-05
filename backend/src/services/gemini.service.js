const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("Service IA non configuré");
    error.status = 503;
    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 250,
      ...(options.thinkingBudget === 0 ? { thinkingConfig: { thinkingBudget: 0 } } : {})
    }
  };

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini error:", errText);
    const error = new Error("Échec de génération");
    error.status = 502;
    error.code = "AI_ERROR";
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!text) {
    const error = new Error("Aucune réponse générée");
    error.status = 502;
    error.code = "AI_EMPTY";
    throw error;
  }
  return text;
}

export function cleanText(text, max = 5000) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, max);
}
