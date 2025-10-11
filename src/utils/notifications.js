/**
 * Notification Utilities
 * 
 * Helper functions for showing browser notifications.
 * Provides simple interface for common notification patterns.
 * 
 * Note: These are direct notification functions.
 * For more control, use NotificationManager in background script.
 * 
 * @module utils/notifications
 */

/**
 * Show a browser notification
 * Creates a basic notification with title and message
 * 
 * Only works if chrome.notifications API is available
 * (i.e., only in extension context, not in web pages)
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * 
 * @example
 * showNotification('Success', 'Settings saved!');
 */
export const showNotification = (title, message) => {
  // Check if notifications API is available
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: title,
      message: message,
      priority: 1
    });
  }
};

/**
 * Send notification request to background script
 * Use this from content scripts to show notifications
 * 
 * Content scripts can't directly use chrome.notifications,
 * so they send a message to background script instead
 * 
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * 
 * @example
 * sendNotificationRequest('Content Blocked', 'Redirecting...');
 */
export const sendNotificationRequest = (title, message) => {
  chrome.runtime.sendMessage({
    action: 'showNotification',
    title,
    message
  });
};