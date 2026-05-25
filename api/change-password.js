const { connectMongo } = require('../lib/mongo');
const { Admin } = require('../lib/models');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.'
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must include at least one letter and one number.'
      });
    }

    await connectMongo();
    const admin = await Admin.findById('main').lean();
    const adminPassword = admin?.password || 'tmk@2025';

    if (currentPassword !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    await Admin.findByIdAndUpdate('main', { password: newPassword }, { upsert: true });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to change password right now. Please try again later.'
    });
  }
};
