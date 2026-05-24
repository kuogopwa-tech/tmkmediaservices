const express = require('express');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const { connectAndInit } = require('./lib/dbInit');
const { ImageLike, Counter, Admin } = require('./lib/models');
const { getVisitorKey } = require('./lib/visitorKey');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

function mountApiFunction(route, handlerPath) {
    const handler = require(handlerPath);
    app.all(route, (req, res) => handler(req, res));
}

// Mirror Vercel serverless functions during local Express development.
mountApiFunction('/api/auth', './api/auth');
mountApiFunction('/api/change-password', './api/change-password');
mountApiFunction('/api/counter', './api/counter');
mountApiFunction('/api/countyer-update', './api/countyer-update');
mountApiFunction('/api/gallery', './api/gallery');
mountApiFunction('/api/gallery-like', './api/gallery-like');
mountApiFunction('/api/gallery/like', './api/gallery/like');
mountApiFunction('/api/upload', './api/upload');
mountApiFunction('/api/videos', './api/videos');
mountApiFunction('/api/chat', './api/chat');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, uniqueSuffix + '-' + originalName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Serve uploaded files statically (legacy; Cloudinary will be primary)
app.use('/uploads', express.static(uploadsDir));


// MongoDB persistence replaces file-based + in-memory counters
let visitorCount = 0;
let totalLikes = 0;
let ratings = [];
let ratingSum = 0;

async function refreshCounterCache() {
    const doc = await Counter.findById('main').lean();
    if (doc) {
        visitorCount = doc.visits || 0;
        totalLikes = doc.totalLikes || 0;
        ratings = doc.ratings || [];
        ratingSum = doc.ratingSum || 0;
    }
}

// Connect DB before handling requests
connectAndInit()
    .then(async () => {
        await refreshCounterCache();

        app.listen(PORT, () => {


            console.log(`🚀 Server is running on http://localhost:${PORT}`);
            console.log(`📁 Uploads directory: ${uploadsDir}`);
            console.log(`🔍 Test route: http://localhost:${PORT}/test`);
            console.log(`📤 Upload route: http://localhost:${PORT}/upload`);
            console.log('\n📋 Available API endpoints:');
            console.log('   GET  /api/videos');
            console.log('   GET  /api/gallery');
            console.log('   POST /api/gallery/like');
            console.log('   GET  /api/counter');
            console.log('   POST /api/counter');
            console.log('   POST /api/auth');
            console.log('   POST /upload');
        });
    })
    .catch(err => {
        console.error('❌ MongoDB initialization failed:', err);
        process.exit(1);
    });



// TEST ROUTE
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// COUNTER API (MongoDB-backed)
app.get('/api/counter', async (req, res) => {
    try {
        // increment visits in DB, then return cached values
        await Counter.findByIdAndUpdate(
            'main',
            { $inc: { visits: 1 } },
            { upsert: true, new: true }
        );

        await refreshCounterCache();

        const avgRating = ratings.length > 0 ? (ratingSum / ratings.length).toFixed(1) : 0;

        res.json({
            visits: visitorCount,
            likes: totalLikes,
            avgRating: avgRating,
            ratings: ratings.length
        });
    } catch (error) {
        console.error('Counter error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch counter data',
            visits: visitorCount,
            likes: totalLikes,
            avgRating: 0,
            ratings: 0
        });
    }
});

app.post('/api/counter', async (req, res) => {
    try {
        const { action, value } = req.body;

        if (action === 'like') {
            await Counter.findByIdAndUpdate(
                'main',
                { $inc: { totalLikes: 1 } },
                { upsert: true, new: true }
            );
        } else if (action === 'rate' && value) {
            const num = Number(value);
            if (!Number.isNaN(num)) {
                await Counter.findByIdAndUpdate(
                    'main',
                    { $push: { ratings: num }, $inc: { ratingSum: num } },
                    { upsert: true, new: true }
                );
            }
        }

        await refreshCounterCache();

        const avgRating = ratings.length > 0 ? (ratingSum / ratings.length).toFixed(1) : 0;

        res.json({
            success: true,
            visits: visitorCount,
            likes: totalLikes,
            avgRating: avgRating,
            ratings: ratings.length
        });
    } catch (error) {
        console.error('Counter update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update counter' });
    }
});


// GALLERY API (Cloudinary images + MongoDB likes)
app.get('/api/gallery', async (req, res) => {
    try {
        const cloudinary = require('./lib/cloudinary');

        const result = await cloudinary.search
            .expression('folder:tmk_gallery')
            .sort_by('created_at', 'desc')
            .max_results(100)
            .execute();

        const images = (result.resources || []).map(img => ({
            name: img.public_id, // used as identifier for likes in MongoDB
            url: cloudinary.url(img.public_id, {
                width: 300,
                height: 300,
                crop: 'fill',
                gravity: 'auto',
                fetch_format: 'auto',
                quality: 'auto',
            }),
            likes: 0
        }));

        const ids = images.map(i => i.name);
        const docs = await ImageLike.find({ filename: { $in: ids } }).lean();
        const likeMap = new Map(docs.map(d => [d.filename, d.likes || 0]));

        for (const img of images) {
            img.likes = likeMap.get(img.name) || 0;
        }

        console.log('📸 Sending Cloudinary gallery data:', images.length, 'images');
        res.json(images);
    } catch (err) {
        console.error('Gallery fetch error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
    }
});





// LIKE API (MongoDB)
app.post('/api/gallery/like', async (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ 
                success: false, 
                message: 'Filename required' 
            });
        }

        const visitorKey = getVisitorKey(req);

        await ImageLike.updateOne(
            { filename },
            { $setOnInsert: { filename, likes: 0, likedBy: [] } },
            { upsert: true }
        );

        const updated = await ImageLike.findOneAndUpdate(
            { filename, likedBy: { $ne: visitorKey } },
            { $inc: { likes: 1 }, $addToSet: { likedBy: visitorKey } },
            { new: true }
        );

        if (!updated) {
            const existing = await ImageLike.findOne({ filename }).lean();
            return res.json({
                success: true,
                liked: false,
                alreadyLiked: true,
                likes: existing?.likes || 0,
                filename: filename
            });
        }

        console.log(`❤️ Like recorded for ${filename}: ${updated?.likes || 0} likes`);

        res.json({ 
            success: true, 
            liked: true,
            likes: updated?.likes || 0,
            filename: filename
        });
    } catch (error) {
        console.error('Like API error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update like' 
        });
    }
});


