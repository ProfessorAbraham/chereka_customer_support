import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ticketsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare
} from 'lucide-react';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [ticketUpdate, setTicketUpdate] = useState({
    status: '',
    priority: ''
  });

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsAPI.getById(id),
    enabled: !!id
  });

  const addMessageMutation = useMutation({
    mutationFn: (message) => ticketsAPI.addMessage(id, { content: message }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['ticket', id]);
    }
  });

  const updateTicketMutation = useMutation({
    mutationFn: (updates) => ticketsAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id]);
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleAddMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      addMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleUpdateTicket = (field, value) => {
    const updates = { [field]: value };
    updateTicketMutation.mutate(updates);
  };

  const canUpdateTicket = () => {
    return user?.role === 'admin' || 
           (user?.role === 'agent' && ticket?.agentId === user.id);
  };

  const canAddMessage = () => {
    return user?.role === 'admin' ||
           (user?.role === 'agent' && ticket?.agentId === user.id) ||
           (user?.role === 'customer' && ticket?.customerId === user.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading ticket</h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={() => navigate('/tickets')}>Back to Tickets</Button>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket not found</h3>
        <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/tickets')}>Back to Tickets</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {getStatusIcon(ticket.status)}
            <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
          <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                  {ticket.resolvedAt && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Resolved {new Date(ticket.resolvedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Messages ({ticket.messages?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((message) => (
                    <div key={message.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender.firstName, message.sender.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.sender.firstName} {message.sender.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {message.sender.role}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages yet</p>
                )}
              </div>

              {/* Add Message Form */}
              {canAddMessage() && (
                <form onSubmit={handleAddMessage} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="message">Add a message</Label>
                    <Textarea
                      id="message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || addMessageMutation.isLoading}
                    >
                      {addMessageMutation.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <Badge variant="outline">
                  {ticket.category}
                </Badge>
              </div>

              {/* Update Controls for Agents/Admins */}
              {canUpdateTicket() && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <Label className="text-sm">Update Status</Label>
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleUpdateTicket('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Update Priority</Label>
                    <Select
                      value={ticket.priority}
                      onValueChange={(value) => handleUpdateTicket('priority', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Customer</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(ticket.customer?.firstName, ticket.customer?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {ticket.customer?.firstName} {ticket.customer?.lastName}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{ticket.customer?.email}</p>
              </div>

              {ticket.agent ? (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned Agent</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(ticket.agent.firstName, ticket.agent.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {ticket.agent.firstName} {ticket.agent.lastName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{ticket.agent.email}</p>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Assigned Agent</Label>
                  <p className="text-sm text-gray-400 mt-1">Not assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;

