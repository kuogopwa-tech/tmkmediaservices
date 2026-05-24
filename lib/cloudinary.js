const { v2: cloudinary } = require('cloudinary');

// Cloudinary config is required for server-side searches.
// If any of these env vars are missing, Cloudinary calls will fail (often with 401).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
