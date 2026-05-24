const crypto = require('crypto');

function getVisitorKey(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : (forwardedFor || req.ip || req.socket?.remoteAddress || '').split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || '';

  return crypto
    .createHash('sha256')
    .update(`${ip}|${userAgent}`)
    .digest('hex');
}

module.exports = {
  getVisitorKey,
};
