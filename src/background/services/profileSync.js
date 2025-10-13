/**
 * Profile Sync Service - LEAN VERSION
 * 
 * Background service for profile synchronization.
 * Simplified without unnecessary fallbacks.
 * 
 * @module background/services/profileSync
 */

import { isExtensionContextValid } from '../../utils/chromeApi';
import { createLogger } from '../../utils/logger';
import { profileCache } from '../../services/cache/ProfileCacheManager';

const logger = createLogger('ProfileSync');

// Message types
const MESSAGE_TYPES = {
  GET_PROFILE: 'profile:get',
  UPDATE_PROFILE: 'profile:update',
  INVALIDATE_CACHE: 'profile:invalidate',
  PROFILE_UPDATED: 'profile:updated',
  GET_METRICS: 'profile:metrics',
};

/**
 * Initialize profile sync service
 */
export function initProfileSync() {
  if (!isExtensionContextValid()) {
    logger.warn('Context invalid, skipping init');
    return;
  }

  logger.info('Initializing profile sync service');
  setupMessageListener();
}

/**
 * Setup message listener for profile requests
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.type?.startsWith('profile:')) {
      return false;
    }

    logger.debug(`Message received: ${message.type}`);

    // Handle async responses
    handleProfileMessage(message, sender)
      .then(sendResponse)
      .catch(error => {
        logger.error('Message handler error', error);
        sendResponse({ error: error.message });
      });

    return true; // Will respond asynchronously
  });
}

/**
 * Handle profile-related messages
 */
async function handleProfileMessage(message, sender) {
  switch (message.type) {
    case MESSAGE_TYPES.GET_PROFILE:
      return handleGetProfile(message.userId);
    
    case MESSAGE_TYPES.UPDATE_PROFILE:
      return handleUpdateProfile(message.userId, message.updates);
    
    case MESSAGE_TYPES.INVALIDATE_CACHE:
      return handleInvalidateCache(message.userId);
    
    case MESSAGE_TYPES.GET_METRICS:
      return profileCache.getMetrics();
    
    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

/**
 * Handle get profile request
 */
async function handleGetProfile(userId) {
  if (!userId) {
    throw new Error('userId required');
  }

  const result = await profileCache.getProfile(
    userId,
    async (id) => {
      logger.info('Fetching from Supabase');
      const { supabase } = await import('../../services/supabase');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  );

  logger.info(`Profile retrieved (source: ${result.source})`);
  return result;
}

/**
 * Handle update profile request with optimistic updates
 */
async function handleUpdateProfile(userId, updates) {
  if (!userId || !updates) {
    throw new Error('userId and updates required');
  }

  // Optimistically update cache
  const optimisticUpdate = await profileCache.updateCachedProfile(userId, updates);
  
  // Perform actual database update in background
  performDatabaseUpdate(userId, updates).catch(error => {
    logger.error('Background update failed', error);
    // In production, you might want to rollback the optimistic update here
  });
  
  return { success: true, profile: optimisticUpdate };
}

/**
 * Handle cache invalidation
 */
async function handleInvalidateCache(userId) {
  await profileCache.invalidate(userId);
  logger.info('Cache invalidated', { userId });
  return { success: true };
}

/**
 * Perform actual database update
 */
async function performDatabaseUpdate(userId, updates) {
  const { supabase } = await import('../../services/supabase');
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update cache with fresh data
  await profileCache.cacheProfile(userId, data);
  
  // Broadcast update to all tabs
  await broadcastProfileUpdate(userId, data);
  
  return data;
}

/**
 * Broadcast profile update to all tabs
 */
async function broadcastProfileUpdate(userId, profile) {
  const tabs = await chrome.tabs.query({});
  
  const message = {
    type: MESSAGE_TYPES.PROFILE_UPDATED,
    userId,
    profile,
  };
  
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {
      // Ignore errors - tab might not have content script
    });
  });
  
  logger.debug(`Profile update broadcast to ${tabs.length} tabs`);
}