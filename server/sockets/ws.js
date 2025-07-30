// websocket connection & logic

const jwt = require('jsonwebtoken');
const messageModel = require('../models/message.model.js');

// Store active connections
const activeUsers = new Map();

function initializeWebSocket(io) {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.id} connected`);
    
    // Store user connection
    activeUsers.set(socket.user.id, socket.id);
    
    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.user.id} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, messageText } = data;
        
        if (!messageText || !messageText.trim()) {
          socket.emit('error', { message: 'Message text is required' });
          return;
        }

        // Save message to database
        const message = await messageModel.sendMessage(
          conversationId, 
          socket.user.id, 
          messageText.trim()
        );

        // Emit to conversation room
        io.to(`conversation_${conversationId}`).emit('new_message', {
          id: message.id,
          text: message.text,
          senderId: message.senderId,
          senderName: message.senderName,
          createdAt: message.createdAt,
          conversationId: conversationId
        });

        // Notify the receiver if they're online but not in the conversation room
        const receiverSocketId = activeUsers.get(message.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('conversation_update', {
            conversationId: conversationId,
            lastMessage: message.text,
            lastMessageTime: message.createdAt,
            senderName: message.senderName
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: data.isTyping
      });
    });

    // Handle marking messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;
        await messageModel.markMessagesAsRead(conversationId, socket.user.id);
        
        // Notify other users in conversation that messages were read
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          conversationId: conversationId,
          readBy: socket.user.id
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.id} disconnected`);
      activeUsers.delete(socket.user.id);
    });
  });
}

module.exports = { initializeWebSocket, activeUsers };
