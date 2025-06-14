import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { chatAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../lib/socket';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  PhoneOff
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get chat rooms for agents/admins
  const { data: chatRoomsData, isLoading: loadingRooms } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: () => chatAPI.getRooms(),
    enabled: user?.role === 'agent' || user?.role === 'admin',
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Create or get chat room for customers
  const createRoomMutation = useMutation({
    mutationFn: chatAPI.getOrCreateRoom,
    onSuccess: (room) => {
      setCurrentChatRoom(room);
      connectToSocket(room.id);
    }
  });

  // Join chat room mutation for agents
  const joinRoomMutation = useMutation({
    mutationFn: chatAPI.joinRoom,
    onSuccess: (room) => {
      setCurrentChatRoom(room);
      queryClient.invalidateQueries(['chatRooms']);
    }
  });

  // Close chat room mutation
  const closeRoomMutation = useMutation({
    mutationFn: chatAPI.closeRoom,
    onSuccess: () => {
      if (currentChatRoom) {
        socketService.leaveChatRoom(currentChatRoom.id);
      }
      setCurrentChatRoom(null);
      setMessages([]);
      queryClient.invalidateQueries(['chatRooms']);
    }
  });

  const connectToSocket = (chatRoomId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketService.connect(token);
    
    // Join the chat room
    socketService.joinChatRoom(chatRoomId);

    // Set up event listeners
    socketService.on('connect', () => {
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
    });

    socketService.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketService.on('user_typing', (data) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.id === data.user.id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    });

    socketService.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.user.id));
    });

    socketService.on('agent_joined', (data) => {
      const systemMessage = {
        id: Date.now(),
        content: `${data.agent.firstName} ${data.agent.lastName} has joined the chat.`,
        messageType: 'system',
        createdAt: new Date().toISOString(),
        sender: { role: 'system' }
      };
      setMessages(prev => [...prev, systemMessage]);
      scrollToBottom();
    });

    socketService.on('user_joined', (data) => {
      console.log('User joined:', data.user);
    });

    socketService.on('user_left', (data) => {
      console.log('User left:', data.user);
    });

    socketService.on('error', (error) => {
      console.error('Socket error:', error);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartChat = () => {
    createRoomMutation.mutate('Live Chat Support');
  };

  const handleJoinRoom = (roomId) => {
    if (user?.role === 'agent' || user?.role === 'admin') {
      socketService.joinWaitingChat(roomId);
      joinRoomMutation.mutate(roomId);
    } else {
      // Customer joining their own room
      const room = chatRoomsData?.chatRooms?.find(r => r.id === roomId);
      if (room) {
        setCurrentChatRoom(room);
        connectToSocket(roomId);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChatRoom) return;

    socketService.sendMessage(currentChatRoom.id, newMessage.trim());
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      socketService.stopTyping(currentChatRoom.id);
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!currentChatRoom) return;

    // Start typing indicator
    if (!isTyping) {
      socketService.startTyping(currentChatRoom.id);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(currentChatRoom.id);
      setIsTyping(false);
    }, 3000);
  };

  const handleCloseChat = () => {
    if (currentChatRoom) {
      closeRoomMutation.mutate(currentChatRoom.id);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.removeAllListeners('new_message');
      socketService.removeAllListeners('user_typing');
      socketService.removeAllListeners('user_stopped_typing');
      socketService.removeAllListeners('agent_joined');
      socketService.removeAllListeners('user_joined');
      socketService.removeAllListeners('user_left');
    };
  }, []);

  // Customer view - no active chat
  if (user?.role === 'customer' && !currentChatRoom) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Live Chat Support</h1>
          <p className="text-gray-600 mb-8">
            Get instant help from our support team. Start a chat session to connect with an available agent.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Start a Chat Session</CardTitle>
            <CardDescription>
              Connect with our support team for immediate assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleStartChat}
              disabled={createRoomMutation.isLoading}
              size="lg"
            >
              {createRoomMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Live Chat
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Before You Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                To help us assist you better, please have the following information ready:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Your account information</li>
                <li>Description of the issue you're experiencing</li>
                <li>Any error messages you've encountered</li>
                <li>Steps you've already tried to resolve the issue</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agent/Admin view - room list
  if ((user?.role === 'agent' || user?.role === 'admin') && !currentChatRoom) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Chat</h1>
          <p className="text-gray-600">Manage customer chat sessions</p>
        </div>

        {loadingRooms ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading chat rooms...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {chatRoomsData?.chatRooms?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active chats</h3>
                  <p className="text-gray-600">
                    No customers are currently waiting for chat support.
                  </p>
                </CardContent>
              </Card>
            ) : (
              chatRoomsData?.chatRooms?.map((room) => (
                <Card key={room.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(room.customer?.firstName, room.customer?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {room.customer?.firstName} {room.customer?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{room.customer?.email}</p>
                          <p className="text-sm text-gray-500">{room.subject}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(room.status)}>
                          {getStatusIcon(room.status)}
                          <span className="ml-1">{room.status}</span>
                        </Badge>
                        
                        <div className="text-sm text-gray-500">
                          {room.lastMessageAt 
                            ? new Date(room.lastMessageAt).toLocaleString()
                            : new Date(room.createdAt).toLocaleString()
                          }
                        </div>

                        <Button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={room.status === 'closed'}
                          size="sm"
                        >
                          {room.status === 'waiting' ? 'Join Chat' : 'View Chat'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Chat interface
  if (currentChatRoom) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col">
        {/* Chat header */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {user?.role === 'customer' 
                      ? getInitials(currentChatRoom.agent?.firstName, currentChatRoom.agent?.lastName) || 'A'
                      : getInitials(currentChatRoom.customer?.firstName, currentChatRoom.customer?.lastName)
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {user?.role === 'customer' 
                      ? (currentChatRoom.agent 
                          ? `${currentChatRoom.agent.firstName} ${currentChatRoom.agent.lastName}`
                          : 'Waiting for agent...'
                        )
                      : `${currentChatRoom.customer?.firstName} ${currentChatRoom.customer?.lastName}`
                    }
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(currentChatRoom.status)}>
                      {getStatusIcon(currentChatRoom.status)}
                      <span className="ml-1">{currentChatRoom.status}</span>
                    </Badge>
                    {isConnected ? (
                      <Badge variant="outline" className="text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleCloseChat}
                disabled={closeRoomMutation.isLoading}
              >
                {closeRoomMutation.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Closing...
                  </>
                ) : (
                  <>
                    <PhoneOff className="mr-2 h-4 w-4" />
                    End Chat
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Messages area */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {currentChatRoom.status === 'waiting' 
                      ? 'Waiting for an agent to join...'
                      : 'Start the conversation!'
                    }
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${
                      message.sender?.id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.messageType === 'system'
                          ? 'bg-gray-100 text-gray-600 text-center text-sm'
                          : message.sender?.id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.messageType !== 'system' && message.sender?.id !== user?.id && (
                        <div className="text-xs text-gray-500 mb-1">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.messageType === 'system' || message.sender?.id === user?.id
                          ? 'text-gray-300'
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">
                    {typingUsers.map(user => `${user.firstName} ${user.lastName}`).join(', ')} 
                    {typingUsers.length === 1 ? ' is' : ' are'} typing...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            {currentChatRoom.status !== 'closed' && (
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default Chat;

