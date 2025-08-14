// api/ai.js — Vercel Serverless Function (CommonJS)
const ALLOWED_ORIGIN = "https://filmsleoart.com"; // your WP domain

module.exports = async (req, res) => {
  // --- CORS (always set, even on errors) ---
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end(); // Preflight OK

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "AI endpoint online" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system = "", prompt = "" } = req.body || {};
    const key = process.env.OPENAI_API_KEY;
    if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    if (prompt.length < 3) return res.status(400).json({ error: "Prompt too short" });

const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ]
  })
});

let data, txt;
if (!aiRes.ok) {
  // Intenta leer JSON de error
  txt = await aiRes.text();
  try { data = JSON.parse(txt); } catch { /* ignore */ }

  const code = data?.error?.code || data?.error?.type || aiRes.status;
  if (String(code).includes("insufficient_quota")) {
    return res.status(402).json({
      error: "Your OpenAI account has no active credits. Please add billing/credits and try again."
    });
  }
  return res.status(500).json({ error: `OpenAI error (${code}): ${txt}` });
}

data = await aiRes.json();
const result = data.choices?.[0]?.message?.content ?? "";
return res.status(200).json({ result });

  }
};
