export class EventListeners {
  constructor(utils) {
    this.utils = utils;
  }

  setupClickBlocker() {
    document.addEventListener('click', (e) => {
      const text = e.target.textContent || e.target.innerText || '';
      if (this.utils.containsBlockedWord(text)) {
        e.preventDefault();
        e.stopPropagation();
        this.utils.log('Blocked click on filtered content');
        return false;
      }
    }, true);
  }

  setupFormBlocker() {
    document.addEventListener('submit', (e) => {
      const inputs = e.target.querySelectorAll('input, textarea');
      for (let input of inputs) {
        if (this.utils.containsBlockedWord(input.value || input.textContent || '')) {
          e.preventDefault();
          this.utils.log('Blocked form submission');
          return false;
        }
      }
    }, true);
  }

  init() {
    this.setupClickBlocker();
    this.setupFormBlocker();
  }
}