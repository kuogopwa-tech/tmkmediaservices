// pages/api/gallery.js
import cloudinary from '../../lib/cloudinary';

export default async function handler(req, res) {
    try {
        const result = await cloudinary.search
            .expression("folder:tmk_gallery")
            .sort_by("created_at", "desc")
            .max_results(100)
            .execute();

        const images = result.resources.map(img => ({
            id: img.public_id,
            url: cloudinary.url(img.public_id, { width: 300, height: 300, crop: 'fill', gravity: 'auto', fetch_format: 'auto', quality: 'auto' }),
            width: img.width,
            height: img.height,
            likes: 0
        }));

        res.status(200).json(images);
    } catch (err) {
        console.error('❌ Cloudinary gallery error:', err);
        res.status(500).json({ error: "Failed to fetch gallery" });
    }
}
