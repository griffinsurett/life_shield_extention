/**
 * Badge Service
 * 
 * Manages the extension badge (icon badge counter).
 * Functional module pattern - no classes.
 * 
 * @module background/services/badge
 */

import { isExtensionContextValid, safeChrome, safeChromeAsync } from '../../utils/chrome';
import { BADGE_UPDATE_INTERVAL } from '../../utils/timing';
import { createLogger } from '../../utils/logger';

const logger = createLogger('BadgeService');

/**
 * Initialize badge service
 * Sets up periodic updates
 */
export function initBadge() {
  logger.info('Initializing badge service');
  
  // Initial update
  updateBadge();
  
  // Update every minute
  setInterval(() => {
    if (isExtensionContextValid()) {
      updateBadge();
    }
  }, BADGE_UPDATE_INTERVAL);
}

/**
 * Update badge with current today count
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function updateBadge() {
  if (!isExtensionContextValid()) {
    logger.debug('Context invalid, skipping badge update');
    return;
  }

  try {
    logger.chromeAPI('storage.local.get', ['todayCount']);
    const result = await safeChromeAsync(
      () => chrome.storage.local.get(['todayCount']),
      { todayCount: 0 }
    );
    
    const count = result.todayCount || 0;

    if (count > 0) {
      safeChrome(() => {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
      });
      logger.debug(`Badge updated: ${count}`);
    } else {
      safeChrome(() => chrome.action.setBadgeText({ text: '' }));
      logger.debug('Badge cleared');
    }
  } catch (error) {
    logger.safeError('Failed to update badge', error);
  }
}

/**
 * Set badge to specific count
 * 
 * @async
 * @param {number} count - Count to display
 * @returns {Promise<void>}
 */
export async function setBadgeCount(count) {
  if (!isExtensionContextValid()) {
    return;
  }

  try {
    if (count > 0) {
      safeChrome(() => {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
      });
    } else {
      safeChrome(() => chrome.action.setBadgeText({ text: '' }));
    }
    logger.debug(`Badge count set: ${count}`);
  } catch (error) {
    logger.safeError('Failed to set badge count', error);
  }
}