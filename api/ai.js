// api/ai.js  — Vercel Serverless Function (CommonJS)
const ALLOWED_ORIGIN = "*"; // cámbialo luego a tu dominio WP

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET = healthcheck rápido en el navegador
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "AI endpoint online" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, prompt } = req.body || {};
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }
    if (!prompt || String(prompt).length < 3) {
      return res.status(400).json({ error: "Prompt too short" });
    }

    // Llamada mínima a OpenAI (Responses API moderna)
    const fetchRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system || "" },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!fetchRes.ok) {
      const text = await fetchRes.text();
      return res.status(500).json({ error: `OpenAI error: ${text}` });
    }

    const data = await fetchRes.json();
    const result =
      data.choices?.[0]?.message?.content ??
      data.output_text ??
      JSON.stringify(data);

    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
};
