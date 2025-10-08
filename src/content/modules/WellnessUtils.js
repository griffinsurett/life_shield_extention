export class WellnessUtils {
  constructor(config) {
    this.config = config;
    this.sessionFilterCount = 0;
  }

  log(msg) {
    if (this.config.DEBUG_MODE) {
      console.log(`[Wellness Filter] ${msg}`);
    }
  }

  getRandomReplacement() {
    const phrases = this.config.REPLACEMENT_PHRASES;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  containsBlockedWord(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return this.config.BLOCKED_WORDS.some(word => 
      lower.includes(word.toLowerCase())
    );
  }

  scrubText(text) {
    let scrubbed = text;
    let foundCount = 0;
    
    this.config.BLOCKED_WORDS.forEach(word => {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'gi'
      );
      const matches = scrubbed.match(regex);
      if (matches) {
        foundCount += matches.length;
        scrubbed = scrubbed.replace(regex, this.getRandomReplacement());
      }
    });
    
    if (foundCount > 0) {
      this.sessionFilterCount += foundCount;
      this.updateFilterStats(foundCount);
    }
    
    return scrubbed;
  }

  checkURL() {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('query') || params.get('p') || '';

    if (this.containsBlockedWord(url) || this.containsBlockedWord(query)) {
      this.log(`Detected blocked word in URL, notifying background script`);
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          action: 'blockedUrl',
          url: window.location.href
        });
      }
    }
  }

  updateFilterStats(count) {
    console.log('[WellnessUtils] Updating stats with count:', count);
    
    // Update local storage stats
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['filterCount', 'todayCount'], (result) => {
        const newFilterCount = (result.filterCount || 0) + count;
        const newTodayCount = (result.todayCount || 0) + count;
        
        console.log('[WellnessUtils] New counts:', { newFilterCount, newTodayCount });
        
        chrome.storage.local.set({
          filterCount: newFilterCount,
          todayCount: newTodayCount
        }, () => {
          console.log('[WellnessUtils] Stats saved, sending updateBadge message');
          
          // Notify background to update badge
          chrome.runtime.sendMessage({
            action: 'updateBadge'
          });
        });
      });
    }
  }

  notifyContentFiltered(count) {
    if (this.config.SHOW_ALERTS && count > 0) {
      chrome.runtime.sendMessage({
        action: 'contentFiltered',
        count: count
      });
    }
  }
}