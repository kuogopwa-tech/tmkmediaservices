const { connectMongo } = require('../lib/mongo');
const { Admin } = require('../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ authenticated: false, message: 'Method not allowed' });
  }

  const password = String(req.body?.password || '').trim();

  if (!password) {
    return res.status(400).json({
      authenticated: false,
      message: 'Please enter your admin password.'
    });
  }

  try {
    await connectMongo();
    const admin = await Admin.findById('main').lean();
    const adminPassword = admin?.password || 'tmk@2025';

    if (password === adminPassword) {
      return res.json({ authenticated: true });
    }

    return res.status(401).json({
      authenticated: false,
      message: 'Incorrect password. Please try again.'
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      authenticated: false,
      message: 'Authentication is temporarily unavailable. Please try again.'
    });
  }
};
