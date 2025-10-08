import { DEFAULT_SETTINGS } from '../utils/constants';
import { BadgeManager } from './managers/BadgeManager';
import { StatsManager } from './managers/StatsManager';
import { SettingsManager } from './managers/SettingsManager';
import { NotificationManager } from './managers/NotificationManager';
import { NavigationManager } from './managers/NavigationManager';
import { MessageHandler } from './handlers/MessageHandler';

console.log('[Wellness Filter Background] Service worker loaded');

// Initialize managers
const badgeManager = new BadgeManager();
const statsManager = new StatsManager(badgeManager);
const settingsManager = new SettingsManager();
const notificationManager = new NotificationManager(settingsManager);
const navigationManager = new NavigationManager(
  settingsManager,
  statsManager,
  notificationManager
);
const messageHandler = new MessageHandler(
  settingsManager,
  statsManager,
  notificationManager,
  badgeManager
);

// Show startup notification after a delay
setTimeout(() => {
  notificationManager.showStartupNotification();
}, 1000);

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.todayCount) {
    badgeManager.updateBadge();
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize default settings
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    console.log('[Background] Default settings initialized');
    
    // Initialize stats
    await statsManager.initializeStats();
    
    // Reload settings
    await settingsManager.loadSettings();
    
    // Show welcome notification
    await notificationManager.showWelcomeNotification();
  }
  
  // Update badge on install/update
  await badgeManager.updateBadge();
});