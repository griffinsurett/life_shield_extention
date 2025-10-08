import { WellnessConfig } from './config';
import { WellnessUtils } from './modules/WellnessUtils';
import { TextScrubber } from './modules/TextScrubber';
import { ElementCleaner } from './modules/ElementCleaner';
import { InputHandler } from './modules/InputHandler';
import { SiteHandlers } from './modules/SiteHandlers';
import { EventListeners } from './modules/EventListeners';

(async function() {
  'use strict';

  const config = new WellnessConfig();
  await config.loadConfig();

  const utils = new WellnessUtils(config);

  if (utils.isSiteExcluded()) {
    utils.log("Site excluded");
    return;
  }

  utils.log(`Active on: ${window.location.hostname}`);

  const textScrubber = new TextScrubber(utils);
  const elementCleaner = new ElementCleaner(config, utils);
  const inputHandler = new InputHandler(config, utils);
  const siteHandlers = new SiteHandlers(config, utils, inputHandler);
  const eventListeners = new EventListeners(utils);

  let lastCleanTime = 0;
  let mutationTimer = null;
  let totalFilteredThisPage = 0;
  let hasNotifiedThisPage = false;

  function throttledClean(container = document.body) {
    const now = Date.now();
    if (now - lastCleanTime < config.MIN_CLEAN_INTERVAL) {
      return;
    }
    lastCleanTime = now;

    if (container) {
      const textCount = textScrubber.scrubTextNodesIn(container);
      elementCleaner.hideBlockedElements(container);
      const inputCount = inputHandler.attachToInputs(container);
      
      if (textCount > 0 || inputCount > 0) {
        utils.log(`Cleaned ${textCount} text nodes, ${inputCount} new inputs`);
        totalFilteredThisPage += textCount;
        
        // Show notification once per page load when threshold reached
        if (!hasNotifiedThisPage && totalFilteredThisPage >= 5) {
          utils.notifyContentFiltered(totalFilteredThisPage);
          hasNotifiedThisPage = true;
        }
      }
    }
    utils.checkURL();
  }

  function initialize() {
    elementCleaner.injectStyles();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => throttledClean());
    } else {
      throttledClean();
    }
    
    [0, 100, 500, 1000].forEach(delay => {
      setTimeout(() => {
        const newInputs = inputHandler.attachToInputs(document);
        if (newInputs > 0) {
          utils.log(`Early scan found ${newInputs} inputs at ${delay}ms`);
        }
      }, delay);
    });

    const observer = new MutationObserver((mutations) => {
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

    setInterval(() => throttledClean(), config.SCAN_INTERVAL);

    setInterval(() => {
      const missedInputs = inputHandler.attachToInputs(document);
      if (missedInputs > 0) {
        utils.log(`Safety net caught ${missedInputs} missed inputs`);
      }
    }, 5000);

    eventListeners.init();
    siteHandlers.init();

    utils.log('Wellness filter active!');
  }

  initialize();
})();