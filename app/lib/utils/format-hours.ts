/**
 * Format Hours Utility
 * 
 * Formats hours as "HH hrs, MM min" instead of decimal hours
 */

/**
 * Format hours as HH hrs, MM min
 * 
 * @param hours - Decimal hours (e.g., 49.95)
 * @returns Formatted string (e.g., "49 hrs, 57 min")
 */
export function formatHoursAsHrsMin(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0 && minutes === 0) {
    return '0 hrs, 0 min';
  }
  
  if (wholeHours === 0) {
    return `${minutes} min`;
  }
  
  if (minutes === 0) {
    return `${wholeHours} hrs`;
  }
  
  return `${wholeHours} hrs, ${minutes} min`;
}

/**
 * Format hours with a shorter format (e.g., "49h 57m")
 * 
 * @param hours - Decimal hours (e.g., 49.95)
 * @returns Formatted string (e.g., "49h 57m")
 */
export function formatHoursAsHrsMinShort(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0 && minutes === 0) {
    return '0h 0m';
  }
  
  if (wholeHours === 0) {
    return `${minutes}m`;
  }
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

