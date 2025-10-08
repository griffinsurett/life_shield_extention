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

      const containers = document.querySelectorAll(
        this.config.GOOGLE_SUGGESTION_SELECTORS.join(',')
      );
      containers.forEach(c => {
        if (c.textContent && this.utils.containsBlockedWord(c.textContent)) {
          c.style.cssText = 'display: none !important;';
          c.innerHTML = '';
        }
      });
    };

    setupGoogleSearch();
    setInterval(setupGoogleSearch, 300);
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