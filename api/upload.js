const cloudinary = require("../lib/cloudinary");
const multer = require("multer");

const config = {
  api: {
    bodyParser: false, // important for file uploads
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function runMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, result => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

function uploadBuffer(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "tmk_gallery" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    await runMiddleware(req, res, upload.single("image"));

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const cloud = await uploadBuffer(req.file);

    return res.status(200).json({
      success: true,
      url: cloud.secure_url,
      public_id: cloud.public_id,
      width: cloud.width,
      height: cloud.height,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = handler;
module.exports.config = config;
