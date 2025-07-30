const express = require('express');
const router = express.Router();
const swipeController = require('../controllers/swipe.controller.js');
const authenticateToken = require('../middleware/auth.middleware.js');

// All routes require authentication
router.use(authenticateToken);

// Swipe right/left
router.post('/swipe', swipeController.swipe);
// Get matches
router.get('/matches', swipeController.getMatches);
// Get swipe history
router.get('/swipes', swipeController.getSwipeHistory);
// Update user location
router.post('/location', swipeController.updateLocation);
// Get users nearby for swiping
router.get('/nearby', swipeController.getNearbyUsers);

module.exports = router;