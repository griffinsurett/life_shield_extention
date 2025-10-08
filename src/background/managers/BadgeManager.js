export class BadgeManager {
  constructor() {
    this.init();
  }

  init() {
    this.updateBadge();
    // Update badge every minute
    setInterval(() => this.updateBadge(), 60000);
  }

  async updateBadge() {
    const result = await chrome.storage.local.get(['todayCount']);
    const count = result.todayCount || 0;
    
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }

  async setBadgeCount(count) {
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}