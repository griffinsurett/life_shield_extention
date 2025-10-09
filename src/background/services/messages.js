/**
 * Messages Service
 * 
 * Handles messages from content scripts and popup.
 * Functional module pattern.
 * 
 * @module background/services/messages
 */

import { isExtensionContextValid } from '../../utils/chrome';
import { createLogger } from '../../utils/logger';
import { getRedirectUrl, shouldShowAlerts } from './settings';
import { incrementStats } from './stats';
import { updateBadge } from './badge';
import { 
  showContentBlockedNotification,
  showCustomNotification,
  showContentFilteredNotification 
} from './notifications';

const logger = createLogger('MessagesService');

/**
 * Initialize messages service
 */
export function initMessages() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping init');
    return;
  }

  logger.info('Initializing messages service');
  setupMessageListener();
}

/**
 * Set up message listener
 */
function setupMessageListener() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping listener');
    return;
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (isExtensionContextValid()) {
        handleMessage(message, sender);
      }
    });
    
    logger.info('Message listener setup complete');
  } catch (error) {
    logger.safeError('Error setting up listener', error);
  }
}

/**
 * Handle incoming message
 * 
 * @async
 * @param {Object} message - Message object
 * @param {Object} sender - Sender info
 * @returns {Promise<void>}
 */
async function handleMessage(message, sender) {
  if (!isExtensionContextValid()) return;

  logger.debug(`Message received: ${message.action}`, {
    showAlerts: shouldShowAlerts()
  });
  
  // Route to appropriate handler
  switch (message.action) {
    case 'blockedUrl':
      await handleBlockedUrl(message, sender);
      break;
      
    case 'showNotification':
      await handleShowNotification(message);
      break;
      
    case 'contentFiltered':
      await handleContentFiltered(message);
      break;
      
    case 'updateBadge':
      await updateBadge();
      break;
      
    default:
      logger.debug(`Unknown action: ${message.action}`);
  }
}

/**
 * Handle blocked URL message
 * 
 * @async
 * @param {Object} message - Message data
 * @param {Object} sender - Sender info
 * @returns {Promise<void>}
 */
async function handleBlockedUrl(message, sender) {
  logger.info(`Blocked URL detected: ${message.url}`);
  
  // Increment stats
  await incrementStats(1);
  
  // Show notification
  await showContentBlockedNotification();
  
  // Redirect if we have a tab
  if (sender.tab && sender.tab.id) {
    chrome.tabs.update(sender.tab.id, { 
      url: getRedirectUrl() || 'https://griffinswebservices.com'
    });
  }
}

/**
 * Handle show notification request
 * 
 * @async
 * @param {Object} message - Message data
 * @returns {Promise<void>}
 */
async function handleShowNotification(message) {
  await showCustomNotification(
    message.title,
    message.message
  );
}

/**
 * Handle content filtered message
 * 
 * @async
 * @param {Object} message - Message data
 * @returns {Promise<void>}
 */
async function handleContentFiltered(message) {
  // Update badge
  await updateBadge();
  
  // Show notification with count
  await showContentFilteredNotification(message.count);
}