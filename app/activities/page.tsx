'use client';

import { useEffect, useState } from 'react';
import DateRangePicker from '../components/DateRangePicker';
import { format } from 'date-fns';
import { getHoursByActivity } from '../lib/api-client';

export default function ActivitiesPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadActivities();
  }, [startDate, endDate]);

  async function loadActivities() {
    setLoading(true);
    setError(null);
    try {
      const data: any = await getHoursByActivity(startDate, endDate);
      setActivities(data || []);
      if (data.length > 0 && !selectedActivity) {
        setSelectedActivity(data[0].activity_id || 'null');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setCurrentPage(1);
  };

  const selectedActivityData = activities.find(a => (a.activity_id || 'null') === selectedActivity);
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Activities</h1>
        <p className="text-gray-600">
          View time tracking by activity type from {format(new Date(startDate), 'MMM d')} to {format(new Date(endDate), 'MMM d, yyyy')}
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
        {/* Activities List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Activities</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {activities.map((activity) => {
                const key = activity.activity_id || 'null';
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedActivity(key)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedActivity === key
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className={`font-medium ${selectedActivity === key ? 'text-white' : 'text-gray-900'}`}>
                      {activity.activity_name || 'Unspecified Activity'}
                    </p>
                    <p className={`text-sm ${selectedActivity === key ? 'text-white/80' : 'text-gray-500'}`}>
                      {activity.total_hours.toFixed(2)} hrs • {activity.session_count} sessions
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Details */}
        <div className="lg:col-span-2">
          {selectedActivityData ? (
            <div className="space-y-6">
              {/* Activity Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedActivityData.activity_name || 'Unspecified Activity'}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-primary">{selectedActivityData.total_hours.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sessions</p>
                    <p className="text-2xl font-bold text-primary">{selectedActivityData.session_count}</p>
                  </div>
                </div>
              </div>

              {/* Activity Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Average Hours per Session</span>
                    <span className="font-bold text-primary">
                      {selectedActivityData.session_count > 0
                        ? (selectedActivityData.total_hours / selectedActivityData.session_count).toFixed(2)
                        : '0.00'}{' '}
                      hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Minutes</span>
                    <span className="font-bold text-primary">{selectedActivityData.total_minutes}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200 text-center">
              <p className="text-gray-500">Select an activity to view details</p>
            </div>
          )}

          {/* Activities Table */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">All Activities ({activities.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedActivities.map((activity) => {
                    const key = activity.activity_id || 'null';
                    return (
                      <tr
                        key={key}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedActivity === key ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => setSelectedActivity(key)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.activity_name || 'Unspecified Activity'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-bold">
                            {activity.total_hours.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{activity.session_count}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, activities.length)} of {activities.length} activities
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

