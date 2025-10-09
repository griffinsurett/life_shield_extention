/**
 * Notifications Service
 * 
 * Manages browser notifications.
 * Functional module pattern.
 * 
 * @module background/services/notifications
 */

import { isExtensionContextValid, getResourceURL } from '../../utils/chrome';
import { createLogger } from '../../utils/logger';
import { shouldShowAlerts } from './settings';

const logger = createLogger('NotificationsService');

// Get icon URL
const iconUrl = getResourceURL('icons/icon48.png');

/**
 * Create a notification
 * 
 * @async
 * @param {string} id - Notification ID
 * @param {Object} options - Notification options
 * @returns {Promise<string|null>}
 */
async function createNotification(id, options) {
  if (!isExtensionContextValid()) return null;

  return new Promise((resolve) => {
    const notificationOptions = {
      type: 'basic',
      iconUrl: iconUrl,
      ...options
    };

    const callback = (notificationId) => {
      if (chrome.runtime.lastError) {
        logger.error('Notification error', chrome.runtime.lastError);
        resolve(null);
      } else {
        logger.debug(`Notification created: ${notificationId}`);
        resolve(notificationId);
      }
    };

    if (id) {
      chrome.notifications.create(id, notificationOptions, callback);
    } else {
      chrome.notifications.create(notificationOptions, callback);
    }
  });
}

/**
 * Show startup notification
 * 
 * @async
 * @returns {Promise<string|null>}
 */
export async function showStartupNotification() {
  return createNotification('test-startup', {
    title: '🌿 Wellness Filter Active',
    message: 'Extension loaded successfully!',
    priority: 2
  });
}

/**
 * Show welcome notification
 * 
 * @async
 * @returns {Promise<string|null>}
 */
export async function showWelcomeNotification() {
  return createNotification('welcome', {
    title: '🌿 Welcome to Wellness Filter!',
    message: 'Your extension is now active and protecting your browsing experience.',
    priority: 2
  });
}

/**
 * Show content blocked notification
 * 
 * @async
 * @returns {Promise<string|null>}
 */
export async function showContentBlockedNotification() {
  if (!shouldShowAlerts()) return null;
  
  return createNotification(null, {
    title: '🌿 Content Blocked',
    message: 'Redirecting to a healthier page...',
    priority: 1
  });
}

/**
 * Show URL blocked notification
 * 
 * @async
 * @returns {Promise<string|null>}
 */
export async function showUrlBlockedNotification() {
  if (!shouldShowAlerts()) return null;
  
  return createNotification(null, {
    title: '🌿 URL Blocked',
    message: 'This URL contains blocked content',
    priority: 1
  });
}

/**
 * Show search blocked notification
 * 
 * @async
 * @returns {Promise<string|null>}
 */
export async function showSearchBlockedNotification() {
  if (!shouldShowAlerts()) return null;
  
  return createNotification(null, {
    title: '🌿 Search Blocked',
    message: 'Your search contained blocked content',
    priority: 1
  });
}

/**
 * Show content filtered notification
 * 
 * @async
 * @param {number} count - Items filtered
 * @returns {Promise<string|null>}
 */
export async function showContentFilteredNotification(count) {
  if (!shouldShowAlerts()) return null;
  
  return createNotification(null, {
    title: '🌿 Content Filtered',
    message: `Blocked ${count} item(s) on this page`,
    priority: 0
  });
}

/**
 * Show custom notification
 * 
 * @async
 * @param {string} title - Title
 * @param {string} message - Message
 * @returns {Promise<string|null>}
 */
export async function showCustomNotification(title, message) {
  if (!shouldShowAlerts()) return null;
  
  return createNotification(null, {
    title: title || '🌿 Wellness Filter',
    message: message || 'Content filtered',
    priority: 1
  });
}