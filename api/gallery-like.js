const { connectMongo } = require('../lib/mongo');
const { ImageLike } = require('../lib/models');

module.exports = async function handler(req, res) {
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

  await connectMongo();
  const updated = await ImageLike.findOneAndUpdate(
    { filename: imageKey },
    { $inc: { likes: 1 } },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, likes: updated.likes });
};
