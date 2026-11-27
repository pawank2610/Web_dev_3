const crypto = require('crypto');
const mongoose = require('mongoose');
const Link = require('../models/Link');
const Click = require('../models/Click');
const User = require('../models/User');

const generateShortCode = (length = 7) => {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
};

const getGuestUser = async () => {
  let guest = await User.findOne({ email: 'guest@shortlink.io' });
  if (!guest) {
    guest = await User.create({
      name: 'Guest Explorer',
      email: 'guest@shortlink.io',
      password: crypto.randomBytes(16).toString('hex'),
      role: 'user',
    });
  }
  return guest;
};

const publicShorten = async (req, res, next) => {
  try {
    const { originalUrl, alias } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Original URL is required',
      });
    }

    let targetUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let shortCode;

    if (alias && alias.trim()) {
      const cleanedAlias = alias.trim().toLowerCase();
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(cleanedAlias)) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias must be between 3 and 30 alphanumeric characters (- and _ allowed)',
        });
      }

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

    const guestUser = await getGuestUser();

    const newLink = await Link.create({
      originalUrl: targetUrl,
      shortCode,
      alias: alias ? alias.trim().toLowerCase() : null,
      createdBy: guestUser._id,
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

const createLink = async (req, res, next) => {
  try {
    const { originalUrl, alias, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Original URL is required',
      });
    }

    let targetUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let shortCode;

    if (alias && alias.trim()) {
      const cleanedAlias = alias.trim().toLowerCase();
      if (!/^[a-zA-Z0-9-_]{3,30}$/.test(cleanedAlias)) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias must be between 3 and 30 alphanumeric characters (- and _ allowed)',
        });
      }

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
      count: linksWithUrls.length,
      links: linksWithUrls,
    });
  } catch (error) {
    next(error);
  }
};

const getLinkById = async (req, res, next) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found or unauthorized',
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

const deleteLink = async (req, res, next) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found or unauthorized',
      });
    }

    await Link.deleteOne({ _id: link._id });
    await Click.deleteMany({ linkId: link._id });

    res.status(200).json({
      success: true,
      message: 'Link and associated click records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getLinkAnalytics = async (req, res, next) => {
  try {
    const linkId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid link ID format',
      });
    }

    const link = await Link.findById(linkId);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    if (link.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this link',
      });
    }

    const targetLinkId = new mongoose.Types.ObjectId(linkId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clicksByDay = await Click.aggregate([
      {
        $match: {
          linkId: targetLinkId,
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          clicks: 1,
        },
      },
    ]);

    const clicksByDevice = await Click.aggregate([
      { $match: { linkId: targetLinkId } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          device: '$_id',
          count: 1,
        },
      },
    ]);

    const clicksByBrowser = await Click.aggregate([
      { $match: { linkId: targetLinkId } },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          browser: { $ifNull: ['$_id', 'Unknown'] },
          count: 1,
        },
      },
    ]);

    const clicksByOS = await Click.aggregate([
      { $match: { linkId: targetLinkId } },
      {
        $group: {
          _id: '$os',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          os: { $ifNull: ['$_id', 'Unknown'] },
          count: 1,
        },
      },
    ]);

    const recentClicks = await Click.find({ linkId: targetLinkId })
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
  publicShorten,
  createLink,
  getUserLinks,
  getLinkById,
  deleteLink,
  getLinkAnalytics,
};
