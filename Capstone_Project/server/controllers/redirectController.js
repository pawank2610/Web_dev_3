const Link = require('../models/Link');
const Click = require('../models/Click');
const { parseUserAgent } = require('../utils/deviceHelper');

/**
 * @desc    Redirect short code to original URL and record click analytics
 * @route   GET /:code
 * @access  Public
 */
const handleRedirect = async (req, res, next) => {
  try {
    const { code } = req.params;

    // Ignore requests for favicon, robots.txt, or api routes
    if (!code || ['favicon.ico', 'robots.txt', 'api', 'health'].includes(code.toLowerCase())) {
      return next();
    }

    const link = await Link.findOne({ shortCode: code });

    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Not Found – ShortLink</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px solid #27272a; padding: 2.5rem; border-radius: 12px; max-width: 440px; text-align: center; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #ef4444; }
            p { color: #a1a1aa; line-height: 1.6; font-size: 0.95rem; }
            a { display: inline-block; margin-top: 1.25rem; color: #38bdf8; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>404 – Link Not Found</h1>
            <p>The short link <code>/${code}</code> does not exist or may have been deleted.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">&larr; Return to ShortLink Home</a>
          </div>
        </body>
        </html>
      `);
    }

    // 1. Check if link is blocked by admin
    if (link.isBlocked) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Blocked – ShortLink</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px solid #dc2626; padding: 2.5rem; border-radius: 12px; max-width: 460px; text-align: center; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #ef4444; }
            p { color: #a1a1aa; line-height: 1.6; font-size: 0.95rem; }
            .reason { background: #27272a; padding: 0.75rem; border-radius: 6px; color: #f87171; font-size: 0.85rem; margin-top: 0.75rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Suspended</h1>
            <p>This link has been blocked by an administrator due to safety or policy violations.</p>
            ${link.blockReason ? `<div class="reason">Reason: ${link.blockReason}</div>` : ''}
          </div>
        </body>
        </html>
      `);
    }

    // 2. Check if link is expired
    if (link.isExpired()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Expired – ShortLink</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px solid #eab308; padding: 2.5rem; border-radius: 12px; max-width: 440px; text-align: center; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #eab308; }
            p { color: #a1a1aa; line-height: 1.6; font-size: 0.95rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Link Expired</h1>
            <p>This short link expired on <strong>${new Date(link.expiresAt).toLocaleString()}</strong> and is no longer accessible.</p>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Increment click count atomically
    await Link.findByIdAndUpdate(link._id, { $inc: { clicksCount: 1 } });

    // 4. Asynchronously log click details for analytics
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

    // 5. Perform HTTP 302 redirect
    return res.redirect(302, link.originalUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = { handleRedirect };
