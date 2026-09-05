// Vercel Serverless Function: POST /api/subscribe  { email }
// Adds/updates the subscriber in beehiiv and stamps a custom field "waitlist" = "yes".
// Custom fields (unlike UTM source) DO update on existing subscribers, so this catches everyone.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PUB_ID = process.env.BEEHIIV_PUB_ID;
  const API_KEY = process.env.BEEHIIV_API_KEY;

  if (!PUB_ID || !API_KEY) {
    return res.status(500).json({ error: "Server not configured" });
  }

  let email = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    email = (body?.email || "").trim();
  } catch (_) {
    return res.status(400).json({ error: "Bad request" });
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    const r = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          utm_source: "waitlist_letter",
          custom_fields: [
            { name: "waitlist", value: "yes" }
          ],
        }),
      }
    );

    if (r.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const text = await r.text();
      return res.status(502).json({ error: "beehiiv error: " + text });
    }
  } catch (err) {
    return res.status(502).json({ error: "request failed: " + String(err) });
  }
}
