/**
 * Content Script Entry Point
 * 
 * Main content script that runs on every page.
 * Coordinates all filtering operations:
 * - Text scrubbing (replaces blocked words)
 * - Element hiding (removes blocked suggestions/elements)
 * - Input monitoring (prevents typing blocked words)
 * - Site-specific handlers (Google, Yahoo)
 * 
 * Architecture:
 * 1. Load configuration
 * 2. Initialize utility modules
 * 3. Set up throttled cleaning function
 * 4. Observe DOM for changes
 * 5. Scan periodically for missed content
 * 
 * Performance optimizations:
 * - Throttling: Limits cleaning frequency
 * - Debouncing: Delays processing after DOM changes
 * - Mutation observer: Only processes added nodes
 * - Safety nets: Periodic scans catch missed inputs
 * 
 * Error handling:
 * - Gracefully handles extension context invalidation
 * - Continues working even if some features fail
 * - Silently suppresses extension reload errors
 * 
 * @module content/index
 */

// =============================================================================
// CRITICAL: Error handlers MUST be first - before any imports
// =============================================================================

/**
 * Global error handler for extension context invalidation
 * Catches and completely suppresses "Extension context invalidated" errors
 * These occur when extension is reloaded while page is still open
 * 
 * This MUST be the first code that runs to catch errors during module loading
 */
window.addEventListener('error', (event) => {
  // Check if error is about extension context
  if (event.error && 
      (event.error.message?.includes('Extension context invalidated') ||
       event.error.message?.includes('Cannot access') ||
       event.error.message?.includes('Extension manifest') ||
       event.error.message?.includes('chrome-extension://'))) {
    
    // Completely suppress the error - don't log anything
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    return true;
  }
}, true); // Use capture phase to catch errors early

/**
 * Global promise rejection handler
 * Catches unhandled promise rejections related to extension context
 */
window.addEventListener('unhandledrejection', (event) => {
  // Check if rejection is about extension context
  const message = event.reason?.message || String(event.reason);
  
  if (message.includes('Extension context invalidated') ||
      message.includes('Cannot access') ||
      message.includes('Extension manifest') ||
      message.includes('chrome-extension://')) {
    
    // Completely suppress the error - don't log anything
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    return true;
  }
}, true); // Use capture phase

// =============================================================================
// Now safe to import modules
// =============================================================================

import { WellnessConfig } from './config';
import { WellnessUtils } from './modules/WellnessUtils';
import { TextScrubber } from './modules/TextScrubber';
import { ElementCleaner } from './modules/ElementCleaner';
import { InputHandler } from './modules/InputHandler';
import { SiteHandlers } from './modules/SiteHandlers';
import { EventListeners } from './modules/EventListeners';

