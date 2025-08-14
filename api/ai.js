// api/ai.js  — Vercel Serverless Function (CommonJS, limpio)
const ALLOWED_ORIGIN = "filmsleoart.com"; // ← en producción cámbialo a tu dominio WP: "https://tu-dominio.com"

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Healthcheck (para abrir en el navegador)
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "AI endpoint online" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const system = body.system || "";
    const prompt = body.prompt || "";

    const key = process.env.OPENAI_API_KEY; // asegúrate del nombre EXACTO en Vercel
    if (!key) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    if (prompt.length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

    // Llamada a OpenAI (Chat Completions)
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
