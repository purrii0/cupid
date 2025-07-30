// Message controller for handling message-related requests

const messageModel = require('../models/message.model.js');
const swipeModel = require('../models/swipe.model.js');

const messageController = {
  // Get user's conversations
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const conversations = await messageModel.getUserConversations(userId);
      
      res.status(200).json({
        success: true,
        conversations: conversations
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations'
      });
    }
  },

  // Get messages for a specific conversation
  async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;

      const messages = await messageModel.getConversationMessages(conversationId, userId);
      
      // Mark messages as read
      await messageModel.markMessagesAsRead(conversationId, userId);

      res.status(200).json({
        success: true,
        messages: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch messages'
      });
    }
  },

  // Send a message
  async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { conversationId, messageText } = req.body;

      if (!messageText || !messageText.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      // Get conversation participants
      const [convCheck] = await messageModel.connection.execute(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversationId]
      );
      if (!convCheck.length) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      const { user1_id, user2_id } = convCheck[0];
      const otherUserId = user1_id === userId ? user2_id : user1_id;

      // Check if users are matched
      const user1 = Math.min(userId, otherUserId);
      const user2 = Math.max(userId, otherUserId);
      const matches = await swipeModel.getMatches(userId);
      const isMatched = matches.some(m => (m.user1_id === user1 && m.user2_id === user2));

      if (!isMatched) {
        return res.status(403).json({
          success: false,
          message: 'You can only message a matched user.'
        });
      }

      const message = await messageModel.sendMessage(conversationId, userId, messageText.trim());

      res.status(201).json({
        success: true,
        message: message
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  },

  // Start conversation with another user
  async startConversation(req, res) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          message: 'Other user ID is required'
        });
      }

      if (userId === parseInt(otherUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot start conversation with yourself'
        });
      }

      // Check if users are matched
      const user1 = Math.min(userId, otherUserId);
      const user2 = Math.max(userId, otherUserId);
      const matches = await swipeModel.getMatches(userId);
      const isMatched = matches.some(m => (m.user1_id === user1 && m.user2_id === user2));

      if (!isMatched) {
        return res.status(403).json({
          success: false,
          message: 'You can only start a conversation with a matched user.'
        });
      }

      const conversationId = await messageModel.getOrCreateConversation(userId, otherUserId);

      res.status(200).json({
        success: true,
        conversationId: conversationId
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start conversation'
      });
    }
  }
};

module.exports = messageController;
