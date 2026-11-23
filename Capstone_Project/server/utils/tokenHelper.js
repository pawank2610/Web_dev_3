const jwt = require('jsonwebtoken');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_123', {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123', {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_123');
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_123');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
