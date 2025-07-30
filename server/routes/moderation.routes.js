// Moderation routes for blocking and reporting users
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware.js');
const {
    blockUser,
    unblockUser,
    getBlockedUsers,
    reportUser,
    isUserBlocked,
    getUserReports
} = require('../controllers/moderation.controller.js');

// Block a user (requires auth)
router.post('/block-user', authenticateToken, blockUser);

// Unblock a user (requires auth)
router.delete('/unblock-user', authenticateToken, unblockUser);

// Get blocked users list (requires auth)
router.get('/blocked-users', authenticateToken, getBlockedUsers);

// Report a user (requires auth)
router.post('/report-user', authenticateToken, reportUser);

// Check if a user is blocked (requires auth)
router.get('/is-blocked/:checkUserId', authenticateToken, isUserBlocked);

// Get user's reports (requires auth)
router.get('/my-reports', authenticateToken, getUserReports);

module.exports = router;
