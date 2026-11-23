const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenHelper');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Assign role (can default to user; supports admin if specified for initial setup)
    const userRole = role === 'admin' ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });

    // Generate Tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Store refreshToken in DB
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

/**
 * @desc    Authenticate user & get tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // Find user (with password)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate Tokens
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id });

    // Save refresh token
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

/**
 * @desc    Renew access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public (Requires valid refresh token)
 */
const refreshSession = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please log in again.',
      });
    }

    // Find user by id and matching refreshToken in DB
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not recognized or revoked',
      });
    }

    // Issue new access token
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user & invalidate refresh token
 * @route   POST /api/auth/logout
 * @access  Private
 */
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

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
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
  refreshSession,
  logout,
  getMe,
};
