// Message model for handling message operations

const connection = require('../config/db.js');

const messageModel = {
  // Get or create conversation between two users
  async getOrCreateConversation(user1Id, user2Id) {
    // First, try to find existing conversation (check both directions)
    const [existing] = await connection.execute(
      `SELECT id FROM conversations 
       WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
      [user1Id, user2Id, user2Id, user1Id]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new conversation if doesn't exist
    const [result] = await connection.execute(
      'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
      [user1Id, user2Id]
    );

    return result.insertId;
  },

  // Get conversations for a user
  async getUserConversations(userId) {
    const [rows] = await connection.execute(
      `SELECT 
        c.id as conversation_id,
        c.updated_at,
        CASE 
          WHEN c.user1_id = ? THEN u2.id 
          ELSE u1.id 
        END as other_user_id,
        CASE 
          WHEN c.user1_id = ? THEN u2.name 
          ELSE u1.name 
        END as other_user_name,
        CASE 
          WHEN c.user1_id = ? THEN p2.photo_url 
          ELSE p1.photo_url 
        END as other_user_avatar,
        m.message_text as last_message,
        m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      LEFT JOIN profile_info p1 ON u1.id = p1.user_id
      LEFT JOIN profile_info p2 ON u2.id = p2.user_id
      LEFT JOIN (
        SELECT conversation_id, message_text, created_at,
               ROW_NUMBER() OVER (PARTITION BY conversation_id ORDER BY created_at DESC) as rn
        FROM messages
      ) m ON c.id = m.conversation_id AND m.rn = 1
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.updated_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    return rows.map(row => ({
      conversationId: row.conversation_id,
      otherUser: {
        id: row.other_user_id,
        name: row.other_user_name,
        avatar: row.other_user_avatar || 'assets/images/default-avatar.png'
      },
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time,
      unreadCount: row.unread_count,
      updatedAt: row.updated_at
    }));
  },

  // Get messages for a conversation
  async getConversationMessages(conversationId, userId) {
    // First verify user is part of this conversation
    const [convCheck] = await connection.execute(
      'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, userId, userId]
    );

    if (convCheck.length === 0) {
      throw new Error('Unauthorized access to conversation');
    }

    // Get messages
    const [rows] = await connection.execute(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.created_at,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return rows.map(row => ({
      id: row.id,
      text: row.message_text,
      senderId: row.sender_id,
      senderName: row.sender_name,
      createdAt: row.created_at,
      isMe: row.sender_id === userId
    }));
  },

  // Send a message
  async sendMessage(conversationId, senderId, messageText) {
    // Verify user is part of conversation
    const [convCheck] = await connection.execute(
      'SELECT user1_id, user2_id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, senderId, senderId]
    );

    if (convCheck.length === 0) {
      throw new Error('Unauthorized access to conversation');
    }

    // Insert message
    const [result] = await connection.execute(
      'INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?, ?, ?)',
      [conversationId, senderId, messageText]
    );

    // Update conversation timestamp
    await connection.execute(
      'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [conversationId]
    );

    // Get the inserted message with sender info
    const [messageRows] = await connection.execute(
      `SELECT 
        m.id,
        m.message_text,
        m.sender_id,
        m.created_at,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      [result.insertId]
    );

    const message = messageRows[0];
    const conversation = convCheck[0];
    
    return {
      id: message.id,
      text: message.message_text,
      senderId: message.sender_id,
      senderName: message.sender_name,
      createdAt: message.created_at,
      conversationId: conversationId,
      receiverId: conversation.user1_id === senderId ? conversation.user2_id : conversation.user1_id
    };
  },

  // Mark messages as read
  async markMessagesAsRead(conversationId, userId) {
    await connection.execute(
      'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
      [conversationId, userId]
    );
  }
};

module.exports = messageModel;
