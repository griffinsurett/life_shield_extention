/**
 * Content Script Entry Point
 *
 * Main content script that runs on every page.
 * Coordinates all content filtering and blocking operations.
 * 
 * Architecture:
 * - Functional modules (no classes)
 * - Event-driven with mutation observer
 * - Periodic scanning for dynamic content
 * - Site-specific handlers for major sites
 * 
 * Initialization Flow:
 * 1. Load configuration from storage
 * 2. Inject CSS styles
 * 3. Initial page scan
 * 4. Set up mutation observer
 * 5. Start periodic scans
 * 6. Attach input listeners
 * 7. Site-specific setup
 * 
 * Performance Strategy:
 * - Throttled cleaning (max once per 500ms)
 * - Debounced mutation handling
 * - Efficient DOM traversal
 * - Weak references for processed elements
 * 
 * Error Handling:
 * - Global error handlers MUST be first
 * - Graceful shutdown on context invalidation
 * - Safe error suppression for expected failures
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
// CRITICAL: Error handlers MUST be first - before any imports
// =============================================================================

/**
 * Global error handler for extension context invalidation
 * 
 * Why first?
 * - Must catch errors from imports and initialization
 * - Prevents error spam in console
 * - Required for clean extension reloads
 * 
 * Context invalidation happens when:
 * - Extension is reloaded/updated
 * - Chrome crashes and recovers
 * - Extension is disabled/enabled
 * 
 * This handler suppresses these expected errors silently.
 */
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
      // Prevent error from propagating
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      return true; // Indicate handled
    }
  },
  true // Use capture phase to catch early
);

/**
 * Global promise rejection handler
 * 
 * Catches unhandled promise rejections related to extension context.
 * Similar to error handler but for async code.
 * 
 * Common scenarios:
 * - chrome.runtime.sendMessage() after reload
 * - chrome.storage.get() after context invalidated
 * - chrome.tabs.update() on destroyed tabs
 */
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
      // Prevent error from propagating
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      return true; // Indicate handled
    }
  },
  true // Use capture phase
);

// =============================================================================
// Main content script
// =============================================================================

/**
 * Main IIFE (Immediately Invoked Function Expression)
 * 
 * Why IIFE?
 * - Encapsulates variables in function scope
 * - Prevents global namespace pollution
 * - Allows async/await at top level
 * - Clear initialization pattern
 */
