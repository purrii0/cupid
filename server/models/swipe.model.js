const connection = require('../config/db.js');

const swipeModel = {
  // Record a swipe (right or left)
  async swipe(swiperId, swipeeId, direction) {
    // Insert or update swipe
    await connection.execute(
      'INSERT INTO swipes (swiper_id, swipee_id, direction) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE direction = VALUES(direction)',
      [swiperId, swipeeId, direction]
    );
    // If right swipe, check for mutual right swipe
    if (direction === 'right') {
      const [rows] = await connection.execute(
        'SELECT * FROM swipes WHERE swiper_id = ? AND swipee_id = ? AND direction = "right"',
        [swipeeId, swiperId]
      );
      if (rows.length > 0) {
        // Create match if not already exists
        const user1 = Math.min(swiperId, swipeeId);
        const user2 = Math.max(swiperId, swipeeId);
        await connection.execute(
          'INSERT IGNORE INTO matches (user1_id, user2_id) VALUES (?, ?)',
          [user1, user2]
        );
        return { match: true };
      }
    }
    return { match: false };
  },

  // Get matches for a user
  async getMatches(userId) {
    const [rows] = await connection.execute(
      `SELECT m.id, m.user1_id, m.user2_id, m.matched_at,
        u1.name as user1_name, u2.name as user2_name,
        u1.photo_url as user1_photo, u2.photo_url as user2_photo
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.user1_id = ? OR m.user2_id = ?
      ORDER BY m.matched_at DESC`,
      [userId, userId]
    );
    return rows;
  },

  // Get swipe history for a user
  async getSwipeHistory(userId) {
    const [rows] = await connection.execute(
      'SELECT * FROM swipes WHERE swiper_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }
};

module.exports = swipeModel;