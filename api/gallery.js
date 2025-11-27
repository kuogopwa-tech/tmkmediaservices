import cloudinary from "../../lib/cloudinary";

export default async function handler(req, res) {
  try {
    const result = await cloudinary.search
      .expression("folder:tmk_gallery")
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    const images = result.resources.map(img => ({
      id: img.public_id,
      url: img.secure_url,
      format: img.format,
      width: img.width,
      height: img.height,
      likes: 0 // move likes to a KV storage next
    }));

    res.status(200).json(images);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
}
