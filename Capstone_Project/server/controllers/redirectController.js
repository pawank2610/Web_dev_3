const Link = require('../models/Link');
const Click = require('../models/Click');
const { parseUserAgent } = require('../utils/deviceHelper');

const handleRedirect = async (req, res, next) => {
  try {
    const { code } = req.params;

    const reservedRoutes = [
      'favicon.ico',
      'robots.txt',
      'api',
      'health',
      'login',
      'register',
      'dashboard',
      'admin',
      'assets',
      'code_video.html',
    ];

    if (!code || reservedRoutes.includes(code.toLowerCase())) {
      return next();
    }

    const link = await Link.findOne({ shortCode: code });

    if (!link) {
      // If browser navigation, let React SPA display its own Not Found page
      if (req.accepts('html')) {
        return next();
      }

      return res.status(404).json({
        success: false,
        message: `Short link /${code} does not exist or has been removed`,
      });
    }

    if (link.isBlocked) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Blocked – ShortLink</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080c14; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #141e33; border: 1px solid #dc2626; padding: 2.5rem; border-radius: 12px; max-width: 460px; text-align: center; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #ef4444; }
            p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
            .reason { background: #0b1120; padding: 0.75rem; border-radius: 6px; color: #f87171; font-size: 0.85rem; margin-top: 0.75rem; }
            a { display: inline-block; margin-top: 1.25rem; color: #ee6123; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Suspended</h1>
            <p>This link has been blocked by an administrator due to safety or policy violations.</p>
            ${link.blockReason ? `<div class="reason">Reason: ${link.blockReason}</div>` : ''}
            <a href="/">&larr; Return to ShortLink Home</a>
          </div>
        </body>
        </html>
      `);
    }

    if (link.isExpired()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Expired – ShortLink</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #080c14; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #141e33; border: 1px solid #eab308; padding: 2.5rem; border-radius: 12px; max-width: 440px; text-align: center; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #eab308; }
            p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
            a { display: inline-block; margin-top: 1.25rem; color: #ee6123; text-decoration: none; font-size: 0.9rem; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Expired</h1>
            <p>This short link expired on <strong>${new Date(link.expiresAt).toLocaleString()}</strong> and is no longer accessible.</p>
            <a href="/">&larr; Return to ShortLink Home</a>
          </div>
        </body>
        </html>
      `);
    }

    await Link.findByIdAndUpdate(link._id, { $inc: { clicksCount: 1 } });

    const rawUa = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(rawUa);
    const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

    Click.create({
      linkId: link._id,
      ipAddress,
      userAgent: rawUa,
      deviceType,
      browser,
      os,
      referrer,
      timestamp: new Date(),
    }).catch((err) => {
      console.error('[Click Analytics Error]', err.message);
    });

    return res.redirect(302, link.originalUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = { handleRedirect };
