'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value);
  };

  const setLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  const setLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  const setThisWeek = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={setLast7Days}
            className="px-3 py-2 text-sm bg-secondary-light text-primary rounded-md hover:bg-secondary DEFAULT transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={setLast30Days}
            className="px-3 py-2 text-sm bg-secondary-light text-primary rounded-md hover:bg-secondary DEFAULT transition-colors"
          >
            Last 30 Days
          </button>
          <button
            onClick={setThisWeek}
            className="px-3 py-2 text-sm bg-secondary-light text-primary rounded-md hover:bg-secondary DEFAULT transition-colors"
          >
            This Week
          </button>
        </div>
      </div>
    </div>
  );
}

