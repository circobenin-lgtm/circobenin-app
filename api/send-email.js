export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, from, subject, html } = req.body;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data });
    res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
