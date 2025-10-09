/**
 * Background Script Entry Point
 * 
 * Fully converted to functional services.
 * Clean, maintainable architecture with proper logging.
 * 
 * @module background/index
 */

import { isExtensionContextValid } from '../utils/chrome';
import { createLogger, setLogLevel } from '../utils/logger';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { STARTUP_NOTIFICATION_DELAY } from '../utils/timing';

// Import all functional services
import { initBadge, updateBadge } from './services/badge';
import { initStats, initializeStats } from './services/stats';
import { initSettings } from './services/settings';
import { initBlocking } from './services/blocking';
import { initNavigation } from './services/navigation';
import { initMessages } from './services/messages';
import { 
  showStartupNotification, 
  showWelcomeNotification 
} from './services/notifications';

const logger = createLogger('Background');

// Set log level based on environment
// Use 'info' for production, 'debug' for development
setLogLevel('debug');

/**
 * Initialize all services
 * 
 * @async
 * @returns {Promise<void>}
 */
async function initializeServices() {
  if (!isExtensionContextValid()) {
    logger.error('Extension context invalid, cannot initialize');
    return;
  }

  try {
    logger.info('🚀 Service worker loaded - starting initialization');

    // Initialize core services first
    await initSettings();
    logger.info('✅ Settings service initialized');
    
    await initStats();
    logger.info('✅ Stats service initialized');
    
    initBadge();
    logger.info('✅ Badge service initialized');

    // Initialize feature services
    await initBlocking();
    logger.info('✅ Blocking service initialized');
    
    initNavigation();
    logger.info('✅ Navigation service initialized');
    
    initMessages();
    logger.info('✅ Messages service initialized');

    // Show startup notification after delay
    setTimeout(() => {
      if (isExtensionContextValid()) {
        showStartupNotification();
      }
    }, STARTUP_NOTIFICATION_DELAY);

    // Listen for badge count changes
    if (isExtensionContextValid()) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isExtensionContextValid()) return;
        
        if (namespace === 'local' && changes.todayCount) {
          updateBadge();
        }
      });
    }

    logger.info('🎉 All services initialized successfully');
  } catch (error) {
    logger.error('❌ Fatal initialization error', error);
  }
}

/**
 * Handle extension installation and updates
 */
function setupInstallListener() {
  if (!isExtensionContextValid()) return;

  try {
    chrome.runtime.onInstalled.addListener(async (details) => {
      if (!isExtensionContextValid()) return;

      try {
        if (details.reason === 'install') {
          logger.info('📦 Extension installed - setting up defaults');
          
          // Set default settings
          await chrome.storage.sync.set(DEFAULT_SETTINGS);
          logger.info('Default settings initialized');
          
          // Initialize stats
          await initializeStats();
          
          // Show welcome notification
          await showWelcomeNotification();
        } else if (details.reason === 'update') {
          logger.info(`📦 Extension updated to version ${chrome.runtime.getManifest().version}`);
        }
        
        // Update badge regardless of reason
        await updateBadge();
      } catch (error) {
        logger.error('Error in onInstalled handler', error);
      }
    });
  } catch (error) {
    logger.safeError('Error setting up install listener', error);
  }
}

/**
 * Main initialization
 */
async function main() {
  try {
    // Set up install listener first
    setupInstallListener();
    
    // Initialize all services
    await initializeServices();
    
    logger.info('✨ Background script ready');
  } catch (error) {
    logger.error('💥 Critical error in main initialization', error);
  }
}

// Start the extension
main();