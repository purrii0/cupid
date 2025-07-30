// sql queries

const connection = require('../config/db.js');

const userModel = {
  // Find user by email
  async findByEmail(email) {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  // Find user by ID
  async findById(id) {
    const [rows] = await connection.execute(
      'SELECT id, name, email, age, gender, city, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  // Create new user
  async create(userData) {
    const { name, email, password, age, gender, city, latitude, longitude } = userData;
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, age, gender, city, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, age, gender, city, latitude, longitude]
    );
    return result.insertId;
  },

  // Update user location
  async updateLocation(userId, latitude, longitude) {
    await connection.execute(
      'UPDATE users SET latitude = ?, longitude = ? WHERE id = ?',
      [latitude, longitude, userId]
    );
  },

  // Get all users except current user
  async getAllExceptCurrent(currentUserId) {
    const [rows] = await connection.execute(
      'SELECT u.id, u.name, u.email, u.age, u.gender, u.city, p.photo_url FROM users u LEFT JOIN profile_info p ON u.id = p.user_id WHERE u.id != ?',
      [currentUserId]
    );
    return rows;
  },

  // Find users by proximity (returns users ordered by distance, excluding current user)
  async findNearbyUsers(currentUserId, latitude, longitude, maxDistanceKm = 100) {
    const [rows] = await connection.execute(
      `SELECT u.id, u.name, u.age, u.gender, u.city, u.latitude, u.longitude,
        (6371 * acos(cos(radians(?)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(?)) + sin(radians(?)) * sin(radians(u.latitude)))) AS distance
      FROM users u
      WHERE u.id != ? AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
      HAVING distance <= ?
      ORDER BY distance ASC
      LIMIT 50`,
      [latitude, longitude, latitude, currentUserId, maxDistanceKm]
    );
    return rows;
  }
};

module.exports = userModel;
