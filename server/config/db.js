//mysql connection

const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

console.log("Database:", process.env.DATABASE);
console.log("Host:", process.env.HOST);
console.log("User:", process.env.USER);

const connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createUsersTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      age INT,
      gender ENUM('male', 'female', 'other'),
      city VARCHAR(100),
      hobbies TEXT,
      preferences TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log("Users table is ready.");
  } catch (error) {
    console.error("Error creating users table:", error.message);
  }
}

async function createProfileInfoTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS profile_info (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      photo_url VARCHAR(255),
      height VARCHAR(20),
      education VARCHAR(100),
      occupation VARCHAR(100),
      relationship_status VARCHAR(50),
      looking_for VARCHAR(100),
      about_me TEXT,
      location VARCHAR(100),
      matches INT DEFAULT 0,
      likes INT DEFAULT 0,
      profile_complete_percentage INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log("Profile info table is ready.");
  } catch (error) {
    console.error("Error creating profile_info table:", error.message);
  }
}

async function createConversationsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user1_id INT NOT NULL,
      user2_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_conversation (user1_id, user2_id)
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log("Conversations table is ready.");
  } catch (error) {
    console.error("Error creating conversations table:", error.message);
  }
}

async function createMessagesTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      message_text TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  try {
    await connection.execute(createTableQuery);
    console.log("Messages table is ready.");
  } catch (error) {
    console.error("Error creating messages table:", error.message);
  }
}

async function testConnection() {
    try{
        const conn = await connection.getConnection();
        await conn.ping();
        console.log("Database Sucessfully connected");
        conn.release();
    } catch(error) {
        console.error('Error connecting to the database:', error.message);
        process.exit(1);  
    }
}

testConnection();
createUsersTable();
createProfileInfoTable();
createConversationsTable();
createMessagesTable();

module.exports = connection;
