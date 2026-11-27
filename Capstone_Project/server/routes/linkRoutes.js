const express = require('express');
const router = express.Router();
const {
  publicShorten,
  createLink,
  getUserLinks,
  getLinkById,
  deleteLink,
  getLinkAnalytics,
} = require('../controllers/linkController');
const { protect } = require('../middleware/authMiddleware');

router.post('/public-shorten', publicShorten);

router.use(protect);

router.route('/')
  .post(createLink)
  .get(getUserLinks);

router.route('/:id')
  .get(getLinkById)
  .delete(deleteLink);

router.get('/:id/analytics', getLinkAnalytics);

module.exports = router;
