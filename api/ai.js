// api/ai.js — Vercel Serverless Function (CommonJS) con CORS dinámico
const ALLOWED_ORIGINS = [
  "https://filmsleoart.com",          // ⇐ pon aquí tu dominio real (con https)
  "https://www.filmsleoart.com",
  "http://localhost:3000"               // opcional para pruebas locales
];

function setCors(req, res) {
  const origin = req.headers.origin || "";
  const allow =
    ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")
      ? origin
      : null;

  // si quieres permitir cualquier origen temporalmente, descomenta la línea de abajo:
  const allow = "*";

  if (allow) {
    res.setHeader("Access-Control-Allow-Origin", allow);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

module.exports = async (req, res) => {
  setCors(req, res);

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Healthcheck
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
    if (prompt.length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

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

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return res.status(500).json({ error: `OpenAI error: ${text}` });
    }

    const data = await aiRes.json();
    const result =
      data.choices?.[0]?.message?.content ??
      data.output_text ??
      "";

    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
};
