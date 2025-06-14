import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, templatesRes, statsRes, healthRes] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/email-templates'),
        api.get('/settings/system-stats'),
        api.get('/settings/system-health')
      ]);

      setSettings(settingsRes.data);
      setEmailTemplates(templatesRes.data);
      setSystemStats(statsRes.data);
      setSystemHealth(healthRes.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      setSaving(true);
      await api.put(`/settings/${key}`, { value });
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [Object.keys(prev).find(category => 
          prev[category].some(setting => setting.key === key)
        )]: prev[Object.keys(prev).find(category => 
          prev[category].some(setting => setting.key === key)
        )].map(setting => 
          setting.key === key ? { ...setting, value } : setting
        )
      }));
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailTemplate = async (templateId, updates) => {
    try {
      setSaving(true);
      await api.put(`/settings/email-templates/${templateId}`, updates);
      
      // Update local state
      setEmailTemplates(prev => 
        prev.map(template => 
          template.id === templateId ? { ...template, ...updates } : template
        )
      );
      
      setSelectedTemplate(null);
      alert('Email template updated successfully');
    } catch (error) {
      console.error('Error updating email template:', error);
      alert('Failed to update email template');
    } finally {
      setSaving(false);
    }
  };

  const createBackup = async () => {
    try {
      setSaving(true);
      const response = await api.post('/settings/backup');
      alert(`Backup created successfully. Size: ${response.data.backup.size} bytes`);
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-gray-600">Manage your support system configuration</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', name: 'General Settings' },
              { id: 'email', name: 'Email Templates' },
              { id: 'system', name: 'System Health' },
              { id: 'backup', name: 'Backup & Maintenance' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {Object.entries(settings).map(([category, categorySettings]) => (
              <div key={category} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                  {category.replace('_', ' ')} Settings
                </h3>
                <div className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">
                          {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        {setting.description && (
                          <p className="text-sm text-gray-500">{setting.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        {setting.type === 'boolean' ? (
                          <button
                            onClick={() => updateSetting(setting.key, setting.value === 'true' ? 'false' : 'true')}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              setting.value === 'true' ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                            disabled={saving}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                setting.value === 'true' ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        ) : (
                          <input
                            type={setting.type === 'number' ? 'number' : 'text'}
                            value={setting.value}
                            onChange={(e) => updateSetting(setting.key, e.target.value)}
                            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            disabled={saving}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email Templates Tab */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                <p className="text-sm text-gray-500">Manage your email notification templates</p>
              </div>
              <div className="divide-y divide-gray-200">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500">{template.description}</p>
                        <p className="text-xs text-gray-400 mt-1">Subject: {template.subject}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => setSelectedTemplate(template)}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && systemHealth && (
          <div className="space-y-6">
            {/* System Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    systemHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {systemHealth.status}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Overall Status</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{systemHealth.uptime.formatted}</div>
                  <p className="text-sm text-gray-500">Uptime</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{systemHealth.memory.used}</div>
                  <p className="text-sm text-gray-500">Memory Used</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{systemHealth.environment}</div>
                  <p className="text-sm text-gray-500">Environment</p>
                </div>
              </div>
            </div>

            {/* System Statistics */}
            {systemStats && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{systemStats.counts.totalUsers}</div>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{systemStats.counts.totalTickets}</div>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{systemStats.counts.totalArticles}</div>
                    <p className="text-sm text-gray-500">KB Articles</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{systemStats.counts.totalEmailsSent}</div>
                    <p className="text-sm text-gray-500">Emails Sent</p>
                  </div>
                </div>
              </div>
            )}

            {/* Service Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Service Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      systemHealth.database.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {systemHealth.database.status}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">{systemHealth.database.latency}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Email Service</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemHealth.email.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {systemHealth.email.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup & Maintenance Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Maintenance</h3>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Create System Backup</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Create a backup of all system data including users, tickets, articles, and settings.
                  </p>
                  <button
                    onClick={createBackup}
                    disabled={saving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating Backup...' : 'Create Backup'}
                  </button>
                </div>
                
                <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Maintenance Mode</h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    Enable maintenance mode to prevent users from accessing the system during updates.
                  </p>
                  <button
                    onClick={() => updateSetting('maintenance_mode', 'true')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                  >
                    Enable Maintenance Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Template Edit Modal */}
        {selectedTemplate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Email Template: {selectedTemplate.name}
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  updateEmailTemplate(selectedTemplate.id, {
                    subject: formData.get('subject'),
                    htmlContent: formData.get('htmlContent'),
                    textContent: formData.get('textContent'),
                    isActive: formData.get('isActive') === 'on'
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        defaultValue={selectedTemplate.subject}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">HTML Content</label>
                      <textarea
                        name="htmlContent"
                        rows={10}
                        defaultValue={selectedTemplate.htmlContent}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Text Content (Optional)</label>
                      <textarea
                        name="textContent"
                        rows={5}
                        defaultValue={selectedTemplate.textContent || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={selectedTemplate.isActive}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

