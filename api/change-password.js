const { connectMongo } = require('../lib/mongo');
const { Admin } = require('../lib/models');

module.exports = async function handler(req, res) {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword)
    return res.json({ success: false, message: 'Both fields required' });

  await connectMongo();
  const admin = await Admin.findById('main').lean();
  const adminPassword = admin?.password || 'tmk@2025';

  if (currentPassword !== adminPassword)
    return res.json({ success: false, message: 'Current password wrong' });

  if (newPassword.length < 4)
    return res.json({ success: false, message: 'Password too short' });

  await Admin.findByIdAndUpdate('main', { password: newPassword }, { upsert: true });

  res.json({ success: true, message: 'Password updated' });
};
