export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, prompt } = req.body;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system || "" },
          { role: "user", content: prompt || "" }
        ]
      })
    });

    const data = await aiRes.json();
    res.status(200).json({
      result: data.choices?.[0]?.message?.content || ""
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  res.status(200).json({ message: "AI endpoint funcionando" });
}
