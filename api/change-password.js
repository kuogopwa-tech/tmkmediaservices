import fs from 'fs';
import path from 'path';

const passwordFile = path.join(process.cwd(), 'admin-password.json');

let adminPassword = "tmk@2025";

export default function handler(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.json({ success: false, message: 'Both fields required' });

  if (currentPassword !== adminPassword)
    return res.json({ success: false, message: 'Current password wrong' });

  if (newPassword.length < 4)
    return res.json({ success: false, message: 'Password too short' });

  adminPassword = newPassword;

  fs.writeFileSync(passwordFile, JSON.stringify({ password: newPassword }));

  res.json({ success: true, message: 'Password updated' });
}
