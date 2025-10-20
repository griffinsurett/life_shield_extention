/**
 * Navigation Service
 *
 * Intercepts browser navigation to block URLs with forbidden content.
 * Now supports hashed blocked sites.
 *
 * @module background/services/navigation
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import {
  containsBlockedWord,
  containsBlockedSite,
  isFilterEnabled,
} from "./settings";
import { incrementStats } from "./stats";
import {
  showContentBlockedNotification,
  showSearchBlockedNotification,
} from "./notifications";
import { redirectTab } from "./redirect";

const logger = createLogger("NavigationService");

function isExcludedUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('chrome-extension://') ||
    url.startsWith('chrome://') ||
    url.startsWith('about:')
  );
}

export function initNavigation() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  logger.info("Initializing navigation service");
  setupNavigationListeners();
}

function setupNavigationListeners() {
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (isExtensionContextValid()) {
        handleBeforeNavigate(details);
      }
    });

    chrome.webNavigation.onCommitted.addListener((details) => {
      if (isExtensionContextValid()) {
        handleCommitted(details);
      }
    });

    logger.info("Navigation listeners setup complete");
  } catch (error) {
    logger.safeError("Error setting up listeners", error);
  }
}

async function handleBeforeNavigate(details) {
  if (!isExtensionContextValid()) return;
  if (!isFilterEnabled()) return;
  if (details.frameId !== 0) return;

  const url = details.url;

  if (isExcludedUrl(url)) {
    logger.debug(`Excluded URL (extension page): ${url}`);
    return;
  }

  // Check if URL contains blocked site (using hash comparison)
  if (await containsBlockedSite(url)) {
    logger.info(`Intercepted navigation with blocked site (hash matched): ${url}`);

    await incrementStats(1);
    await showContentBlockedNotification();

    // Redirect
    await redirectTab(details.tabId, url);
  }
}

async function handleCommitted(details) {
  if (!isExtensionContextValid()) return;
  if (!isFilterEnabled()) return;
  if (details.frameId !== 0) return;

  const url = details.url;

  if (isExcludedUrl(url)) {
    logger.debug(`Excluded URL (extension page): ${url}`);
    return;
  }

  try {
    const urlObj = new URL(url);
    const query =
      urlObj.searchParams.get("q") ||
      urlObj.searchParams.get("query") ||
      urlObj.searchParams.get("p") ||
      "";

    // Check query parameters for blocked words (using hash comparison)
    if (await containsBlockedWord(query)) {
      logger.info("Blocked query parameter detected (hash matched)");

      await incrementStats(1);
      await showSearchBlockedNotification();

      // Redirect
      await redirectTab(details.tabId, url);
    }
  } catch (error) {
    logger.debug(`Error parsing URL: ${url}`, error);
  }
}