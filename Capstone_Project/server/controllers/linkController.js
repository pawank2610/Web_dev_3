const crypto = require('crypto');
const mongoose = require('mongoose');
const Link = require('../models/Link');
const Click = require('../models/Click');

/**
 * Generate cryptographic random alphanumeric short code
 */
const generateShortCode = (length = 7) => {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
};

/**
 * @desc    Create a new short link (random crypto code or custom alias)
 * @route   POST /api/links
 * @access  Private
 */
const createLink = async (req, res, next) => {
  try {
    const { originalUrl, alias, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Original URL is required',
      });
    }

    // Ensure valid URL prefix
    let targetUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let shortCode;

    if (alias && alias.trim()) {
      const cleanedAlias = alias.trim().toLowerCase();
      // Validate alias format (alphanumeric, dashes, underscores)
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(cleanedAlias)) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias must be between 3 and 30 alphanumeric characters (- and _ allowed)',
        });
      }

      // Check if alias or shortCode is already taken
      const existing = await Link.findOne({
        $or: [{ shortCode: cleanedAlias }, { alias: cleanedAlias }],
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `The alias "${cleanedAlias}" is already taken. Please choose another.`,
        });
      }

      shortCode = cleanedAlias;
    } else {
      // Generate unique crypto short code
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        shortCode = generateShortCode(6);
        const exists = await Link.findOne({ shortCode });
        if (!exists) {
          isUnique = true;
        }
        attempts++;
      }
    }

    // Expiration date
    let expirationDate = null;
    if (expiresAt) {
      const exp = new Date(expiresAt);
      if (isNaN(exp.getTime()) || exp <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiration date must be a valid future date/time',
        });
      }
      expirationDate = exp;
    }

    const newLink = await Link.create({
      originalUrl: targetUrl,
      shortCode,
      alias: alias ? alias.trim().toLowerCase() : null,
      createdBy: req.user._id,
      expiresAt: expirationDate,
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(201).json({
      success: true,
      message: 'Short link created successfully',
      link: {
        ...newLink.toObject(),
        shortUrl: `${baseUrl}/${newLink.shortCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all links created by the authenticated user
 * @route   GET /api/links
 * @access  Private
 */
const getUserLinks = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { createdBy: req.user._id };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { originalUrl: searchRegex },
        { shortCode: searchRegex },
        { alias: searchRegex },
      ];
    }

    const links = await Link.find(query).sort({ createdAt: -1 });
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const linksWithUrls = links.map((link) => ({
      ...link.toObject(),
      shortUrl: `${baseUrl}/${link.shortCode}`,
      isExpired: link.isExpired(),
    }));

    res.status(200).json({
      success: true,
      count: links.length,
      links: linksWithUrls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single link details by ID
 * @route   GET /api/links/:id
 * @access  Private
 */
const getLinkById = async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Verify ownership or admin access
    if (
      link.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this link',
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      link: {
        ...link.toObject(),
        shortUrl: `${baseUrl}/${link.shortCode}`,
        isExpired: link.isExpired(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a link & associated click records
 * @route   DELETE /api/links/:id
 * @access  Private
 */
const deleteLink = async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    // Check ownership or admin
    if (
      link.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own links',
      });
    }

    await Link.findByIdAndDelete(link._id);
    await Click.deleteMany({ linkId: link._id });

    res.status(200).json({
      success: true,
      message: 'Link and associated analytics deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get comprehensive analytics for a link using MongoDB Aggregation Pipelines
 * @route   GET /api/links/:id/analytics
 * @access  Private
 *
 * MANDATORY REQUIREMENT: Aggregation Pipeline by day & by device type
 */
const getLinkAnalytics = async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    if (
      link.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view analytics for your own links',
      });
    }

    const linkObjectId = new mongoose.Types.ObjectId(link._id);

    // 1. Aggregation Pipeline: Clicks grouped by Day (YYYY-MM-DD)
    const clicksByDay = await Click.aggregate([
      { $match: { linkId: linkObjectId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          clicks: 1,
          _id: 0,
        },
      },
    ]);

    // 2. Aggregation Pipeline: Clicks grouped by Device Type (Mobile, Desktop, Tablet, Other)
    const clicksByDevice = await Click.aggregate([
      { $match: { linkId: linkObjectId } },
      {
        $group: {
          _id: '$deviceType',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      {
        $project: {
          device: '$_id',
          clicks: 1,
          _id: 0,
        },
      },
    ]);

    // 3. Aggregation Pipeline: Clicks grouped by Browser
    const clicksByBrowser = await Click.aggregate([
      { $match: { linkId: linkObjectId } },
      {
        $group: {
          _id: '$browser',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      {
        $project: {
          browser: '$_id',
          clicks: 1,
          _id: 0,
        },
      },
    ]);

    // 4. Aggregation Pipeline: Clicks grouped by Operating System
    const clicksByOS = await Click.aggregate([
      { $match: { linkId: linkObjectId } },
      {
        $group: {
          _id: '$os',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      {
        $project: {
          os: '$_id',
          clicks: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Recent Clicks (last 10 events)
    const recentClicks = await Click.find({ linkId: linkObjectId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('-__v');

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      link: {
        id: link._id,
        originalUrl: link.originalUrl,
        shortCode: link.shortCode,
        alias: link.alias,
        shortUrl: `${baseUrl}/${link.shortCode}`,
        totalClicks: link.clicksCount,
        isBlocked: link.isBlocked,
        blockReason: link.blockReason,
        expiresAt: link.expiresAt,
        isExpired: link.isExpired(),
        createdAt: link.createdAt,
      },
      analytics: {
        clicksByDay,
        clicksByDevice,
        clicksByBrowser,
        clicksByOS,
        recentClicks,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLink,
  getUserLinks,
  getLinkById,
  deleteLink,
  getLinkAnalytics,
};
