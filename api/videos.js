import axios from 'axios';

export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.CHANNEL_ID;

  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: apiKey,
          channelId: channelId,
          part: 'snippet',
          order: 'date',
          maxResults: 5,
        }
      }
    );
    res.status(200).json(response.data.items);
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
}
