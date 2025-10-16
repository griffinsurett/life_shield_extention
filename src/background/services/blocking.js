/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BLOCKING SERVICE - Site-Level Content Blocking Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the MOST POWERFUL blocking mechanism in the extension.
 * It uses Chrome's declarativeNetRequest API to block entire websites BEFORE
 * they even start loading. This is much more efficient than content scripts
 * because the blocking happens at the network level.
 * 
 * WHAT IT DOES:
 * - Blocks entire websites before they load (instant redirect)
 * - Creates blocking rules dynamically based on user's blocked sites list
 * - Handles www variants and subdomains automatically
 * - Updates rules in real-time when settings change
 * - Tracks statistics when sites are blocked
 * - Shows notifications when blocking occurs
 * 
 * HOW IT WORKS:
 * 1. User adds "example.com" to their blocked sites
 * 2. We create 4 declarativeNetRequest rules:
 *    - example.com/*       (with path)
 *    - www.example.com/*   (www variant)
 *    - *.example.com/*     (all subdomains)
 *    - example.com         (exact domain)
 * 3. When user tries to visit example.com, Chrome's network layer catches it
 * 4. Redirect happens BEFORE the page loads (instant, efficient)
 * 5. We track the block in statistics and show notification
 * 
 * WHY 4 RULES PER SITE:
 * Users might visit:
 * - example.com (exact)
 * - www.example.com (www subdomain)
 * - blog.example.com (any subdomain)
 * - example.com/page (with path)
 * All of these need to be blocked, so we create comprehensive rules.
 * 
 * REDIRECT BEHAVIOR:
 * - If user set custom redirect URL → redirect there
 * - Otherwise → redirect to our built-in blocked page
 * - Blocked page shows custom message if user set one
 * 
 * PERFORMANCE:
 * - declarativeNetRequest is VERY efficient (Chrome does the heavy lifting)
 * - Rules are stored in Chrome's internal storage (not processed in JS)
 * - No performance impact even with hundreds of blocked sites
 * 
 * ANTI-DUPLICATE PROTECTION:
 * We track blocked tab IDs with a 2-second debounce to prevent:
 * - Counting the same block multiple times
 * - Showing duplicate notifications
 * - Inflating statistics
 * 
 * @module background/services/blocking
 */

import { isExtensionContextValid } from "../../utils/chromeApi";
import { createLogger } from "../../utils/logger";
import {
  getBlockedSites,
  getRedirectUrl,
  containsBlockedSite,
  isFilterEnabled,
  shouldUseCustomUrl,
} from "./settings";
import { incrementStats } from "./stats";
import { showContentBlockedNotification } from "./notifications";
import {
  getBlockedPageUrl,
  getRedirectUrlWithFallback,
} from "../../utils/builders";

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════
const logger = createLogger("BlockingService");

// ═══════════════════════════════════════════════════════════════════════════
// TIMING CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
// Debounce period for tab blocking. If the same tab is blocked multiple times
// within this window, we only count it once. This prevents inflated statistics
// when Chrome fires multiple navigation events for the same block.
const TAB_BLOCKING_DEBOUNCE = 2000; // 2 seconds

// ═══════════════════════════════════════════════════════════════════════════
// BLOCKED TAB TRACKING
// ═══════════════════════════════════════════════════════════════════════════
// Set to track tab IDs that were recently blocked
// We use a Set for O(1) lookup performance
// Tabs are automatically removed after TAB_BLOCKING_DEBOUNCE milliseconds
const blockedTabIds = new Set();

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INITIALIZE BLOCKING SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sets up the declarativeNetRequest rules and navigation listeners.
 * 
 * INITIALIZATION PROCESS:
 * 1. Set up storage listener for settings changes
 * 2. Create initial blocking rules from current settings
 * 3. Set up navigation listeners for statistics tracking
 * 
 * WHY LISTEN FOR SETTINGS CHANGES:
 * When user adds/removes blocked sites, we need to update the rules immediately.
 * The storage listener ensures rules stay in sync with user's preferences.
 * 
 * CRITICAL: This service respects the enableFilter setting.
 * If filter is disabled, all rules are cleared and no blocking occurs.
 * 
 * @async
 * @export
 * @returns {Promise<void>}
 */
