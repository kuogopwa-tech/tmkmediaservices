import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Image ID required" });

  const likes = await kv.incr(`likes:${id}`);

  res.status(200).json({ success: true, likes });
}
