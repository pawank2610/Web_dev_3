const User = require('../models/User');
const Link = require('../models/Link');
const Click = require('../models/Click');
const crypto = require('crypto');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenHelper');

const seedDemoData = async (user) => {
  const existingLinksCount = await Link.countDocuments({ createdBy: user._id });
  if (existingLinksCount > 0) return;

  const sampleLinks = [
    {
      originalUrl: 'https://github.com/facebook/react',
      shortCode: 'react-docs',
      alias: 'react-docs',
      createdBy: user._id,
      clicksCount: 42,
    },
    {
      originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      shortCode: 'viral-video',
      alias: 'viral-video',
      createdBy: user._id,
      clicksCount: 118,
    },
    {
      originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      shortCode: 'js-guide',
      alias: 'js-guide',
      createdBy: user._id,
      clicksCount: 26,
    },
    {
      originalUrl: 'https://www.mongodb.com/docs/manual/aggregation/',
      shortCode: 'mongo-docs',
      alias: 'mongo-docs',
      createdBy: user._id,
      clicksCount: 65,
    },
  ];

  const created = await Link.insertMany(sampleLinks);

  const deviceTypes = ['desktop', 'mobile', 'tablet'];
  const userAgents = {
    desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    tablet: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  };

  const clicksToInsert = [];
  for (const link of created) {
    const clickTotal = link.clicksCount;
    for (let i = 0; i < clickTotal; i++) {
      const randDev = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const daysAgo = Math.floor(Math.random() * 7);
      const clickDate = new Date();
      clickDate.setDate(clickDate.getDate() - daysAgo);

      clicksToInsert.push({
        linkId: link._id,
        userAgent: userAgents[randDev],
        deviceType: randDev,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 250) + 1}`,
        referer: Math.random() > 0.5 ? 'https://google.com' : 'https://twitter.com',
        timestamp: clickDate,
      });
    }
  }

  if (clicksToInsert.length > 0) {
    await Click.insertMany(clicksToInsert);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const userRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const demoLogin = async (req, res, next) => {
  try {
    const { role } = req.body;
    const isTargetAdmin = role === 'admin';

    const demoEmail = isTargetAdmin ? 'admin@shortlink.io' : 'demo@shortlink.io';
    const demoName = isTargetAdmin ? 'Demo Administrator' : 'Demo Power User';
    const demoRole = isTargetAdmin ? 'admin' : 'user';

    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: demoName,
        email: demoEmail,
        password: 'demopassword123',
        role: demoRole,
      });
    } else if (user.role !== demoRole) {
      user.role = demoRole;
      await user.save();
    }

    if (!isTargetAdmin) {
      await seedDemoData(user);
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Logged in as Fast Demo ${demoRole.toUpperCase()}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDemo: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    const googleEmail = (email || 'alex.google@gmail.com').toLowerCase();
    const googleName = name || 'Alex Rivera (Google)';

    let user = await User.findOne({ email: googleEmail });

    if (!user) {
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: googleName,
        email: googleEmail,
        password: generatedPassword,
        role: 'user',
      });
      await seedDemoData(user);
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google Sign-In successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        authProvider: 'google',
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not recognized or revoked',
      });
    }

    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  googleLogin,
  refreshSession,
  logout,
  getMe,
};
