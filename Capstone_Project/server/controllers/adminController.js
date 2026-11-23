const mongoose = require('mongoose');
const Link = require('../models/Link');
const User = require('../models/User');
const Click = require('../models/Click');

const getAllLinks = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { originalUrl: searchRegex },
        { shortCode: searchRegex },
        { alias: searchRegex },
      ];
    }

    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Link.countDocuments(query);

    const links = await Link.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const formattedLinks = links.map((link) => ({
      ...link.toObject(),
      shortUrl: `${baseUrl}/${link.shortCode}`,
      isExpired: link.isExpired(),
    }));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      links: formattedLinks,
    });
  } catch (error) {
    next(error);
  }
};

const updateLinkStatus = async (req, res, next) => {
  try {
    const { isBlocked, blockReason } = req.body;
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found',
      });
    }

    link.isBlocked = isBlocked !== undefined ? Boolean(isBlocked) : link.isBlocked;
    if (blockReason !== undefined) {
      link.blockReason = blockReason.trim();
    }

    await link.save();

    res.status(200).json({
      success: true,
      message: link.isBlocked ? 'Link has been blocked' : 'Link has been unblocked',
      link,
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-refreshToken').sort({ createdAt: -1 });

    const userLinkCounts = await Link.aggregate([
      { $group: { _id: '$createdBy', totalLinks: { $sum: 1 }, totalClicks: { $sum: '$clicksCount' } } },
    ]);

    const countMap = {};
    userLinkCounts.forEach((c) => {
      countMap[c._id.toString()] = {
        totalLinks: c.totalLinks,
        totalClicks: c.totalClicks,
      };
    });

    const enrichedUsers = users.map((u) => ({
      ...u.toObject(),
      totalLinks: countMap[u._id.toString()]?.totalLinks || 0,
      totalClicks: countMap[u._id.toString()]?.totalClicks || 0,
    }));

    res.status(200).json({
      success: true,
      count: users.length,
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

const getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLinks = await Link.countDocuments();
    const blockedLinks = await Link.countDocuments({ isBlocked: true });
    const totalClicks = await Click.countDocuments();

    const systemDeviceStats = await Click.aggregate([
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

    const topLinks = await Link.find()
      .populate('createdBy', 'name email')
      .sort({ clicksCount: -1 })
      .limit(5);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalLinks,
        blockedLinks,
        activeLinks: totalLinks - blockedLinks,
        totalClicks,
        systemDeviceStats,
        topLinks: topLinks.map((l) => ({
          ...l.toObject(),
          shortUrl: `${baseUrl}/${l.shortCode}`,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLinks,
  updateLinkStatus,
  getAllUsers,
  getSystemStats,
};
