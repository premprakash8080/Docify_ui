/**
 * Date formatting utilities for notes components
 * Centralized date formatting logic to avoid duplication
 */

/**
 * Formats a date string to a relative time or date format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Just now", "5m ago", "26 Nov")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // Format as date (e.g., "26 Nov")
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Formats a date string to a short date format (e.g., "26 Nov")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Formats a date string for preview cards (e.g., "2:30 PM", "Yesterday", "Mon", "Nov 26")
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatPreviewDate(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Formats time since a date (e.g., "Just now", "5s ago", "2m ago")
 * @param date - Date object or null
 * @returns Formatted time string
 */
export function formatTimeSince(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 5) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  
  const diffMins = Math.floor(diffSecs / 60);
  return `${diffMins}m ago`;
}
