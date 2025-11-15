'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DateRangePicker from '../components/DateRangePicker';
import { format } from 'date-fns';
import { getHoursByClientGroup, getHoursByAgent, getHoursByActivity } from '../lib/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#163C3C', '#ACC9A6', '#EBFDCF', '#1F4F4F', '#0F2A2A'];

export default function ClientGroupsPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupAgents, setGroupAgents] = useState<any[]>([]);
  const [groupActivities, setGroupActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup);
    }
  }, [selectedGroup, startDate, endDate]);

  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHoursByClientGroup(startDate, endDate);
      setGroups(data);
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0].client_group_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load client groups');
    } finally {
      setLoading(false);
    }
  }

  async function loadGroupDetails(groupId: string) {
    try {
      const [agentsData, activitiesData] = await Promise.all([
        getHoursByAgent(startDate, endDate, [groupId]),
        getHoursByActivity(startDate, endDate, [groupId]),
      ]);
      setGroupAgents(agentsData);
      setGroupActivities(activitiesData);
    } catch (err: any) {
      console.error('Failed to load group details:', err);
    }
  }

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const selectedGroupData = groups.find(g => g.client_group_id === selectedGroup);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading client groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Groups</h1>
        <p className="text-gray-600">
          View time tracking data by client group from {format(new Date(startDate), 'MMM d')} to {format(new Date(endDate), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="mb-6">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Groups</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.client_group_id}
                  onClick={() => setSelectedGroup(group.client_group_id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors ${
                    selectedGroup === group.client_group_id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className={`font-medium ${selectedGroup === group.client_group_id ? 'text-white' : 'text-gray-900'}`}>
                    {group.group_name}
                  </p>
                  <p className={`text-sm ${selectedGroup === group.client_group_id ? 'text-white/80' : 'text-gray-500'}`}>
                    {group.total_hours.toFixed(2)} hrs • {group.agent_count} agents
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2">
          {selectedGroupData ? (
            <div className="space-y-6">
              {/* Group Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedGroupData.group_name}</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-primary">{selectedGroupData.total_hours.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sessions</p>
                    <p className="text-2xl font-bold text-primary">{selectedGroupData.session_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Agents</p>
                    <p className="text-2xl font-bold text-primary">{selectedGroupData.agent_count}</p>
                  </div>
                </div>
                {selectedGroupData.incomplete_sessions > 0 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ⚠️ {selectedGroupData.incomplete_sessions} incomplete session(s)
                    </p>
                  </div>
                )}
              </div>

              {/* Hours by Agent Chart */}
              {groupAgents.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Hours by Agent</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupAgents.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent_name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_hours" fill="#163C3C" name="Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Activity Distribution */}
              {groupActivities.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Activity Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={groupActivities}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total_hours"
                      >
                        {groupActivities.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Agents List */}
              {groupAgents.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Agents in Group</h3>
                  <div className="space-y-2">
                    {groupAgents.map((agent) => (
                      <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{agent.agent_name}</p>
                          <p className="text-sm text-gray-500">{agent.session_count} sessions</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{agent.total_hours.toFixed(2)} hrs</p>
                          {agent.incomplete_sessions > 0 && (
                            <p className="text-xs text-orange-600">{agent.incomplete_sessions} incomplete</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
              <p className="text-gray-500">Select a client group to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

