/**
 * Messages Service
 *
 * Central hub for handling all inter-component communication in the extension.
 * Acts as a message router between content scripts, popup, and background services.
 * 
 * Handles messages for:
 * - Content blocking notifications
 * - Badge updates
 * - Custom icon management
 * - Statistics updates
 * 
 * Message Flow:
 * Content Script → messages.js → Appropriate Service → Action
 * 
 * @module background/services/messages
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import { getRedirectUrl } from "./settings";
import { incrementStats } from "./stats";
import { updateBadge } from "./badge";
import {
  showContentBlockedNotification,
  showCustomNotification,
  showContentFilteredNotification,
} from "./notifications";
import { getRedirectUrlWithFallback } from "../../utils/builders";
import { iconManager } from "./iconManager";

const logger = createLogger("MessagesService");

/**
 * Initialize messages service
 * Sets up the message listener to handle all incoming messages
 * 
 * @returns {void}
 */
export function initMessages() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Initializing messages service");
  setupMessageListener();
}

/**
 * Set up message listener
 * 
 * Creates a persistent listener for chrome.runtime.onMessage events.
 * Routes messages to appropriate handlers based on action type.
 * 
 * Returns true to indicate async response (required for sendResponse to work)
 * 
 * @returns {void}
 */
function setupMessageListener() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listener");
    return;
  }

  try {
    // Add listener for all runtime messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Verify context is still valid before processing
      if (isExtensionContextValid()) {
        // Handle message and send response when complete
        handleMessage(message, sender).then(sendResponse);
        return true; // Indicates async response - CRITICAL for chrome.runtime.sendMessage
      }
    });

    logger.info("Message listener setup complete");
  } catch (error) {
    logger.safeError("Error setting up listener", error);
  }
}

/**
 * Handle incoming message
 * 
 * Main router function that directs messages to appropriate handlers.
 * Each action type corresponds to a specific handler function.
 * 
 * Supported actions:
 * - blockedUrl: When content script detects blocked URL
 * - showNotification: Display a custom notification
 * - contentFiltered: When content is filtered from page
 * - updateBadge: Refresh the extension badge count
 * - saveIcon: Save a new custom icon
 * - switchIcon: Change active icon
 * - deleteIcon: Remove a custom icon
 *
 * @async
 * @param {Object} message - Message object with 'action' property
 * @param {string} message.action - Type of action to perform
 * @param {Object} sender - Information about message sender
 * @param {Tab} sender.tab - Tab that sent the message
 * @returns {Promise<any>} Response data for the sender
 */
async function handleMessage(message, sender) {
  if (!isExtensionContextValid()) return;

  logger.debug(`Message received: ${message.action}`);

  // Route to appropriate handler based on action type
  switch (message.action) {
    case "blockedUrl":
      // Content script detected a URL with blocked words
      await handleBlockedUrl(message, sender);
      return;

    case "showNotification":
      // Request to show a custom notification
      await handleShowNotification(message);
      return;

    case "contentFiltered":
      // Content was filtered on a page (text scrubbed)
      await handleContentFiltered(message);
      return;

    case "updateBadge":
      // Request to refresh badge count
      await updateBadge();
      return;

    case "saveIcon":
      // Save a new custom icon (from settings UI)
      return await handleSaveIcon(message);

    case "switchIcon":
      // Switch to a different icon
      return await handleSwitchIcon(message);

    case "deleteIcon":
      // Delete a custom icon
      return await handleDeleteIcon(message);

    default:
      // Unknown action - log and ignore
      logger.debug(`Unknown action: ${message.action}`);
      return;
  }
}

/**
 * Handle blocked URL message
 * 
 * Called when content script detects a URL containing blocked content.
 * 
 * Actions performed:
 * 1. Increment block statistics
 * 2. Show notification (if enabled)
 * 3. Redirect tab to safe URL
 *
 * @async
 * @param {Object} message - Message data
 * @param {string} message.url - The blocked URL
 * @param {Object} sender - Sender information
 * @param {Tab} sender.tab - Tab containing blocked URL
 * @returns {Promise<void>}
 */
