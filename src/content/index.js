/**
 * Content Script Entry Point
 * 
 * Main content script that runs on every page.
 * Coordinates all filtering operations.
 * 
 * @module content/index
 */

import { isExtensionContextValid } from '../utils/chrome';
import { 
  EARLY_SCAN_DELAYS, 
  INPUT_SCAN_INTERVAL 
} from '../utils/timing';
import { WellnessConfig } from './config';
import { WellnessUtils } from './modules/WellnessUtils';
import { TextScrubber } from './modules/TextScrubber';
import { ElementCleaner } from './modules/ElementCleaner';
import { InputHandler } from './modules/InputHandler';
import { SiteHandlers } from './modules/SiteHandlers';
import { EventListeners } from './modules/EventListeners';

// =============================================================================
// CRITICAL: Error handlers MUST be first - before any imports
// =============================================================================

/**
 * Global error handler for extension context invalidation
 * Catches and completely suppresses "Extension context invalidated" errors
 */
window.addEventListener('error', (event) => {
  if (event.error && 
      (event.error.message?.includes('Extension context invalidated') ||
       event.error.message?.includes('Cannot access') ||
       event.error.message?.includes('Extension manifest') ||
       event.error.message?.includes('chrome-extension://'))) {
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    return true;
  }
}, true);

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason);
  
  if (message.includes('Extension context invalidated') ||
      message.includes('Cannot access') ||
      message.includes('Extension manifest') ||
      message.includes('chrome-extension://')) {
    
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    return true;
  }
}, true);

// =============================================================================
// Main content script
// =============================================================================

(async function() {
  'use strict';

  // Check if extension context is valid before starting
  try {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      return;
    }
  } catch {
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
  let lastCleanTime = 0;
  let mutationTimer = null;
  let totalFilteredThisPage = 0;
  let hasNotifiedThisPage = false;
  let isShuttingDown = false;

  /**
   * Throttled cleaning function
   * Performs all filtering operations on a container
   */
  function throttledClean(container = document.body) {
    if (isShuttingDown) return;

    if (!isExtensionContextValid()) {
      isShuttingDown = true;
      return;
    }

    const now = Date.now();
    
    if (now - lastCleanTime < config.MIN_CLEAN_INTERVAL) {
      return;
    }
    lastCleanTime = now;

    if (container) {
      try {
        const textCount = textScrubber.scrubTextNodesIn(container);
        elementCleaner.hideBlockedElements(container);
        const inputCount = inputHandler.attachToInputs(container);
        
        if (textCount > 0 || inputCount > 0) {
          utils.log(`Cleaned ${textCount} text nodes, ${inputCount} new inputs`);
          totalFilteredThisPage += textCount;
          
          if (!hasNotifiedThisPage && totalFilteredThisPage >= 5) {
            utils.notifyContentFiltered(totalFilteredThisPage);
            hasNotifiedThisPage = true;
          }
        }
      } catch (error) {
        if (error.message?.includes('Extension context invalidated')) {
          isShuttingDown = true;
          return;
        }
        utils.log('Error during cleaning: ' + error.message);
      }
    }
    
    try {
      utils.checkURL();
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        isShuttingDown = true;
      }
    }
  }

  /**
   * Initialize content script
   */
  function initialize() {
    try {
      elementCleaner.injectStyles();
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (!isShuttingDown) throttledClean();
        });
      } else {
        throttledClean();
      }
      
      EARLY_SCAN_DELAYS.forEach(delay => {
        setTimeout(() => {
          if (isShuttingDown || !isExtensionContextValid()) return;
          
          const newInputs = inputHandler.attachToInputs(document);
          if (newInputs > 0) {
            utils.log(`Early scan found ${newInputs} inputs at ${delay}ms`);
          }
        }, delay);
      });

      const observer = new MutationObserver((mutations) => {
        if (isShuttingDown || !isExtensionContextValid()) {
          observer.disconnect();
          isShuttingDown = true;
          return;
        }

        if (mutationTimer) {
          clearTimeout(mutationTimer);
        }

        const addedNodes = [];
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              addedNodes.push(node);
            }
          });
        });

        if (addedNodes.length === 0) return;

        mutationTimer = setTimeout(() => {
          if (isShuttingDown) return;
          
          addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              throttledClean(node);
            }
          });
        }, config.MUTATION_DEBOUNCE);
      });

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }

      const scanInterval = setInterval(() => {
        if (isShuttingDown || !isExtensionContextValid()) {
          clearInterval(scanInterval);
          isShuttingDown = true;
          return;
        }
        throttledClean();
      }, config.SCAN_INTERVAL);

      const inputScanInterval = setInterval(() => {
        if (isShuttingDown || !isExtensionContextValid()) {
          clearInterval(inputScanInterval);
          isShuttingDown = true;
          return;
        }
        
        const missedInputs = inputHandler.attachToInputs(document);
        if (missedInputs > 0) {
          utils.log(`Safety net caught ${missedInputs} missed inputs`);
        }
      }, INPUT_SCAN_INTERVAL);

      eventListeners.init();
      siteHandlers.init();

      utils.log('Wellness filter active!');
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        isShuttingDown = true;
        return;
      }
      console.log('[Wellness Filter] Error during initialization:', error);
    }
  }

  initialize();
})();