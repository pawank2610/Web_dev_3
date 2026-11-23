const express = require('express');
const router = express.Router();
const {
  createLink,
  getUserLinks,
  getLinkById,
  deleteLink,
  getLinkAnalytics,
} = require('../controllers/linkController');
const { protect } = require('../middleware/authMiddleware');

// All link routes require authentication
router.use(protect);

router.route('/')
  .post(createLink)
  .get(getUserLinks);

router.route('/:id')
  .get(getLinkById)
  .delete(deleteLink);

// Aggregation analytics endpoint
router.get('/:id/analytics', getLinkAnalytics);

module.exports = router;
