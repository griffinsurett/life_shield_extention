/**
 * Content Script Entry Point
 *
 * Main content script that runs on every page.
 * Now supports async hashing for protected content.
 *
 * @module content/index
 */

import { isExtensionContextValid } from "../utils/chromeApi";
import { createLogger } from "../utils/logger";
import { WellnessConfig } from "./config";
import { WellnessUtils } from "./modules/WellnessUtils";
import { TextScrubber } from "./modules/TextScrubber";
import { ElementCleaner } from "./modules/ElementCleaner";
import { InputHandler } from "./modules/InputHandler";
import { SiteHandlers } from "./modules/SiteHandlers";
import { EventListeners } from "./modules/EventListeners";

const logger = createLogger("ContentScript");

// =============================================================================
// CRITICAL: Error handlers MUST be first
// =============================================================================

window.addEventListener(
  "error",
  (event) => {
    if (
      event.error &&
      (event.error.message?.includes("Extension context invalidated") ||
        event.error.message?.includes("Cannot access") ||
        event.error.message?.includes("Extension manifest") ||
        event.error.message?.includes("chrome-extension://"))
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  },
  true
);

window.addEventListener(
  "unhandledrejection",
  (event) => {
    const message = event.reason?.message || String(event.reason);
    if (
      message.includes("Extension context invalidated") ||
      message.includes("Cannot access") ||
      message.includes("Extension manifest") ||
      message.includes("chrome-extension://")
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return true;
    }
  },
  true
);

// =============================================================================
// Main content script
// =============================================================================

(async function () {
  "use strict";

  // Check if extension context is valid
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      return;
    }
  } catch {
    return;
  }

  // Load configuration
  const config = new WellnessConfig();
  await config.loadConfig();

  // Initialize modules
  const utils = new WellnessUtils(config);

  logger.info(`Active on: ${window.location.hostname}`);

  const textScrubber = new TextScrubber(utils);
  const elementCleaner = new ElementCleaner(config, utils);
  const inputHandler = new InputHandler(config, utils);
  const siteHandlers = new SiteHandlers(config, utils, inputHandler);
  const eventListeners = new EventListeners(utils);

  // State tracking
  let lastCleanTime = 0;
  let mutationTimer = null;
  let totalFilteredThisPage = 0;
  let hasNotifiedThisPage = false;
  let isShuttingDown = false;

  /**
   * Throttled cleaning function (now async)
   */
  async function throttledClean(container = document.body) {
    if (isShuttingDown) return;

    if (!config.ENABLED) {
      return;
    }

    if (!isExtensionContextValid()) {
      isShuttingDown = true;
      logger.warn("Extension context invalidated, shutting down");
      return;
    }

    const now = Date.now();

    if (now - lastCleanTime < config.MIN_CLEAN_INTERVAL) {
      return;
    }
    lastCleanTime = now;

    if (container) {
      try {
        // Async scrubbing with hashing
        const textCount = await textScrubber.scrubTextNodesIn(container);
        await elementCleaner.hideBlockedElements(container);
        const inputCount = inputHandler.attachToInputs(container);

        if (textCount > 0 || inputCount > 0) {
          logger.debug(
            `Cleaned ${textCount} text nodes, ${inputCount} new inputs`
          );
          totalFilteredThisPage += textCount;

          if (!hasNotifiedThisPage && totalFilteredThisPage >= 5) {
            utils.notifyContentFiltered(totalFilteredThisPage);
            hasNotifiedThisPage = true;
          }
        }
      } catch (error) {
        logger.safeError("Error during cleaning", error);
        if (error.message?.includes("Extension context invalidated")) {
          isShuttingDown = true;
          return;
        }
      }
    }

    try {
      await utils.checkURL();
    } catch (error) {
      if (error.message?.includes("Extension context invalidated")) {
        isShuttingDown = true;
      }
    }
  }

  /**
   * Initialize content script
   */
  function initialize() {
    if (!config.ENABLED) {
      logger.info("Content filter is disabled, not initializing");
      return;
    }

    try {
      elementCleaner.injectStyles();

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          if (!isShuttingDown && config.ENABLED) throttledClean();
        });
      } else {
        throttledClean();
      }

      // Early scans
      config.EARLY_SCAN_DELAYS.forEach((delay) => {
        setTimeout(() => {
          if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED)
            return;

          const newInputs = inputHandler.attachToInputs(document);
          if (newInputs > 0) {
            logger.debug(`Early scan found ${newInputs} inputs at ${delay}ms`);
          }
        }, delay);
      });

      // Mutation observer
      const observer = new MutationObserver((mutations) => {
        if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED) {
          observer.disconnect();
          if (!config.ENABLED)
            logger.info("Filter disabled, disconnecting observer");
          isShuttingDown = true;
          return;
        }

        if (mutationTimer) {
          clearTimeout(mutationTimer);
        }

        const addedNodes = [];
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              addedNodes.push(node);
            }
          });
        });

        if (addedNodes.length === 0) return;

        mutationTimer = setTimeout(() => {
          if (isShuttingDown || !config.ENABLED) return;

          addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              throttledClean(node);
            }
          });
        }, config.MUTATION_DEBOUNCE);
      });

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      // Regular scan
      const scanInterval = setInterval(() => {
        if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED) {
          clearInterval(scanInterval);
          isShuttingDown = true;
          return;
        }
        throttledClean();
      }, config.SCAN_INTERVAL);

      // Input safety net
      const inputScanInterval = setInterval(() => {
        if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED) {
          clearInterval(inputScanInterval);
          isShuttingDown = true;
          return;
        }

        const missedInputs = inputHandler.attachToInputs(document);
        if (missedInputs > 0) {
          logger.debug(`Safety net caught ${missedInputs} missed inputs`);
        }
      }, config.INPUT_SCAN_INTERVAL);

      eventListeners.init();
      siteHandlers.init();

      logger.info("Wellness filter active with hashed content protection!");
    } catch (error) {
      logger.safeError("Error during initialization", error);
      if (error.message?.includes("Extension context invalidated")) {
        isShuttingDown = true;
        return;
      }
    }
  }

  initialize();
})();