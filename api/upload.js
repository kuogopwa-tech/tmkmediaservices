import cloudinary from "../../lib/cloudinary";

export const config = {
  api: {
    bodyParser: false, // important for file uploads
  },
};

import formidable from "formidable";
const form = formidable({ multiples: false });

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Upload error" });

      const file = files.image;

      const cloud = await cloudinary.uploader.upload(file.filepath, {
        folder: "tmk_gallery",
      });

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
  });
}
