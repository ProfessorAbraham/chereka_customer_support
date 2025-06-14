const jwt = require('jsonwebtoken');
const { User, ChatRoom, ChatMessage } = require('../models');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Socket event handlers
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`User ${socket.user.firstName} ${socket.user.lastName} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // If user is an agent, join them to the agents room
    if (socket.user.role === 'agent' || socket.user.role === 'admin') {
      socket.join('agents');
    }

    // Handle joining a chat room
    socket.on('join_chat_room', async (data) => {
      try {
        const { chatRoomId } = data;
        
        // Verify user has access to this chat room
        const chatRoom = await ChatRoom.findByPk(chatRoomId);
        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        // Check permissions
        if (socket.user.role === 'customer' && chatRoom.customerId !== socket.user.id) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        if (socket.user.role === 'agent' && 
            chatRoom.agentId !== socket.user.id && 
            chatRoom.status === 'active') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join the chat room
        socket.join(`chat_${chatRoomId}`);
        socket.currentChatRoom = chatRoomId;
        
        socket.emit('joined_chat_room', { chatRoomId });
        
        // Notify others in the room
        socket.to(`chat_${chatRoomId}`).emit('user_joined', {
          user: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            role: socket.user.role
          }
        });

      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('error', { message: 'Failed to join chat room' });
      }
    });

    // Handle leaving a chat room
    socket.on('leave_chat_room', (data) => {
      const { chatRoomId } = data;
      
      socket.leave(`chat_${chatRoomId}`);
      socket.currentChatRoom = null;
      
      socket.emit('left_chat_room', { chatRoomId });
      
      // Notify others in the room
      socket.to(`chat_${chatRoomId}`).emit('user_left', {
        user: {
          id: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: socket.user.role
        }
      });
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { chatRoomId, content } = data;
        
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Verify chat room access
        const chatRoom = await ChatRoom.findByPk(chatRoomId);
        if (!chatRoom) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        // Check permissions
        if (socket.user.role === 'customer' && chatRoom.customerId !== socket.user.id) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        if (socket.user.role === 'agent' && chatRoom.agentId !== socket.user.id) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        if (chatRoom.status === 'closed') {
          socket.emit('error', { message: 'Chat room is closed' });
          return;
        }

        // Create the message
        const message = await ChatMessage.create({
          chatRoomId,
          senderId: socket.user.id,
          content: content.trim(),
          messageType: 'text'
        });

        // Update chat room last message time
        chatRoom.lastMessageAt = new Date();
        await chatRoom.save();

        // Fetch message with sender info
        const createdMessage = await ChatMessage.findByPk(message.id, {
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'role']
          }]
        });

        // Emit to all users in the chat room
        io.to(`chat_${chatRoomId}`).emit('new_message', createdMessage);

        // If this is a customer message in a waiting room, notify agents
        if (socket.user.role === 'customer' && chatRoom.status === 'waiting') {
          io.to('agents').emit('new_chat_notification', {
            chatRoomId,
            customer: {
              id: socket.user.id,
              firstName: socket.user.firstName,
              lastName: socket.user.lastName
            },
            message: content.trim()
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatRoomId } = data;
      socket.to(`chat_${chatRoomId}`).emit('user_typing', {
        user: {
          id: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatRoomId } = data;
      socket.to(`chat_${chatRoomId}`).emit('user_stopped_typing', {
        user: {
          id: socket.user.id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });
    });

    // Handle agent joining a waiting chat room
    socket.on('join_waiting_chat', async (data) => {
      try {
        const { chatRoomId } = data;
        
        if (socket.user.role !== 'agent' && socket.user.role !== 'admin') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const chatRoom = await ChatRoom.findByPk(chatRoomId);
        if (!chatRoom || chatRoom.status !== 'waiting') {
          socket.emit('error', { message: 'Chat room not available' });
          return;
        }

        // Assign agent and activate chat
        chatRoom.agentId = socket.user.id;
        chatRoom.status = 'active';
        await chatRoom.save();

        // Add system message
        await ChatMessage.create({
          chatRoomId,
          senderId: socket.user.id,
          content: `${socket.user.firstName} ${socket.user.lastName} has joined the chat.`,
          messageType: 'system'
        });

        // Join the chat room
        socket.join(`chat_${chatRoomId}`);
        socket.currentChatRoom = chatRoomId;

        // Notify customer that agent joined
        socket.to(`chat_${chatRoomId}`).emit('agent_joined', {
          agent: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
          }
        });

        // Notify all agents that this chat is no longer waiting
        io.to('agents').emit('chat_room_taken', { chatRoomId });

        socket.emit('joined_chat_room', { chatRoomId });

      } catch (error) {
        console.error('Error joining waiting chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.firstName} ${socket.user.lastName} disconnected`);
      
      // Notify current chat room if user was in one
      if (socket.currentChatRoom) {
        socket.to(`chat_${socket.currentChatRoom}`).emit('user_left', {
          user: {
            id: socket.user.id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            role: socket.user.role
          }
        });
      }
    });
  };
};

module.exports = {
  authenticateSocket,
  handleConnection
};

