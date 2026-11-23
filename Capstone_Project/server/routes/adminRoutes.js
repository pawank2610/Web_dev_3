const express = require('express');
const router = express.Router();
const {
  getAllLinks,
  updateLinkStatus,
  getAllUsers,
  getSystemStats,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes require authentication and the 'admin' role (RBAC)
router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/links', getAllLinks);
router.patch('/links/:id/status', updateLinkStatus);
router.get('/users', getAllUsers);
router.get('/stats', getSystemStats);

module.exports = router;
