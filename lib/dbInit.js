const fs = require('fs');
const path = require('path');
const { connectMongo, mongoose } = require('./mongo');
const { ImageLike, Counter, Admin } = require('./models');

const likesFile = path.join(__dirname, '..', 'image-likes.json');
const passwordFile = path.join(__dirname, '..', 'admin-password.json');

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed reading ${filePath}:`, e);
    return null;
  }
}

async function initDbFromFilesIfNeeded() {
  // Counter singleton
    const counter = await Counter.findById('main').lean();
  if (!counter) {
    await Counter.create({ _id: 'main', visits: 0, totalLikes: 0, ratings: [], ratingSum: 0 });
  }


  // Admin singleton
  const admin = await Admin.findById('main').lean();
  if (!admin) {
    const parsed = safeReadJson(passwordFile);
    const password = parsed?.password || 'tmk@2025';
    await Admin.create({ _id: 'main', password });
  }

  // Likes: migrate from image-likes.json if DB is empty
  const likeCount = await ImageLike.countDocuments({});
  if (likeCount === 0) {
    const parsed = safeReadJson(likesFile);
    if (parsed && typeof parsed === 'object') {
      const docs = Object.entries(parsed).map(([filename, likes]) => ({
        filename,
        likes: Number(likes) || 0,
      }));
      if (docs.length) {
        await ImageLike.insertMany(docs);
      }
    }
  }
}

async function connectAndInit() {
  await connectMongo();
  await initDbFromFilesIfNeeded();
}

module.exports = {
  connectAndInit,
  mongoose,
};