// --- Admin auth via MongoDB ---
let adminPassword = null;

async function refreshAdminPasswordCache() {
    const doc = await Admin.findById('main').lean();
    adminPassword = doc?.password || 'tmk@2025';
}

app.post('/api/auth', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.json({ authenticated: false, message: 'Password required' });
        }

        await refreshAdminPasswordCache();

        if (password === adminPassword) {
            res.json({ authenticated: true });
        } else {
            res.json({ authenticated: false, message: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ authenticated: false, message: 'Authentication failed' });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: 'Both current and new password are required' });
        }

        await refreshAdminPasswordCache();

        if (currentPassword !== adminPassword) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }

        if (newPassword.length < 4) {
            return res.json({ success: false, message: 'New password must be at least 4 characters' });
        }

        await Admin.findByIdAndUpdate('main', { password: newPassword }, { upsert: true, new: true });

        console.log('✅ Admin password changed successfully');
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});


// UPLOAD ROUTE
app.post('/upload', upload.single('image'), (req, res) => {
    console.log('Upload endpoint hit!');
    console.log('File received:', req.file);
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('File uploaded successfully:', req.file.filename);
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                path: `/uploads/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed: ' + error.message
        });
    }
});

// YouTube API route - WITH ENHANCED DEBUGGING
app.get('/api/videos', async (req, res) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const channelId = process.env.CHANNEL_ID;

        console.log('🔍 YouTube API Debug:');
        console.log('   API Key present:', !!apiKey);
        console.log('   Channel ID:', channelId);

        if (!apiKey || !channelId) {
            console.log('❌ Missing YouTube API configuration');
            return res.status(500).json({ 
                error: "Missing API key or channel ID",
                items: []
            });
        }

        const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`;
        console.log('   API URL:', apiUrl.replace(apiKey, 'HIDDEN_API_KEY'));

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: apiKey,
                channelId: channelId,
                part: 'snippet,id',
                order: 'date',
                maxResults: 5,
                type: 'video'  // Added to only get videos
            }
        });

        console.log('✅ YouTube API Response Status:', response.status);
        console.log('✅ Response data:', {
            totalResults: response.data.pageInfo?.totalResults,
            itemsCount: response.data.items?.length
        });

        if (!response.data.items || response.data.items.length === 0) {
            console.log('❌ No videos found in API response');
            return res.json([]); // Return empty array instead of error
        }

        const videos = response.data.items
  .filter(item => item.id?.videoId) // ensure videoId exists
  .map(item => ({
    id: item.id.videoId,
    snippet: {
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      channelTitle: item.snippet.channelTitle
    }
  }));

        console.log(`✅ Successfully processed ${videos.length} videos`);
        res.json(videos);

    } catch (err) {
        console.error('❌ YouTube API Error Details:');
        console.error('   Error message:', err.message);
        console.error('   Response status:', err.response?.status);
        console.error('   Response data:', err.response?.data);
        
        // More specific error handling
        if (err.response?.status === 403) {
            console.error('   ❌ API Key might be invalid or restricted');
        } else if (err.response?.status === 404) {
            console.error('   ❌ Channel not found');
        }
        
        // Fallback to mock data with your actual channel info
        const mockVideos = [
            {
                id: 'yohaDfeacFw',
                snippet: {
                    title: 'TMK Media Services - Professional Event Coverage',
                    description: 'Your trusted partner for weddings, burials, and corporate events in Kenya',
                    publishedAt: new Date().toISOString(),
                    channelTitle: 'TMK Media Services',
                    thumbnails: {
                        default: {
                            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
                            width: 120,
                            height: 90
                        }
                    }
                }
            },
            {
                id: 'b07VhbWdq3Q',
                snippet: {
                    title: 'Live Streaming & Video Services - TMK Media',
                    description: 'Professional live streaming, photography, and video services for all events',
                    publishedAt: new Date().toISOString(),
                    channelTitle: 'TMK Media Services',
                    thumbnails: {
                        default: {
                            url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/default.jpg',
                            width: 120,
                            height: 90
                        }
                    }
                }
            }
        ];
        
        console.log('🔄 Using fallback mock data');
        res.json(mockVideos);
    }
});
// Debug route to check YouTube API configuration
app.get('/api/debug/youtube', (req, res) => {
    res.json({
        hasApiKey: !!process.env.YOUTUBE_API_KEY,
        hasChannelId: !!process.env.CHANNEL_ID,
        apiKeyLength: process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.length : 0,
        channelId: process.env.CHANNEL_ID
    });
});

// Multer error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next();
});

// NOTE: We keep the catch-all at the very end.

// You already have these endpoints implemented above:
//   - GET/POST /api/counter
//   - GET /api/gallery
//   - POST /api/gallery/like
//   - POST /api/auth
//   - POST /api/auth/change-password
//   - GET /api/videos
//   - POST /upload
//
// Vercel still uses the files in /api/* directly; local Express mounts them above
// so local testing follows the deployed API behavior.

// Catch-all route for GET requests ONLY - MUST BE LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