async function handleBlockedUrl(message, sender) {
  logger.info(`Blocked URL detected: ${message.url}`);

  // Update statistics (increment today count and total count)
  await incrementStats(1);

  // Show notification to user (if alerts enabled)
  await showContentBlockedNotification();

  // Redirect the tab to safe URL
  if (sender.tab && sender.tab.id) {
    chrome.tabs.update(sender.tab.id, {
      url: getRedirectUrlWithFallback(getRedirectUrl()),
    });
  }
}

/**
 * Handle show notification request
 * 
 * Displays a custom notification with provided title and message.
 * Used by content scripts that can't directly access notifications API.
 *
 * @async
 * @param {Object} message - Message data
 * @param {string} message.title - Notification title
 * @param {string} message.message - Notification message
 * @returns {Promise<void>}
 */
async function handleShowNotification(message) {
  await showCustomNotification(message.title, message.message);
}

/**
 * Handle content filtered message
 * 
 * Called when content script filters text on a page (replaces blocked words).
 * Updates badge and shows notification with count of filtered items.
 *
 * @async
 * @param {Object} message - Message data
 * @param {number} message.count - Number of items filtered
 * @returns {Promise<void>}
 */
async function handleContentFiltered(message) {
  // Update badge with current today count
  await updateBadge();

  // Show notification with number of items filtered
  await showContentFilteredNotification(message.count);
}

/**
 * Handle save icon message
 * 
 * Receives processed icon data from UI and saves to storage.
 * Icon processing (resizing, format conversion) happens in UI context,
 * not here - we just receive the final processed data.
 * 
 * @async
 * @param {Object} message - Message data
 * @param {Object} message.iconData - Processed icon data with all sizes
 * @param {string} message.iconData.name - Icon name
 * @param {string} message.iconData.originalDataUrl - Original image as data URL
 * @param {string} message.iconData.type - Image type (png, svg, etc)
 * @param {Object} message.iconData.sizes - Icon at all required sizes (16, 48, 128)
 * @returns {Promise<Object>} Response with success status and saved icon
 */
async function handleSaveIcon(message) {
  try {
    logger.info('Saving icon', { name: message.iconData?.name });
    const { iconData } = message;
    
    // Save to storage via icon manager
    const icon = await iconManager.saveIcon(iconData);
    
    // Return success with saved icon data
    return { success: true, icon };
  } catch (error) {
    logger.error('Save icon failed', error);
    // Return error for UI to display
    return { success: false, error: error.message };
  }
}

/**
 * Handle switch icon message
 * 
 * Changes the active extension icon to a different one.
 * Can switch to custom icon or back to default.
 * 
 * @async
 * @param {Object} message - Message data
 * @param {string} message.iconId - ID of icon to switch to ('default' or custom icon ID)
 * @returns {Promise<Object>} Response with success status
 */
async function handleSwitchIcon(message) {
  try {
    logger.info('Switching icon', { iconId: message.iconId });
    
    // Switch icon via icon manager
    await iconManager.switchIcon(message.iconId);
    
    return { success: true };
  } catch (error) {
    logger.error('Switch icon failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle delete icon message
 * 
 * Removes a custom icon from storage.
 * If the deleted icon was active, automatically switches back to default.
 * 
 * @async
 * @param {Object} message - Message data
 * @param {string} message.iconId - ID of icon to delete
 * @returns {Promise<Object>} Response with success status
 */
async function handleDeleteIcon(message) {
  try {
    logger.info('Deleting icon', { iconId: message.iconId });
    
    // Delete icon via icon manager
    await iconManager.deleteIcon(message.iconId);
    
    return { success: true };
  } catch (error) {
    logger.error('Delete icon failed', error);
    return { success: false, error: error.message };
  }
}