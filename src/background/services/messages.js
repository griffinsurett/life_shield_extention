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
import { incrementStats } from "./stats";
import { updateBadge } from "./badge";
import {
  showContentBlockedNotification,
  showCustomNotification,
  showContentFilteredNotification,
} from "./notifications";
import { redirectTab } from "./redirect";
import { iconManager } from "./iconManager";

const logger = createLogger("MessagesService");

export function initMessages() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Initializing messages service");
  setupMessageListener();
}

function setupMessageListener() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listener");
    return;
  }

  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (isExtensionContextValid()) {
        handleMessage(message, sender).then(sendResponse);
        return true;
      }
    });

    logger.info("Message listener setup complete");
  } catch (error) {
    logger.safeError("Error setting up listener", error);
  }
}

async function handleMessage(message, sender) {
  if (!isExtensionContextValid()) return;

  logger.debug(`Message received: ${message.action}`);

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

async function handleBlockedUrl(message, sender) {
  logger.info(`Blocked URL detected: ${message.url}`);

  await incrementStats(1);
  await showContentBlockedNotification();

  // ✅ CLEAN: Just call redirectTab
  if (sender.tab && sender.tab.id) {
    await redirectTab(sender.tab.id, message.url);
  }
}

async function handleShowNotification(message) {
  const { title, body, type } = message;
  await showCustomNotification(title, body, type);
}

async function handleContentFiltered(message) {
  const count = message.count || 1;
  await showContentFilteredNotification(count);
}

async function handleSaveIcon(message) {
  try {
    const result = await iconManager.saveIcon(message.iconData);
    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to save icon", error);
    return { success: false, error: error.message };
  }
}

async function handleSwitchIcon(message) {
  try {
    await iconManager.switchIcon(message.iconId);
    return { success: true };
  } catch (error) {
    logger.error("Failed to switch icon", error);
    return { success: false, error: error.message };
  }
}

async function handleDeleteIcon(message) {
  try {
    await iconManager.deleteIcon(message.iconId);
    return { success: true };
  } catch (error) {
    logger.error("Failed to delete icon", error);
    return { success: false, error: error.message };
  }
}