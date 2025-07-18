const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

const apiKey = process.env.YOUTUBE_API_KEY;
const channelId = process.env.CHANNEL_ID;

// Serve static files from the "public" directory
app.use(express.static('public'));

// API endpoint to get latest videos from YouTube
app.get('/api/videos', async (req, res) => {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: apiKey,
          channelId: channelId,
          part: 'snippet',
          order: 'date',
          maxResults: 5
        }
      }
    );
    res.json(response.data.items);
  } catch (error) {
    console.error('Failed to fetch YouTube videos:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
});

// Fallback to index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});