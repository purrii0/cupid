// Message routes

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

// All message routes require authentication
router.use(authMiddleware);

// Get user's conversations
router.get('/conversations', messageController.getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Send a message
router.post('/messages', messageController.sendMessage);

// Start conversation with another user
router.post('/conversations', messageController.startConversation);

module.exports = router;
