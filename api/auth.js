const { connectMongo } = require('../lib/mongo');
const { Admin } = require('../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ authenticated: false, message: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.json({ authenticated: false, message: 'Password required' });
  }

  try {
    await connectMongo();
    const admin = await Admin.findById('main').lean();
    const adminPassword = admin?.password || 'tmk@2025';

    if (password === adminPassword) {
      return res.json({ authenticated: true });
    }

    res.json({ authenticated: false, message: 'Incorrect password' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ authenticated: false, message: 'Authentication failed' });
  }
};
