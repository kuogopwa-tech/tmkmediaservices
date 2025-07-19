import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.CHANNEL_ID;

  if (!apiKey || !channelId) {
    return res.status(500).json({ error: 'Missing YOUTUBE_API_KEY or CHANNEL_ID' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: apiKey,
        channelId: channelId,
        part: 'snippet',
        order: 'date',
        maxResults: 5
      }
    });

    res.status(200).json(response.data.items);
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
}
