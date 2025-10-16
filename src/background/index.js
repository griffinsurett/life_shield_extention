/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKGROUND SCRIPT - The Heart of Wellness Filter
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the MAIN ENTRY POINT for the extension's background service worker.
 * Think of this as the "brain" of the extension - it runs persistently in the
 * background and coordinates all the extension's functionality.
 * 
 * WHAT IT DOES:
 * - Initializes all background services when the extension starts
 * - Manages the extension lifecycle (install, update, reload)
 * - Coordinates between different services (blocking, stats, notifications)
 * - Ensures services stay alive even when Chrome tries to suspend them
 * 
 * ARCHITECTURE DECISION:
 * We use a functional, service-based architecture rather than object-oriented.
 * Each service is imported as a module and initialized independently.
 * This makes the code easier to test, understand, and maintain.
 * 
 * SERVICE INITIALIZATION ORDER MATTERS:
 * 1. Settings must load first (other services depend on settings)
 * 2. Stats must initialize before badge (badge shows stats)
 * 3. Icon manager before badge (badge might use custom icon)
 * 4. Blocking service after settings (needs blocked sites list)
 * 
 * WHY SERVICE WORKER VS BACKGROUND PAGE:
 * Chrome Manifest V3 requires service workers. They're more efficient than
 * the old persistent background pages, but they can be suspended by Chrome.
 * We handle context invalidation gracefully throughout the codebase.
 * 
 * @module background/index
 */

import { isExtensionContextValid } from "../utils/chromeApi";
import { createLogger, setLogLevel } from "../utils/logger";
import { DEFAULTS } from "../config";

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
// Import all functional services that make up the extension's background logic.
// Each service is self-contained and manages a specific piece of functionality.

import { initBadge, updateBadge } from "./services/badge";
import { initStats, initializeStats } from "./services/stats";
import { initSettings } from "./services/settings";
import { initBlocking } from "./services/blocking";
import { initNavigation } from "./services/navigation";
import { initMessages } from "./services/messages";
import {
  showStartupNotification,
  showWelcomeNotification,
} from "./services/notifications";
import { iconManager } from "./services/iconManager";

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING SETUP
// ═══════════════════════════════════════════════════════════════════════════
// Create a context-specific logger for this module. All log messages will be
// prefixed with [Background] so we can trace them in the console.

const logger = createLogger("Background");

// ═══════════════════════════════════════════════════════════════════════════
// TIMING CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
// Local timing constants defined here rather than in config to keep them close
// to where they're used. This makes the code more self-documenting.

const STARTUP_NOTIFICATION_DELAY = 1000; // 1 second - gives extension time to fully initialize

// ═══════════════════════════════════════════════════════════════════════════
// LOG LEVEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
// Set log level based on environment. Use 'debug' during development to see
// everything, 'info' in production to reduce noise. This can be changed here
// to debug production issues.

