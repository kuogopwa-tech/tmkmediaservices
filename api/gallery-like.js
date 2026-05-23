import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Frontend sends: { filename }
  // Keep backward compatibility: also accept { id }
  const { filename, id } = req.body || {};
  const imageKey = id ?? filename;

  if (!imageKey) {
    return res.status(400).json({ error: "Image filename/id required" });
  }

  const likes = await kv.incr(`likes:${imageKey}`);

  res.status(200).json({ success: true, likes });
}
