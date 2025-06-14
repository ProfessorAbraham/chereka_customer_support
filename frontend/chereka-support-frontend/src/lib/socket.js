import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Chat room methods
  joinChatRoom(chatRoomId) {
    if (this.socket) {
      this.socket.emit('join_chat_room', { chatRoomId });
    }
  }

  leaveChatRoom(chatRoomId) {
    if (this.socket) {
      this.socket.emit('leave_chat_room', { chatRoomId });
    }
  }

  sendMessage(chatRoomId, content) {
    if (this.socket) {
      this.socket.emit('send_message', { chatRoomId, content });
    }
  }

  joinWaitingChat(chatRoomId) {
    if (this.socket) {
      this.socket.emit('join_waiting_chat', { chatRoomId });
    }
  }

  // Typing indicators
  startTyping(chatRoomId) {
    if (this.socket) {
      this.socket.emit('typing_start', { chatRoomId });
    }
  }

  stopTyping(chatRoomId) {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatRoomId });
    }
  }

  // Event listeners
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      
      // Store the listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