setLogLevel("debug"); // TODO: Change to 'info' for production builds

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INITIALIZE ALL SERVICES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This function is called once when the service worker starts up. It initializes
 * all the background services in a specific order to ensure dependencies are met.
 * 
 * INITIALIZATION SEQUENCE:
 * 1. Check extension context validity (prevent crashes on reload)
 * 2. Initialize settings (load user preferences from storage)
 * 3. Initialize stats (load statistics from storage)
 * 4. Initialize icon manager (load custom icons if any)
 * 5. Initialize badge (setup the counter on the extension icon)
 * 6. Initialize blocking (setup site blocking rules)
 * 7. Initialize navigation (setup URL interception)
 * 8. Initialize messages (setup communication with popup/content scripts)
 * 9. Show startup notification (let user know extension is active)
 * 10. Setup storage listener (react to setting changes)
 * 
 * ERROR HANDLING:
 * If any service fails to initialize, we log the error but continue.
 * This prevents a single service failure from breaking the entire extension.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function initializeServices() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  // Before doing anything, verify the extension context is valid.
  // If the user reloads the extension while this code is running, the context
  // becomes invalid and any Chrome API calls will throw errors.
  
  if (!isExtensionContextValid()) {
    logger.error("Extension context invalid, cannot initialize");
    return;
  }

  try {
    logger.info("🚀 Service worker loaded - starting initialization");

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 1: CORE SERVICES
    // ─────────────────────────────────────────────────────────────────────────
    // These services must initialize first because other services depend on them.
    
    // Settings service loads user preferences from chrome.storage.sync
    // This must happen first because blocking, navigation, and other services
    // need to know the user's blocked words/sites and other preferences.
    await initSettings();
    logger.info("✅ Settings service initialized");

    // Stats service loads statistics from chrome.storage.local
    // Badge service will display these stats, so this must come before badge.
    await initStats();
    logger.info("✅ Stats service initialized");

    // Icon manager loads custom icons from storage
    // Badge and notifications may use custom icons, so initialize this early.
    await iconManager.init();
    logger.info("✅ Icon manager initialized");

    // Badge service sets up the counter that appears on the extension icon
    // Shows how many items were blocked today.
    initBadge();
    logger.info("✅ Badge service initialized");

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 2: FEATURE SERVICES
    // ─────────────────────────────────────────────────────────────────────────
    // These services implement the main features of the extension.
    
    // Blocking service sets up declarativeNetRequest rules to block entire sites
    // This is our most powerful blocking mechanism - stops navigation before
    // the page even starts loading. Much more efficient than content scripts.
    await initBlocking();
    logger.info("✅ Blocking service initialized");

    // Navigation service intercepts URL changes and checks for blocked words
    // This catches blocked content in URLs and search queries before the page loads.
    initNavigation();
    logger.info("✅ Navigation service initialized");

    // Messages service handles communication from content scripts and popup
    // This is how the UI and content scripts talk to the background script.
    initMessages();
    logger.info("✅ Messages service initialized");

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 3: USER FEEDBACK
    // ─────────────────────────────────────────────────────────────────────────
    
    // Show startup notification after a short delay
    // We wait 1 second to ensure the extension is fully ready and to avoid
    // showing the notification too quickly if the user is actively browsing.
    setTimeout(() => {
      // Double-check context validity before showing notification
      // The extension could have been reloaded during the 1-second delay
      if (isExtensionContextValid()) {
        showStartupNotification();
      }
    }, STARTUP_NOTIFICATION_DELAY);

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 4: REACTIVE UPDATES
    // ─────────────────────────────────────────────────────────────────────────
    
    // Listen for changes to the today count in storage
    // When content scripts filter content, they update todayCount.
    // We need to update the badge when this happens.
    if (isExtensionContextValid()) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        // Always check context validity in listeners - they can fire after reload
        if (!isExtensionContextValid()) return;

        // Only react to changes in local storage (where stats are stored)
        // and specifically to the todayCount key (what we display on badge)
        if (namespace === "local" && changes.todayCount) {
          updateBadge();
        }
      });
    }

    logger.info("🎉 All services initialized successfully");
  } catch (error) {
    // If anything goes wrong during initialization, log it but don't crash
    // The extension might still work partially even if one service fails
    logger.error("❌ Fatal initialization error", error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SETUP INSTALLATION LISTENER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This function sets up a listener for extension install and update events.
 * Chrome fires these events when:
 * - User installs the extension for the first time
 * - Extension is updated to a new version
 * - Extension is reinstalled after being removed
 * 
 * WHY THIS IS IMPORTANT:
 * - First install: We need to set default settings and show welcome message
 * - Update: We need to handle data migrations if settings format changed
 * - Both: We need to ensure badge is updated to show correct count
 * 
 * EDGE CASES HANDLED:
 * - Extension context might be invalid when this runs (user reloaded extension)
 * - Storage operations might fail (user has no storage quota)
 * - Notification might fail (user disabled notifications)
 */
function setupInstallListener() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExtensionContextValid()) return;

  try {
    // Register the listener with Chrome
    // This will fire immediately on install/update, and then never again
    // until the next install/update
    chrome.runtime.onInstalled.addListener(async (details) => {
      // Always verify context at the start of async callbacks
      if (!isExtensionContextValid()) return;

      try {
        // ─────────────────────────────────────────────────────────────────────
        // HANDLE FIRST INSTALL
        // ─────────────────────────────────────────────────────────────────────
        if (details.reason === "install") {
          logger.info("📦 Extension installed - setting up defaults");

          // Create default settings object
          // We explicitly set each setting to its default value from DEFAULTS
          // This ensures consistent behavior even if DEFAULTS changes in future
          const defaultSettings = {
            blockedWords: DEFAULTS.BLOCKED_WORDS,       // Empty array in production
            blockedSites: DEFAULTS.BLOCKED_SITES,       // Empty array in production
            redirectUrl: DEFAULTS.REDIRECT_URL,         // Default safe redirect
            enableFilter: DEFAULTS.ENABLE_FILTER,       // true - filter is on by default
            showAlerts: DEFAULTS.SHOW_ALERTS,           // false - notifications off by default
            replacementPhrases: DEFAULTS.REPLACEMENT_PHRASES, // Array of wellness phrases
            useCustomUrl: DEFAULTS.USE_CUSTOM_URL,      // false - use built-in blocked page
            customMessage: DEFAULTS.CUSTOM_MESSAGE,     // Default blocked page message
          };

          // Save to sync storage so settings sync across user's devices
          // chrome.storage.sync has limits (100KB total, 8KB per item)
          // but our settings are well under these limits
          await chrome.storage.sync.set(defaultSettings);
          logger.info("Default settings initialized");

          // Initialize statistics in local storage
          // Stats are local-only (don't sync) because they're device-specific
          await initializeStats();

          // Show welcome notification to greet the new user
          // This helps them know the extension installed successfully
          await showWelcomeNotification();
        } 
        // ─────────────────────────────────────────────────────────────────────
        // HANDLE UPDATE
        // ─────────────────────────────────────────────────────────────────────
        else if (details.reason === "update") {
          // Get the new version number from the manifest
          const newVersion = chrome.runtime.getManifest().version;
          logger.info(`📦 Extension updated to version ${newVersion}`);
          
          // TODO: Add data migration logic here if needed
          // Example: if (details.previousVersion === '1.0.0') { migrate_1_0_to_1_1(); }
        }

        // ─────────────────────────────────────────────────────────────────────
        // COMMON POST-INSTALL TASKS
        // ─────────────────────────────────────────────────────────────────────
        // Update badge regardless of install or update
        // This ensures the badge shows the correct count after any install event
        await updateBadge();
      } catch (error) {
        // If anything fails during install handling, log it
        // The extension will still work, user just might not see welcome message
        logger.error("Error in onInstalled handler", error);
      }
    });
  } catch (error) {
    // If we can't even set up the listener, log it with safeError
    // safeError suppresses context invalidation errors
    logger.safeError("Error setting up install listener", error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN INITIALIZATION FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the entry point for the entire background script.
 * It's called immediately when the service worker starts.
 * 
 * EXECUTION ORDER:
 * 1. Set up install/update listener (before services, so it's ready immediately)
 * 2. Initialize all services (settings, stats, blocking, etc.)
 * 3. Log ready message (confirms everything started successfully)
 * 
 * ERROR HANDLING:
 * Any errors are caught and logged, but we try to continue initialization.
 * This "fail gracefully" approach means the extension might work partially
 * even if one component fails.
 * 
 * @async
 */
async function main() {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Setup install listener
    // ─────────────────────────────────────────────────────────────────────────
    // This must happen first, before any async operations, to ensure we catch
    // install/update events even if they fire during initialization
    setupInstallListener();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Initialize all services
    // ─────────────────────────────────────────────────────────────────────────
    // This is an async operation that sets up everything the extension needs
    await initializeServices();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Confirm ready
    // ─────────────────────────────────────────────────────────────────────────
    logger.info("✨ Background script ready");
  } catch (error) {
    // Critical errors during main initialization
    // Log with emoji to make it highly visible in console
    logger.error("💥 Critical error in main initialization", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// START THE EXTENSION
// ═══════════════════════════════════════════════════════════════════════════
// This line executes immediately when the service worker loads.
// It kicks off the entire initialization process.

main();