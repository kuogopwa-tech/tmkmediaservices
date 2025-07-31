import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.CHANNEL_ID;

  if (!apiKey || !channelId) {
    return res.status(500).json({ error: "Missing API key or channel ID" });
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items) {
      return res.status(500).json({ error: "No videos found" });
    }

    const videos = data.items
      .filter(item => item.id.kind === "youtube#video")
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title
      }));

    res.status(200).json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
}
