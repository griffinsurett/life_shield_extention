export class StatsManager {
  constructor(badgeManager) {
    this.badgeManager = badgeManager;
    this.init();
  }

  init() {
    this.checkDailyReset();
    // Check for daily reset every hour
    setInterval(() => this.checkDailyReset(), 3600000);
  }

  async checkDailyReset() {
    const result = await chrome.storage.local.get(['lastResetDate']);
    const today = new Date().toLocaleDateString();
    
    if (result.lastResetDate !== today) {
      await chrome.storage.local.set({
        todayCount: 0,
        lastResetDate: today
      });
      this.badgeManager.updateBadge();
      console.log('[Background] Daily count reset');
    }
  }

  async incrementStats(count = 1) {
    const result = await chrome.storage.local.get(['filterCount', 'todayCount']);
    const newFilterCount = (result.filterCount || 0) + count;
    const newTodayCount = (result.todayCount || 0) + count;
    
    await chrome.storage.local.set({
      filterCount: newFilterCount,
      todayCount: newTodayCount
    });
    
    this.badgeManager.updateBadge();
    console.log('[Background] Stats incremented:', { newFilterCount, newTodayCount });
  }

  async initializeStats() {
    await chrome.storage.local.set({
      filterCount: 0,
      todayCount: 0,
      installDate: new Date().toLocaleDateString(),
      lastResetDate: new Date().toLocaleDateString()
    });
  }
}