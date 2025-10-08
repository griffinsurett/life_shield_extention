export class SiteHandlers {
  constructor(config, utils, inputHandler) {
    this.config = config;
    this.utils = utils;
    this.inputHandler = inputHandler;
  }

setupGoogle() {
  const currentHost = window.location.hostname;
  if (!currentHost.includes('google')) return;

  const setupGoogleSearch = () => {
    const searchBox = document.querySelector(
      this.config.GOOGLE_SEARCH_SELECTORS.join(',')
    );
    
    if (searchBox) {
      if (!searchBox.dataset.filterAttached) {
        this.utils.log('Found Google search box, attaching listeners');
        this.inputHandler.attachToInputs(searchBox.parentElement || document);
        
        searchBox.setAttribute('autocomplete', 'off');
        searchBox.setAttribute('aria-autocomplete', 'none');
      }
    }

    // More aggressive suggestion removal
    const suggestionContainers = document.querySelectorAll(
      '[role="listbox"], .sbdd_b, .mkHrUc, .G43f7e, .erkvQe'
    );
    
    suggestionContainers.forEach(container => {
      // Check all child elements
      const allElements = container.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent || el.innerText || el.getAttribute('data-query') || '';
        if (text && this.utils.containsBlockedWord(text)) {
          // Remove the entire suggestion item
          const suggestionItem = el.closest('[role="option"], li, .sbct, div[jsname]');
          if (suggestionItem) {
            suggestionItem.remove();
            this.utils.log('Removed Google suggestion:', text);
          }
        }
      });
    });
  };

  setupGoogleSearch();
  setInterval(setupGoogleSearch, 100); // More frequent checking
}

  setupYahoo() {
    const currentHost = window.location.hostname;
    if (!currentHost.includes('yahoo')) return;

    setInterval(() => {
      const searchBox = document.querySelector(
        'input[name="p"], input[type="text"][role="combobox"], input[type="search"]'
      );

      if (searchBox && !searchBox.dataset.yahooIntercepted) {
        searchBox.dataset.yahooIntercepted = 'true';

        const originalDescriptor = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype, 
          'value'
        );

        Object.defineProperty(searchBox, 'value', {
          get: () => {
            const val = originalDescriptor.get.call(searchBox);
            if (this.utils.containsBlockedWord(val)) {
              return this.inputHandler.yahooLastCleanValue || 
                     this.utils.getRandomReplacement();
            }
            return val;
          },
          set: (newValue) => {
            if (this.utils.containsBlockedWord(newValue)) {
              const cleanValue = this.utils.getRandomReplacement();
              this.inputHandler.yahooLastCleanValue = cleanValue;
              originalDescriptor.set.call(searchBox, cleanValue);
            } else {
              this.inputHandler.yahooLastCleanValue = newValue;
              originalDescriptor.set.call(searchBox, newValue);
            }
          }
        });
      }

      if (searchBox && this.utils.containsBlockedWord(searchBox.value)) {
        const replacement = this.utils.getRandomReplacement();
        searchBox.value = replacement;
        this.inputHandler.yahooLastCleanValue = replacement;
      }
    }, 200);
  }

  init() {
    this.setupGoogle();
    this.setupYahoo();
  }
}