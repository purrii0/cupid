// all the user routes: get message, users, chats and everything

const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    getUserProfile, 
    updateProfile, 
    getUserStats, 
    uploadPhoto, 
    upload,
    getSettings,
    updateSettings,
    changePassword,
    pauseAccount,
    reactivateAccount,
    deleteAccount
} = require("../controllers/user.controller.js");
const authenticateToken = require('../middleware/auth.middleware.js');

// Get all users for discovery (with optional auth to exclude current user)
router.get('/users', (req, res, next) => {
    // Optional auth - don't fail if no token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        const jwt = require('jsonwebtoken');
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            req.user = user;
        } catch (err) {
            // Ignore auth errors for this route
        }
    }
    next();
}, getUsers);

// Get current user profile (requires auth)
router.get('/profile', authenticateToken, getUserProfile);

// Get specific user profile by ID (public)
// Get specific user profile by ID (public)
router.get('/profile/:id', getUserProfile);

// Update current user profile (requires auth)
router.put('/profile', authenticateToken, updateProfile);

// Upload profile photo (requires auth)
router.post('/upload-photo', authenticateToken, upload.single('photo'), uploadPhoto);

// Get user statistics (requires auth)
router.get('/stats', authenticateToken, getUserStats);

// Settings routes
router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, updateSettings);
router.put('/change-password', authenticateToken, changePassword);
router.put('/pause-account', authenticateToken, pauseAccount);
router.put('/reactivate-account', authenticateToken, reactivateAccount);
router.delete('/delete-account', authenticateToken, deleteAccount);

module.exports = router;
