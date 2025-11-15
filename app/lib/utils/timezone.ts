/**
 * Timezone utility functions
 */

/**
 * Convert a UTC timestamp to a local timezone
 */
export function convertToTimezone(utcTimestamp: string, timezone: string): Date {
  // Create date from UTC timestamp
  const utcDate = new Date(utcTimestamp);
  
  // Use Intl.DateTimeFormat to convert to target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcDate);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Convert a local timezone timestamp to UTC
 */
export function convertToUTC(localTimestamp: string, timezone: string): Date {
  // Parse the local timestamp
  const localDate = new Date(localTimestamp);
  
  // Get the UTC offset for the timezone at this date
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  
  return new Date(localDate.getTime() + offset);
}

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(date: Date | string, timezone: string, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
  };

  if (format === 'date') {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit';
  } else if (format === 'time') {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  } else {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit';
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Calculate duration in hours between two timestamps
 */
export function calculateHours(startTime: string | Date, endTime: string | Date): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Calculate duration in minutes between two timestamps
 */
export function calculateMinutes(startTime: string | Date, endTime: string | Date): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Format hours as human-readable string (e.g., "8h 30m")
 */
export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Get start and end of a date range in UTC
 */
export function getDateRangeUTC(startDate: string, endDate: string): { startUTC: string; endUTC: string } {
  // Parse dates (assuming YYYY-MM-DD format)
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);
  
  return {
    startUTC: start.toISOString(),
    endUTC: end.toISOString(),
  };
}

/**
 * Get start and end of week in UTC (Monday to Sunday)
 */
export function getWeekRangeUTC(date: Date = new Date()): { startUTC: string; endUTC: string } {
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff, 0, 0, 0));
  const sunday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff + 6, 23, 59, 59, 999));
  
  return {
    startUTC: monday.toISOString(),
    endUTC: sunday.toISOString(),
  };
}

/**
 * Pacific Timezone utilities
 */

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Get current date in Pacific timezone
 * Returns date in YYYY-MM-DD format
 */
export function getPacificDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value || '0';
  const month = parts.find(p => p.type === 'month')?.value || '0';
  const day = parts.find(p => p.type === 'day')?.value || '0';
  
  return `${year}-${month}-${day}`;
}

/**
 * Get previous day's date in Pacific timezone
 * Returns date in YYYY-MM-DD format
 */
export function getPreviousDayPacific(): string {
  const now = new Date();
  
  // Get current date in Pacific
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE }));
  
  // Subtract one day
  pacificDate.setDate(pacificDate.getDate() - 1);
  
  // Format as YYYY-MM-DD
  const year = pacificDate.getFullYear();
  const month = String(pacificDate.getMonth() + 1).padStart(2, '0');
  const day = String(pacificDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get a specific date in Pacific timezone
 * @param dateString - Optional date string (YYYY-MM-DD) or Date object. If not provided, uses current date.
 * @returns Date in YYYY-MM-DD format in Pacific timezone
 */
export function getPacificDateForDate(dateString?: string | Date): string {
  const date = dateString 
    ? (typeof dateString === 'string' ? new Date(dateString + 'T12:00:00Z') : dateString)
    : new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '0';
  const month = parts.find(p => p.type === 'month')?.value || '0';
  const day = parts.find(p => p.type === 'day')?.value || '0';
  
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of a day in Pacific timezone, converted to UTC
 * @param dateString - Date in YYYY-MM-DD format (Pacific timezone)
 * @returns Object with startUTC and endUTC ISO strings
 */
export function getDateRangePacific(dateString: string): { startUTC: string; endUTC: string } {
  // Parse the date
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Calculate Pacific timezone offset for this date
  // Create a reference date at noon UTC on the target date
  const testUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Format this UTC date in Pacific timezone to get the hour
  const testPacificHour = parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    hour: '2-digit',
    hour12: false,
  }).format(testUTC));
  
  // Calculate offset: if noon UTC shows as 4 AM Pacific, offset is +8 hours (PST)
  // If noon UTC shows as 5 AM Pacific, offset is +7 hours (PDT)
  // This means midnight Pacific = (8 or 7) AM UTC on the same date
  const offsetHours = 12 - testPacificHour;
  
  // Create start and end dates in UTC
  // Midnight Pacific = (offsetHours) AM UTC on the same date
  // End of day Pacific = (offsetHours) AM UTC on the next date, minus 1 second
  const startUTC = new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0));
  const endUTC = new Date(Date.UTC(year, month - 1, day, offsetHours + 24, 0, 0));
  endUTC.setSeconds(endUTC.getSeconds() - 1);
  endUTC.setMilliseconds(999);
  
  return {
    startUTC: startUTC.toISOString(),
    endUTC: endUTC.toISOString(),
  };
}

