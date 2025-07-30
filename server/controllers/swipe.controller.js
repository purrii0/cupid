const swipeModel = require('../models/swipe.model.js');
const userModel = require('../models/user.model.js');

const swipeController = {
  // Record a swipe (right/left)
  async swipe(req, res) {
    try {
      const swiperId = req.user.id;
      const { swipeeId, direction } = req.body;
      if (!swipeeId || !['right', 'left'].includes(direction)) {
        return res.status(400).json({ message: 'Invalid swipe data' });
      }
      const result = await swipeModel.swipe(swiperId, swipeeId, direction);
      return res.status(200).json({ success: true, match: result.match });
    } catch (error) {
      console.error('Error in swipe:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get matches for current user
  async getMatches(req, res) {
    try {
      const userId = req.user.id;
      const matches = await swipeModel.getMatches(userId);
      return res.status(200).json({ success: true, matches });
    } catch (error) {
      console.error('Error getting matches:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get swipe history for current user
  async getSwipeHistory(req, res) {
    try {
      const userId = req.user.id;
      const swipes = await swipeModel.getSwipeHistory(userId);
      return res.status(200).json({ success: true, swipes });
    } catch (error) {
      console.error('Error getting swipe history:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Update user location
  async updateLocation(req, res) {
    try {
      const userId = req.user.id;
      const { latitude, longitude } = req.body;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: 'Invalid location data' });
      }
      await userModel.updateLocation(userId, latitude, longitude);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating location:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Get users nearby for swiping
  async getNearbyUsers(req, res) {
    try {
      const userId = req.user.id;
      const { latitude, longitude, maxDistanceKm } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude required' });
      }
      const users = await userModel.findNearbyUsers(
        userId,
        parseFloat(latitude),
        parseFloat(longitude),
        maxDistanceKm ? parseFloat(maxDistanceKm) : 100
      );
      return res.status(200).json({ success: true, users });
    } catch (error) {
      console.error('Error getting nearby users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

module.exports = swipeController;