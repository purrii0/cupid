// Message controller for handling message-related requests

const messageModel = require('../models/message.model.js');

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