(async function() {
  'use strict';

  // Check if extension context is valid before starting
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      // Silently exit - extension was reloaded
      return;
    }
  } catch {
    // Silently exit - extension context invalid
    return;
  }

  // Load configuration from storage
  const config = new WellnessConfig();
  await config.loadConfig();

  // Initialize utility helpers
  const utils = new WellnessUtils(config);

  utils.log(`Active on: ${window.location.hostname}`);

  // Initialize functional modules
  const textScrubber = new TextScrubber(utils);
  const elementCleaner = new ElementCleaner(config, utils);
  const inputHandler = new InputHandler(config, utils);
  const siteHandlers = new SiteHandlers(config, utils, inputHandler);
  const eventListeners = new EventListeners(utils);

  // State tracking
  let lastCleanTime = 0; // Last time throttledClean ran
  let mutationTimer = null; // Timer for debouncing mutations
  let totalFilteredThisPage = 0; // Total items filtered on current page
  let hasNotifiedThisPage = false; // Whether we've shown notification this page
  let isShuttingDown = false; // Flag to stop operations when context is invalid

  /**
   * Throttled cleaning function
   * Performs all filtering operations on a container
   * Throttled to prevent excessive processing
   * 
   * Operations performed:
   * 1. Scrub text nodes (replace blocked words)
   * 2. Hide blocked elements (remove suggestions)
   * 3. Attach to inputs (monitor for typed blocked words)
   * 4. Check URL for blocked content
   * 
   * @param {HTMLElement} container - Container to clean (default: document.body)
   */
  function throttledClean(container = document.body) {
    // Stop if shutting down
    if (isShuttingDown) return;

    // Check if extension context is still valid
    if (!utils.isContextValid()) {
      isShuttingDown = true;
      return;
    }

    const now = Date.now();
    
    // Throttle: Don't run if we ran recently
    if (now - lastCleanTime < config.MIN_CLEAN_INTERVAL) {
      return;
    }
    lastCleanTime = now;

    if (container) {
      try {
        // Perform all cleaning operations
        const textCount = textScrubber.scrubTextNodesIn(container);
        elementCleaner.hideBlockedElements(container);
        const inputCount = inputHandler.attachToInputs(container);
        
        // Log if anything was cleaned
        if (textCount > 0 || inputCount > 0) {
          utils.log(`Cleaned ${textCount} text nodes, ${inputCount} new inputs`);
          totalFilteredThisPage += textCount;
          
          // Show notification once per page when threshold reached
          if (!hasNotifiedThisPage && totalFilteredThisPage >= 5) {
            utils.notifyContentFiltered(totalFilteredThisPage);
            hasNotifiedThisPage = true;
          }
        }
      } catch (error) {
        // Check if error is context invalidation
        if (error.message?.includes('Extension context invalidated')) {
          isShuttingDown = true;
          return;
        }
        utils.log('Error during cleaning: ' + error.message);
      }
    }
    
    // Always check URL for blocked content
    try {
      utils.checkURL();
    } catch (error) {
      // Suppress context errors
      if (error.message?.includes('Extension context invalidated')) {
        isShuttingDown = true;
      }
    }
  }

  /**
   * Initialize content script
   * Sets up all observers, listeners, and periodic scans
   */
  function initialize() {
    try {
      // Inject custom styles (for blur effect if enabled)
      elementCleaner.injectStyles();
      
      // Initial clean on page load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!isShuttingDown) throttledClean();
        });
      } else {
        throttledClean();
      }
      
      // Early scans to catch inputs that load dynamically
      // Some sites load inputs after initial page load
      [0, 100, 500, 1000].forEach(delay => {
        setTimeout(() => {
          if (isShuttingDown || !utils.isContextValid()) return;
          
          const newInputs = inputHandler.attachToInputs(document);
          if (newInputs > 0) {
            utils.log(`Early scan found ${newInputs} inputs at ${delay}ms`);
          }
        }, delay);
      });

      /**
       * Set up mutation observer
       * Watches for DOM changes and processes new nodes
       * Debounced to prevent excessive processing during rapid changes
       */
      const observer = new MutationObserver((mutations) => {
        // Stop if context is invalid
        if (isShuttingDown || !utils.isContextValid()) {
          observer.disconnect();
          isShuttingDown = true;
          return;
        }

        // Clear existing timer
        if (mutationTimer) {
          clearTimeout(mutationTimer);
        }

        // Collect all added nodes
        const addedNodes = [];
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            // Only process element nodes (not text nodes)
            if (node.nodeType === 1) {
              addedNodes.push(node);
            }
          });
        });

        // Skip if no elements were added
        if (addedNodes.length === 0) return;

        // Debounce: Process after delay to batch changes
        mutationTimer = setTimeout(() => {
          if (isShuttingDown) return;
          
          addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              throttledClean(node);
            }
          });
        }, config.MUTATION_DEBOUNCE);
      });

      // Start observing DOM changes
      if (document.body) {
        observer.observe(document.body, {
          childList: true, // Watch for added/removed nodes
          subtree: true    // Watch entire tree
        });
      }

      // Periodic full scan as safety net
      // Catches any content that slipped through observers
      const scanInterval = setInterval(() => {
        if (isShuttingDown || !utils.isContextValid()) {
          clearInterval(scanInterval);
          isShuttingDown = true;
          return;
        }
        throttledClean();
      }, config.SCAN_INTERVAL);

      // Safety net for missed inputs
      // Some sites create inputs in unusual ways that observers miss
      const inputScanInterval = setInterval(() => {
        if (isShuttingDown || !utils.isContextValid()) {
          clearInterval(inputScanInterval);
          isShuttingDown = true;
          return;
        }
        
        const missedInputs = inputHandler.attachToInputs(document);
        if (missedInputs > 0) {
          utils.log(`Safety net caught ${missedInputs} missed inputs`);
        }
      }, 5000);

      // Initialize event listeners (click/form blockers)
      eventListeners.init();
      
      // Initialize site-specific handlers (Google, Yahoo)
      siteHandlers.init();

      utils.log('Wellness filter active!');
    } catch (error) {
      // Check if error is context invalidation
      if (error.message?.includes('Extension context invalidated')) {
        isShuttingDown = true;
        return;
      }
      console.log('[Wellness Filter] Error during initialization:', error);
    }
  }

  // Start the content script
  initialize();
})();