(async function () {
  "use strict"; // Enforce strict mode for better error catching

  // Check if extension context is valid before starting
  // Prevents errors if script loads during extension reload
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      return; // Silently exit if context invalid
    }
  } catch {
    return; // Silently exit on any error
  }

  // ===== INITIALIZATION =====
  
  // Load configuration from storage
  const config = new WellnessConfig();
  await config.loadConfig();

  // Initialize utility helpers
  const utils = new WellnessUtils(config);

  logger.info(`Active on: ${window.location.hostname}`);

  // Initialize functional modules
  const textScrubber = new TextScrubber(utils);
  const elementCleaner = new ElementCleaner(config, utils);
  const inputHandler = new InputHandler(config, utils);
  const siteHandlers = new SiteHandlers(config, utils, inputHandler);
  const eventListeners = new EventListeners(utils);

  // ===== STATE TRACKING =====
  
  let lastCleanTime = 0;              // Last time page was cleaned (throttling)
  let mutationTimer = null;            // Timer for debounced mutation handling
  let totalFilteredThisPage = 0;      // Total items filtered on current page
  let hasNotifiedThisPage = false;    // Whether we've shown notification
  let isShuttingDown = false;         // Shutdown flag for clean exit

  /**
   * Throttled cleaning function
   * 
   * Main workhorse function that processes the page.
   * Throttled to prevent excessive processing.
   * 
   * Operations performed:
   * 1. Check if filter is enabled
   * 2. Check throttle timing
   * 3. Scrub text nodes (replace blocked words)
   * 4. Hide blocked elements (links, buttons)
   * 5. Attach to new inputs
   * 6. Check current URL
   * 
   * Throttling:
   * - Prevents function from running too frequently
   * - Max once per MIN_CLEAN_INTERVAL (500ms)
   * - Reduces CPU usage on dynamic sites
   * 
   * @param {Element} container - DOM element to clean (default: document.body)
   * @returns {void}
   */
  function throttledClean(container = document.body) {
    // Check shutdown flag
    if (isShuttingDown) return;

    // CHECK IF FILTER IS ENABLED
    // This is the FIRST check in content script
    // If disabled, nothing runs at all
    if (!config.ENABLED) {
      return; // Skip all filtering if disabled
    }

    // Check extension context validity
    if (!isExtensionContextValid()) {
      isShuttingDown = true;
      logger.warn("Extension context invalidated, shutting down");
      return;
    }

    // Check throttle timing
    const now = Date.now();
    if (now - lastCleanTime < config.MIN_CLEAN_INTERVAL) {
      return; // Too soon - skip this call
    }
    lastCleanTime = now;

    // Process the container
    if (container) {
      try {
        // Scrub text nodes (replace blocked words with replacement phrases)
        const textCount = textScrubber.scrubTextNodesIn(container);
        
        // Hide blocked elements (links/buttons with blocked content)
        elementCleaner.hideBlockedElements(container);
        
        // Attach to new input fields
        const inputCount = inputHandler.attachToInputs(container);

        // Log if we did anything
        if (textCount > 0 || inputCount > 0) {
          logger.debug(
            `Cleaned ${textCount} text nodes, ${inputCount} new inputs`
          );
          
          // Track total filtered
          totalFilteredThisPage += textCount;

          // Show notification after 5+ items filtered
          if (!hasNotifiedThisPage && totalFilteredThisPage >= 5) {
            utils.notifyContentFiltered(totalFilteredThisPage);
            hasNotifiedThisPage = true;
          }
        }
      } catch (error) {
        logger.safeError("Error during cleaning", error);
        
        // Check if this is a context invalidation error
        if (error.message?.includes("Extension context invalidated")) {
          isShuttingDown = true;
          return;
        }
      }
    }

    // Check URL for blocked content
    try {
      utils.checkURL();
    } catch (error) {
      if (error.message?.includes("Extension context invalidated")) {
        isShuttingDown = true;
      }
    }
  }

  /**
   * Initialize content script
   * 
   * Setup flow:
   * 1. Check if filter is enabled
   * 2. Inject CSS styles
   * 3. Initial page scan (or wait for DOMContentLoaded)
   * 4. Early scans for dynamic inputs
   * 5. Set up mutation observer
   * 6. Start periodic scanning
   * 7. Start input safety net
   * 8. Initialize event listeners
   * 9. Initialize site-specific handlers
   * 
   * @returns {void}
   */
  function initialize() {
    // CHECK IF FILTER IS ENABLED BEFORE INITIALIZING
    if (!config.ENABLED) {
      logger.info("Content filter is disabled, not initializing");
      return;
    }

    try {
      // Inject CSS for hiding elements
      elementCleaner.injectStyles();

      // Initial scan - depends on document ready state
      if (document.readyState === "loading") {
        // Wait for DOM to load
        document.addEventListener("DOMContentLoaded", () => {
          if (!isShuttingDown && config.ENABLED) throttledClean();
        });
      } else {
        // DOM already loaded - scan immediately
        throttledClean();
      }

      // Early scans for dynamic inputs
      // Many sites load inputs after initial page load
      // These scans catch them before the main periodic scan
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

      // ===== MUTATION OBSERVER =====
      // Watches for DOM changes and triggers cleaning
      
      const observer = new MutationObserver((mutations) => {
        // Check validity and enabled state
        if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED) {
          observer.disconnect();
          if (!config.ENABLED)
            logger.info("Filter disabled, disconnecting observer");
          isShuttingDown = true;
          return;
        }

        // Clear existing timer
        if (mutationTimer) {
          clearTimeout(mutationTimer);
        }

        // Collect added nodes
        const addedNodes = [];
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              addedNodes.push(node);
            }
          });
        });

        // If no nodes added, skip
        if (addedNodes.length === 0) return;

        // Debounce: Wait for mutations to settle before processing
        // This batches rapid changes together for efficiency
        mutationTimer = setTimeout(() => {
          if (isShuttingDown || !config.ENABLED) return;

          // Process each added node
          addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              throttledClean(node);
            }
          });
        }, config.MUTATION_DEBOUNCE);
      });

      // Start observing when body is available
      if (document.body) {
        observer.observe(document.body, {
          childList: true,  // Watch for added/removed nodes
          subtree: true,    // Watch entire subtree
        });
      }

      // ===== PERIODIC SCANNING =====
      // Regular full-page scans catch anything observer missed
      
      const scanInterval = setInterval(() => {
        if (isShuttingDown || !isExtensionContextValid() || !config.ENABLED) {
          clearInterval(scanInterval);
          isShuttingDown = true;
          return;
        }
        throttledClean();
      }, config.SCAN_INTERVAL);

      // ===== INPUT SAFETY NET =====
      // Periodic scan specifically for inputs
      // Some inputs are created without triggering mutations
      
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

      // Initialize event listeners (popstate, hashchange, focus)
      eventListeners.init();
      
      // Initialize site-specific handlers (Google, Yahoo, Bing)
      siteHandlers.init();

      logger.info("Wellness filter active!");
    } catch (error) {
      logger.safeError("Error during initialization", error);
      
      // Check for context invalidation
      if (error.message?.includes("Extension context invalidated")) {
        isShuttingDown = true;
        return;
      }
    }
  }

  // Start the content script
  initialize();
})();