const { connectMongo } = require('../lib/mongo');
const { ImageLike } = require('../lib/models');
const { getVisitorKey } = require('../lib/visitorKey');

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
  const visitorKey = getVisitorKey(req);

  await ImageLike.updateOne(
    { filename: imageKey },
    { $setOnInsert: { filename: imageKey, likes: 0, likedBy: [] } },
    { upsert: true }
  );

  const updated = await ImageLike.findOneAndUpdate(
    { filename: imageKey, likedBy: { $ne: visitorKey } },
    { $inc: { likes: 1 }, $addToSet: { likedBy: visitorKey } },
    { new: true }
  );

  if (updated) {
    return res.status(200).json({ success: true, liked: true, likes: updated.likes });
  }

  const existing = await ImageLike.findOne({ filename: imageKey }).lean();
  res.status(200).json({
    success: true,
    liked: false,
    alreadyLiked: true,
    likes: existing?.likes || 0,
  });
};
