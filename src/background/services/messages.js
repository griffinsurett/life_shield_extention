/**
 * Messages Service
 *
 * Handles messages from content scripts and popup.
 * Functional module pattern.
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
 */
function setupMessageListener() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listener");
    return;
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (isExtensionContextValid()) {
        handleMessage(message, sender).then(sendResponse);
        return true; // Will respond asynchronously
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
 * @async
 * @param {Object} message - Message object
 * @param {Object} sender - Sender info
 * @returns {Promise<any>}
 */
async function handleMessage(message, sender) {
  if (!isExtensionContextValid()) return;

  logger.debug(`Message received: ${message.action}`);

  // Route to appropriate handler
  switch (message.action) {
    case "blockedUrl":
      await handleBlockedUrl(message, sender);
      return;

    case "showNotification":
      await handleShowNotification(message);
      return;

    case "contentFiltered":
      await handleContentFiltered(message);
      return;

    case "updateBadge":
      await updateBadge();
      return;

    case "saveIcon":
      return await handleSaveIcon(message);

    case "switchIcon":
      return await handleSwitchIcon(message);

    case "deleteIcon":
      return await handleDeleteIcon(message);

    default:
      logger.debug(`Unknown action: ${message.action}`);
      return;
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
      url: getRedirectUrlWithFallback(getRedirectUrl()),
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
  await showCustomNotification(message.title, message.message);
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

/**
 * Handle save icon message (icon already processed in UI)
 */
async function handleSaveIcon(message) {
  try {
    logger.info('Saving icon', { name: message.iconData?.name });
    const { iconData } = message;
    const icon = await iconManager.saveIcon(iconData);
    return { success: true, icon };
  } catch (error) {
    logger.error('Save icon failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle switch icon message
 */
async function handleSwitchIcon(message) {
  try {
    logger.info('Switching icon', { iconId: message.iconId });
    await iconManager.switchIcon(message.iconId);
    return { success: true };
  } catch (error) {
    logger.error('Switch icon failed', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle delete icon message
 */
async function handleDeleteIcon(message) {
  try {
    logger.info('Deleting icon', { iconId: message.iconId });
    await iconManager.deleteIcon(message.iconId);
    return { success: true };
  } catch (error) {
    logger.error('Delete icon failed', error);
    return { success: false, error: error.message };
  }
}