export async function initBlocking() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping init");
    return;
  }

  try {
    logger.info("Initializing blocking service");

    // ─────────────────────────────────────────────────────────────────────────
    // SETTINGS CHANGE LISTENER
    // ─────────────────────────────────────────────────────────────────────────
    // Listen for changes to any settings that affect blocking rules:
    // - blockedSites: List of sites to block
    // - redirectUrl: Where to redirect when blocked
    // - enableFilter: Master on/off switch
    // - useCustomUrl: Whether to use custom redirect vs built-in page
    chrome.storage.onChanged.addListener((changes, namespace) => {
      // Always verify context in listeners
      if (!isExtensionContextValid()) return;

      // Only react to sync storage (where settings are stored)
      if (namespace === "sync") {
        // If any blocking-related setting changed, update the rules
        if (
          changes.blockedSites ||
          changes.redirectUrl ||
          changes.enableFilter ||
          changes.useCustomUrl
        ) {
          updateBlockingRules();
        }
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // INITIAL RULE UPDATE
    // ─────────────────────────────────────────────────────────────────────────
    // Create rules based on current settings
    // This ensures blocking starts working immediately when extension loads
    await updateBlockingRules();

    // ─────────────────────────────────────────────────────────────────────────
    // NAVIGATION LISTENERS
    // ─────────────────────────────────────────────────────────────────────────
    // Set up listeners to track when blocking occurs
    // These listeners update statistics and show notifications
    setupBlockedRequestListener();

    logger.info("Blocking service initialized");
  } catch (error) {
    logger.safeError("Error during init", error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UPDATE DECLARATIVE NET REQUEST RULES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the heart of the blocking service. It converts the user's list of
 * blocked sites into declarativeNetRequest rules that Chrome enforces.
 * 
 * RULE CREATION PROCESS:
 * 1. Check if filter is enabled (if not, clear all rules)
 * 2. Get list of blocked sites from settings
 * 3. For each site, create 4 rules (domain, www, subdomains, exact)
 * 4. Remove all existing rules
 * 5. Add new rules
 * 
 * WHY REMOVE ALL RULES FIRST:
 * It's simpler to clear everything and recreate than to diff and update.
 * The number of rules is small (typically < 100), so this is fast.
 * 
 * RULE ID ASSIGNMENT:
 * Each rule needs a unique ID. We use a simple counter starting at 1.
 * When we remove all rules and recreate, we reset the counter.
 * 
 * URL PATTERN MATCHING:
 * - *://example.com/*     matches http and https with any path
 * - *://www.example.com/* matches www variant
 * - *://*.example.com/*   matches all subdomains (blog.example.com, etc.)
 * - *://example.com       matches exact domain without path
 * 
 * REDIRECT LOGIC:
 * - Custom URL mode: Redirect to user's chosen URL
 * - Built-in mode: Redirect to our blocked page with original URL as parameter
 * 
 * @async
 * @export
 * @returns {Promise<void>}
 */
export async function updateBlockingRules() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExtensionContextValid()) return;

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // CHECK IF FILTER IS ENABLED
    // ─────────────────────────────────────────────────────────────────────────
    // This is the MASTER SWITCH for all blocking.
    // If disabled, we remove all rules and exit.
    if (!isFilterEnabled()) {
      logger.info("Filter disabled, clearing all blocking rules");

      // Get list of existing rules so we can remove them
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map((rule) => rule.id);

      // Remove all rules (empty array for addRules)
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: [],
      });

      logger.info("All blocking rules cleared");
      return; // Exit early - no blocking when filter disabled
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET CONFIGURATION
    // ─────────────────────────────────────────────────────────────────────────
    // Get the list of sites to block
    const blockedSites = getBlockedSites();
    
    // Determine redirect behavior
    const useCustom = shouldUseCustomUrl();
    
    // Get redirect URL (custom URL or our blocked page)
    const redirectUrl = useCustom
      ? getRedirectUrlWithFallback(getRedirectUrl())
      : getBlockedPageUrl();

    logger.info(`Updating rules for ${blockedSites.length} sites`);
    logger.info(
      `Using ${useCustom ? "custom URL" : "blocked page"}: ${redirectUrl}`
    );

    // ─────────────────────────────────────────────────────────────────────────
    // REMOVE EXISTING RULES
    // ─────────────────────────────────────────────────────────────────────────
    // Get all current rules and extract their IDs
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map((rule) => rule.id);

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE NEW RULES
    // ─────────────────────────────────────────────────────────────────────────
    const rules = [];
    let ruleId = 1; // Start rule ID counter

    // Loop through each blocked site and create 4 rules
    for (const site of blockedSites) {
      // ───────────────────────────────────────────────────────────────────────
      // CLEAN SITE URL
      // ───────────────────────────────────────────────────────────────────────
      // Remove protocol (http://, https://) and trailing slash
      // Input: "https://example.com/" → Output: "example.com"
      const cleanSite = site.replace(/^https?:\/\//, "").replace(/\/$/, "");

      // ───────────────────────────────────────────────────────────────────────
      // RULE 1: Block site with path
      // ───────────────────────────────────────────────────────────────────────
      // Matches: http://example.com/anything or https://example.com/anything
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: redirectUrl },
        },
        condition: {
          urlFilter: `*://${cleanSite}/*`,
          resourceTypes: ["main_frame"], // Only block main page, not resources
        },
      });

      // ───────────────────────────────────────────────────────────────────────
      // RULE 2: Block www variant
      // ───────────────────────────────────────────────────────────────────────
      // Only create this rule if the site doesn't already start with www
      // Matches: http://www.example.com/* or https://www.example.com/*
      if (!cleanSite.startsWith("www.")) {
        rules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { url: redirectUrl },
          },
          condition: {
            urlFilter: `*://www.${cleanSite}/*`,
            resourceTypes: ["main_frame"],
          },
        });
      }

      // ───────────────────────────────────────────────────────────────────────
      // RULE 3: Block all subdomains for root domains
      // ───────────────────────────────────────────────────────────────────────
      // Only for root domains (example.com, not blog.example.com)
      // Check if it's a root domain by counting dots
      // example.com = 1 dot = root domain
      // blog.example.com = 2 dots = subdomain
      if (cleanSite.split(".").length === 2) {
        // Matches: http://anything.example.com/* or https://blog.example.com/*
        rules.push({
          id: ruleId++,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { url: redirectUrl },
          },
          condition: {
            urlFilter: `*://*.${cleanSite}/*`,
            resourceTypes: ["main_frame"],
          },
        });
      }

      // ───────────────────────────────────────────────────────────────────────
      // RULE 4: Block exact domain without path
      // ───────────────────────────────────────────────────────────────────────
      // Matches: http://example.com or https://example.com (no trailing slash)
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: redirectUrl },
        },
        condition: {
          urlFilter: `*://${cleanSite}`,
          resourceTypes: ["main_frame"],
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE CHROME'S RULES
    // ─────────────────────────────────────────────────────────────────────────
    // Remove old rules and add new ones in a single atomic operation
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds, // Remove all old rules
      addRules: rules,                 // Add all new rules
    });

    logger.info(`Updated blocking rules: ${rules.length} rules active`);
  } catch (error) {
    logger.error("Error updating rules", error);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SET UP NAVIGATION LISTENERS FOR BLOCKED SITES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * These listeners don't DO the blocking (declarativeNetRequest does that).
 * Instead, they TRACK when blocking happens so we can:
 * - Update statistics (increment today's count)
 * - Show notifications (let user know something was blocked)
 * - Prevent duplicate counting (same tab blocked multiple times)
 * 
 * THREE NAVIGATION EVENTS WE LISTEN TO:
 * 1. onBeforeNavigate - Fires before navigation starts
 * 2. onCommitted - Fires when navigation commits (actually happens)
 * 3. onBeforeRedirect - Fires when server redirects occur
 * 
 * WHY THREE LISTENERS:
 * Chrome can fire multiple events for a single navigation. We check all three
 * to catch blocked sites reliably, but we use the blockedTabIds Set to ensure
 * we only count each block once.
 * 
 * DEBOUNCING STRATEGY:
 * When we detect a blocked site in a tab:
 * 1. Add tab ID to blockedTabIds Set
 * 2. Increment statistics and show notification
 * 3. After 2 seconds, remove tab ID from Set
 * This prevents counting multiple events for the same block.
 * 
 * @private
 */
function setupBlockedRequestListener() {
  // ───────────────────────────────────────────────────────────────────────────
  // CONTEXT CHECK
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExtensionContextValid()) {
    logger.warn("Context invalid, skipping listeners");
    return;
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // LISTENER 1: onBeforeNavigate
    // ─────────────────────────────────────────────────────────────────────────
    // Fires BEFORE navigation starts (earliest event)
    // This is where we typically catch blocked sites first
    chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
      // Always check context in async callbacks
      if (!isExtensionContextValid()) return;

      // Check if filter is enabled (master switch)
      if (!isFilterEnabled()) return;

      // Only check main frame (not iframes or sub-resources)
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // ───────────────────────────────────────────────────────────────────────
      // CHECK IF URL MATCHES BLOCKED SITE
      // ───────────────────────────────────────────────────────────────────────
      if (containsBlockedSite(url)) {
        logger.debug(`BEFORE navigate - Blocked site detected: ${url}`);

        // ─────────────────────────────────────────────────────────────────────
        // PREVENT DUPLICATE COUNTING
        // ─────────────────────────────────────────────────────────────────────
        // Only increment stats once per tab within debounce window
        if (!blockedTabIds.has(tabId)) {
          // Mark this tab as recently blocked
          blockedTabIds.add(tabId);
          
          // Update statistics
          await incrementStats(1);
          
          // Show notification to user
          await showContentBlockedNotification();

          // ─────────────────────────────────────────────────────────────────
          // CLEAR DEBOUNCE AFTER DELAY
          // ─────────────────────────────────────────────────────────────────
          // After 2 seconds, remove tab from Set so future blocks are counted
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        // ─────────────────────────────────────────────────────────────────────
        // ENSURE REDIRECT HAPPENS
        // ─────────────────────────────────────────────────────────────────────
        // declarativeNetRequest should handle this, but we double-check
        // to ensure the user gets redirected even if rules somehow fail
        const useCustom = shouldUseCustomUrl();
        const redirectUrl = useCustom
          ? getRedirectUrlWithFallback(getRedirectUrl())
          : getBlockedPageUrl(url);

        chrome.tabs.update(tabId, { url: redirectUrl });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LISTENER 2: onCommitted
    // ─────────────────────────────────────────────────────────────────────────
    // Fires when navigation commits (actually starts loading)
    // This is a secondary check in case we missed it in onBeforeNavigate
    chrome.webNavigation.onCommitted.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      if (!isFilterEnabled()) return;
      if (details.frameId !== 0) return;

      const url = details.url;
      const tabId = details.tabId;

      // Double-check after navigation commits
      // This catches any blocks that slipped through onBeforeNavigate
      if (containsBlockedSite(url)) {
        logger.debug(`COMMITTED - Blocked site detected: ${url}`);

        // Use same debouncing logic as onBeforeNavigate
        if (!blockedTabIds.has(tabId)) {
          blockedTabIds.add(tabId);
          await incrementStats(1);
          setTimeout(() => blockedTabIds.delete(tabId), TAB_BLOCKING_DEBOUNCE);
        }

        // Ensure redirect
        const useCustom = shouldUseCustomUrl();
        const redirectUrl = useCustom
          ? getRedirectUrlWithFallback(getRedirectUrl())
          : getBlockedPageUrl(url);

        chrome.tabs.update(tabId, { url: redirectUrl });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // LISTENER 3: onBeforeRedirect
    // ─────────────────────────────────────────────────────────────────────────
    // Fires when server performs a redirect
    // Example: Site redirects http → https or www → non-www
    // We need to check if the REDIRECT TARGET is blocked
    chrome.webNavigation.onBeforeRedirect.addListener(async (details) => {
      if (!isExtensionContextValid()) return;
      if (!isFilterEnabled()) return;
      if (details.frameId !== 0) return;

      // Check the redirect target URL
      const redirectUrl = details.redirectUrl;

      if (containsBlockedSite(redirectUrl)) {
        logger.debug(`Server redirect to blocked site: ${redirectUrl}`);
        // Note: We don't increment stats here because the redirect will
        // be caught by onBeforeNavigate or onCommitted
      }
    });

    logger.info("Navigation listeners setup complete");
  } catch (error) {
    logger.safeError("Error setting up listeners", error);
  }
}