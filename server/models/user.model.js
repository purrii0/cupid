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
    const { name, email, password, age, gender, city } = userData;
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, age, gender, city) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password, age, gender, city]
    );
    return result.insertId;
  },

  // Get all users except current user
  async getAllExceptCurrent(currentUserId) {
    const [rows] = await connection.execute(
      'SELECT u.id, u.name, u.email, u.age, u.gender, u.city, p.photo_url FROM users u LEFT JOIN profile_info p ON u.id = p.user_id WHERE u.id != ?',
      [currentUserId]
    );
    return rows;
  }
};

module.exports = userModel;
