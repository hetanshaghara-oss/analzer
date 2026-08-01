const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getProfile, updateProfile, setGithubToken, getLoginHistory, deleteAccount,
  getAllUsers, suspendUser, changeUserRole
} = require('../controllers/userController');

// User routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.put('/github-token', requireAuth, setGithubToken);
router.get('/login-history', requireAuth, getLoginHistory);
router.delete('/account', requireAuth, deleteAccount);

// Admin routes
router.get('/', requireAuth, requireRole('super_admin', 'company_admin'), getAllUsers);
router.patch('/:id/suspend', requireAuth, requireRole('super_admin'), suspendUser);
router.patch('/:id/role', requireAuth, requireRole('super_admin'), changeUserRole);

module.exports = router;
