import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { analyticsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Star,
  Loader2,
  RefreshCw
} from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics-overview', timeRange],
    queryFn: () => analyticsAPI.getOverview({ timeRange }),
    enabled: user?.role === 'admin' || user?.role === 'agent'
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ['analytics-trends', timeRange],
    queryFn: () => analyticsAPI.getTicketTrends({ timeRange }),
    enabled: user?.role === 'admin' || user?.role === 'agent'
  });

  const { data: distribution, isLoading: loadingDistribution } = useQuery({
    queryKey: ['analytics-distribution', timeRange],
    queryFn: () => analyticsAPI.getTicketDistribution({ timeRange }),
    enabled: user?.role === 'admin' || user?.role === 'agent'
  });

  const { data: agentPerformance, isLoading: loadingAgents } = useQuery({
    queryKey: ['analytics-agents', timeRange],
    queryFn: () => analyticsAPI.getAgentPerformance({ timeRange }),
    enabled: user?.role === 'admin'
  });

  const { data: satisfaction, isLoading: loadingSatisfaction } = useQuery({
    queryKey: ['analytics-satisfaction', timeRange],
    queryFn: () => analyticsAPI.getSatisfaction({ timeRange }),
    enabled: user?.role === 'admin' || user?.role === 'agent'
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['analytics-activity', '7d'],
    queryFn: () => analyticsAPI.getActivity({ timeRange: '7d' }),
    enabled: user?.role === 'admin'
  });

  // Chart colors
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getChangeIndicator = (current, previous) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">
            {user.role === 'admin' ? 'System-wide analytics and performance metrics' : 'Your performance metrics and statistics'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            disabled={loadingOverview}
          >
            {loadingOverview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.tickets.total)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.tickets.resolved + overview.tickets.closed} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.tickets.resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Tickets resolved successfully
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.chats.active)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.chats.waiting} waiting for agent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.metrics.averageResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">
                Average time to resolve
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Ticket Trends</span>
            </CardTitle>
            <CardDescription>
              Ticket volume over time by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : trends?.trends ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Total"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Ticket Distribution</span>
            </CardTitle>
            <CardDescription>
              Tickets by status and priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDistribution ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : distribution?.statuses ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">By Status</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={distribution.statuses}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distribution.statuses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-2">By Priority</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={distribution.priorities}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distribution.priorities.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance (Admin only) */}
      {user.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Agent Performance</span>
            </CardTitle>
            <CardDescription>
              Individual agent metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : agentPerformance?.agents ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Agent</th>
                      <th className="text-center py-2">Total Tickets</th>
                      <th className="text-center py-2">Resolved</th>
                      <th className="text-center py-2">Resolution Rate</th>
                      <th className="text-center py-2">Avg Time (hrs)</th>
                      <th className="text-center py-2">Chats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.agents.map((agent) => (
                      <tr key={agent.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                          </div>
                        </td>
                        <td className="text-center py-3">{agent.totalTickets}</td>
                        <td className="text-center py-3">{agent.resolvedTickets}</td>
                        <td className="text-center py-3">
                          <Badge variant={agent.resolutionRate >= 80 ? 'default' : 'secondary'}>
                            {agent.resolutionRate}%
                          </Badge>
                        </td>
                        <td className="text-center py-3">{agent.avgResolutionTime}</td>
                        <td className="text-center py-3">{agent.totalChats}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No agent data available</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Satisfaction */}
      {satisfaction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Customer Satisfaction</span>
            </CardTitle>
            <CardDescription>
              Customer feedback and satisfaction ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSatisfaction ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-yellow-500">
                      {satisfaction.averageRating}
                    </div>
                    <div className="text-sm text-gray-500">
                      Average Rating ({satisfaction.totalRatings} reviews)
                    </div>
                  </div>
                  <div className="space-y-2">
                    {satisfaction.ratingDistribution.map((rating) => (
                      <div key={rating.rating} className="flex items-center space-x-2">
                        <span className="text-sm w-8">{rating.rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${(rating.count / satisfaction.totalRatings) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8">{rating.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Satisfaction Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={satisfaction.satisfactionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 5]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Activity (Admin only) */}
      {user.role === 'admin' && activity && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Activity</span>
            </CardTitle>
            <CardDescription>
              Recent system activity and peak usage hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Activity Over Time</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activity.ticketActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Peak Hours</h4>
                  <div className="space-y-2">
                    {activity.peakHours.map((hour, index) => (
                      <div key={hour.hour} className="flex items-center justify-between">
                        <span className="text-sm">
                          {hour.hour}:00 - {hour.hour + 1}:00
                        </span>
                        <Badge variant="outline">
                          {hour.count} tickets
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{activity.activeUsers}</div>
                        <div className="text-sm text-gray-500">Active Users</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{activity.totalMessages}</div>
                        <div className="text-sm text-gray-500">Messages</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;

