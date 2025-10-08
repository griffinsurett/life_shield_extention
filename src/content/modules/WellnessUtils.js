export class WellnessUtils {
  constructor(config) {
    this.config = config;
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
    this.config.BLOCKED_WORDS.forEach(word => {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
        'gi'
      );
      scrubbed = scrubbed.replace(regex, this.getRandomReplacement());
    });
    return scrubbed;
  }

  isSiteExcluded() {
    const currentHost = window.location.hostname;
    return this.config.EXCLUDED_SITES.some(site => 
      currentHost.includes(site)
    );
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
}