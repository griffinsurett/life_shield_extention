export class ElementCleaner {
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    this.processedElements = new WeakSet();
  }

  hideBlockedElements(container = document.body) {
    const targetSelectors = this.config.SUGGESTION_SELECTORS;
    let elements = Array.from(container.querySelectorAll(targetSelectors.join(',')));
    
    if (container !== document.body && container.nodeType === 1) {
      if (container.matches && targetSelectors.some(sel => container.matches(sel))) {
        elements.push(container);
      }
    }

    let removedCount = 0;
    elements.forEach(element => {
      if (this.processedElements.has(element)) return;

      const text = element.textContent || element.innerText ||
                  element.getAttribute('data-query') ||
                  element.getAttribute('aria-label') || '';

      if (text && this.utils.containsBlockedWord(text)) {
        element.style.display = 'none';
        element.remove();
        removedCount++;
        this.processedElements.add(element);
      }
    });

    if (removedCount > 0) {
      this.utils.log(`Removed ${removedCount} suggestion elements`);
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      [data-scrubbed="true"] {
        ${this.config.BLUR_INSTEAD_OF_HIDE ? 'filter: blur(5px) !important;' : ''}
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.head) document.head.appendChild(style);
      });
    }
  }
}