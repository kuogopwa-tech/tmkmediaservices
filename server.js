const express = require('express');
const axios = require('axios');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

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

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// File persistence for likes
const likesFile = path.join(__dirname, 'image-likes.json');

// Load likes from file
function loadImageLikes() {
    try {
        if (fs.existsSync(likesFile)) {
            const data = fs.readFileSync(likesFile, 'utf8');
            return JSON.parse(data) || {};
        }
    } catch (error) {
        console.error('Error loading image likes:', error);
    }
    return {};
}

// Save likes to file
function saveImageLikes(likes) {
    try {
        const data = JSON.stringify(likes, null, 2);
        fs.writeFileSync(likesFile, data, 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving image likes:', error);
        return false;
    }
}

// Initialize imageLikes from file (REMOVED DUPLICATE DECLARATION)
let imageLikes = loadImageLikes();
let visitorCount = 0;
let totalLikes = 0;
let ratings = [];
let ratingSum = 0;

// TEST ROUTE
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// COUNTER API - FIXED
app.get('/api/counter', (req, res) => {
    try {
        visitorCount++;
        
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

app.post('/api/counter', (req, res) => {
    try {
        const { action, value } = req.body;
        
        if (action === 'like') {
            totalLikes++;
        } else if (action === 'rate' && value) {
            ratings.push(Number(value));
            ratingSum += Number(value);
        }
        
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

// GALLERY API
app.get('/api/gallery', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to read uploads folder' });
        }

        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        const images = imageFiles.map(file => ({
            name: file,
            url: `/uploads/${file}`,
            likes: imageLikes[file] || 0
        }));

        console.log('📸 Sending gallery data:', images.length, 'images');
        res.json(images);
    });
});

// LIKE API - WITH FILE PERSISTENCE
app.post('/api/gallery/like', (req, res) => {
    try {
        const { filename } = req.body;

        if (!filename) {
            return res.status(400).json({ 
                success: false, 
                message: 'Filename required' 
            });
        }

        // Initialize if doesn't exist, then increment
        if (!imageLikes[filename]) {
            imageLikes[filename] = 0;
        }
        imageLikes[filename] += 1;

        // Save to file
        saveImageLikes(imageLikes);

        console.log(`❤️ Like recorded for ${filename}: ${imageLikes[filename]} likes`);

        res.json({ 
            success: true, 
            likes: imageLikes[filename],
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

// Password file path
const passwordFile = path.join(__dirname, 'admin-password.json');

// Function to load password from file
function loadAdminPassword() {
    try {
        if (fs.existsSync(passwordFile)) {
            const data = fs.readFileSync(passwordFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.password || "tmk@2025"; // Default fallback
        }
    } catch (error) {
        console.error('Error loading admin password:', error);
    }
    return "tmk@2025"; // Default password
}

// Function to save password to file
function saveAdminPassword(newPassword) {
    try {
        const data = JSON.stringify({ password: newPassword, updated: new Date().toISOString() });
        fs.writeFileSync(passwordFile, data, 'utf8');
        console.log('✅ Admin password saved to file');
        return true;
    } catch (error) {
        console.error('Error saving admin password:', error);
        return false;
    }
}

// Initialize admin password
let adminPassword = loadAdminPassword();
console.log('🔐 Admin password loaded:', adminPassword ? 'Set' : 'Using default');

// Updated authentication routes
app.post('/api/auth', (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.json({ authenticated: false, message: 'Password required' });
        }

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

// Updated change password route
app.post('/api/auth/change-password', (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: 'Both current and new password are required' });
        }

        // Verify current password
        if (currentPassword !== adminPassword) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }

        if (newPassword.length < 4) {
            return res.json({ success: false, message: 'New password must be at least 4 characters' });
        }

        // Update password in memory
        adminPassword = newPassword;
        
        // Save to file for persistence
        const saved = saveAdminPassword(newPassword);
        
        if (saved) {
            console.log('🔐 Admin password changed successfully');
            res.json({ success: true, message: 'Password changed successfully' });
        } else {
            res.json({ success: false, message: 'Password changed but failed to save permanently' });
        }
        
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

// Catch-all route for GET requests ONLY - MUST BE LAST
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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