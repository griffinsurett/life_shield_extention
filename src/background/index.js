/**
 * Background Script Entry Point
 * 
 * Main background service worker for the Wellness Filter extension.
 * Coordinates all background operations and managers.
 * 
 * Managers initialized:
 * - BadgeManager: Updates extension badge with today's count
 * - StatsManager: Tracks filtering statistics
 * - SettingsManager: Manages extension settings
 * - NotificationManager: Shows browser notifications
 * - BlockingManager: Handles site-level blocking
 * - NavigationManager: Intercepts navigation to blocked content
 * - MessageHandler: Routes messages from content scripts
 * 
 * This is a service worker, so it may be terminated and restarted by Chrome.
 * All state must be stored in chrome.storage, not in memory.
 * 
 * @module background/index
 */

import { BadgeManager } from './managers/BadgeManager';
import { StatsManager } from './managers/StatsManager';
import { SettingsManager } from './managers/SettingsManager';
import { NotificationManager } from './managers/NotificationManager';
import { NavigationManager } from './managers/NavigationManager';
import { BlockingManager } from './managers/BlockingManager';
import { MessageHandler } from './handlers/MessageHandler';
import { DEFAULT_SETTINGS } from '../utils/constants';

/**
 * Check if extension context is still valid
 * Returns false if extension was reloaded/updated
 * 
 * @returns {boolean} True if context is valid
 */
function isContextValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

/**
 * Safe initialization wrapper
 * Ensures chrome API is available before initializing
 */
async function safeInitialize() {
  // Validate context before starting
  if (!isContextValid()) {
    console.log('[Background] Extension context invalid, cannot initialize');
    return;
  }

  try {
    console.log('[Wellness Filter Background] Service worker loaded');

    // Initialize managers in order of dependency
    const badgeManager = new BadgeManager();
    const statsManager = new StatsManager(badgeManager);
    const settingsManager = new SettingsManager();
    const notificationManager = new NotificationManager(settingsManager);
    const blockingManager = new BlockingManager(settingsManager, statsManager, notificationManager);
    
    // Initialize navigation and message handlers
    new NavigationManager(settingsManager, statsManager, notificationManager);
    new MessageHandler(settingsManager, statsManager, notificationManager, badgeManager);

    // Show startup notification after short delay
    // Delay ensures managers are fully initialized
    setTimeout(() => {
      if (isContextValid()) {
        notificationManager.showStartupNotification();
      }
    }, 1000);

    /**
     * Listen for badge count changes
     * Updates badge when todayCount changes in storage
     * Wrapped in context validation
     */
    if (isContextValid()) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (!isContextValid()) return;
        
        if (namespace === 'local' && changes.todayCount) {
          badgeManager.updateBadge();
        }
      });
    }

    /**
     * Handle extension installation and updates
     * Sets up default settings on first install
     */
    if (isContextValid()) {
      chrome.runtime.onInstalled.addListener(async (details) => {
        if (!isContextValid()) return;

        try {
          // On first install, set up defaults
          if (details.reason === 'install') {
            await chrome.storage.sync.set(DEFAULT_SETTINGS);
            console.log('[Background] Default settings initialized');
            
            await statsManager.initializeStats();
            await settingsManager.loadSettings();
            await blockingManager.updateBlockingRules();
            await notificationManager.showWelcomeNotification();
          }
          
          // Always update badge on install/update
          await badgeManager.updateBadge();
        } catch (error) {
          console.error('[Background] Error in onInstalled handler:', error);
        }
      });
    }

    console.log('[Wellness Filter Background] Initialization complete');
  } catch (error) {
    console.error('[Background] Fatal initialization error:', error);
  }
}

// Start initialization
safeInitialize();