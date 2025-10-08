export class InputHandler {
  constructor(config, utils) {
    this.config = config;
    this.utils = utils;
    this.yahooLastCleanValue = "";
  }

  cleanInput(element) {
    if (!element) return;

    const value = element.value || element.textContent || element.innerText || '';

    if (this.utils.containsBlockedWord(value)) {
      if (element.value !== undefined) {
        element.value = this.utils.scrubText(value);
      } else {
        element.textContent = this.utils.scrubText(value);
      }

      if (element.matches('input[name="q"], input[type="search"], input[name="p"]')) {
        element.value = this.utils.getRandomReplacement();
        this.utils.log('Replaced search input with healthy alternative');
      }
    }

    const currentHost = window.location.hostname;
    if (currentHost.includes('yahoo') && 
        element.matches('input[name="p"], input[type="text"][role="combobox"]')) {
      this.yahooLastCleanValue = element.value;
    }
  }

  attachToInputs(container = document) {
    const selector = this.config.INPUT_SELECTORS.join(',');
    let inputs = Array.from(container.querySelectorAll(selector));
    
    if (container !== document && container.nodeType === 1) {
      if (container.matches && container.matches(selector.replace(/:not\([^)]+\)/g, ''))) {
        if (!container.dataset.filterAttached) {
          inputs.push(container);
        }
      }
    }

    inputs.forEach(input => {
      input.dataset.filterAttached = 'true';
      this.cleanInput(input);
      
      if (this.config.DEBUG_MODE) {
        const inputType = input.tagName + 
                         (input.name ? `[name="${input.name}"]` : '') + 
                         (input.type ? `[type="${input.type}"]` : '');
        this.utils.log(`Attached to input: ${inputType}`);
      }

      ['input', 'keyup', 'paste', 'change'].forEach(eventType => {
        input.addEventListener(eventType, () => this.cleanInput(input), { passive: true });
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          const value = input.value || input.textContent || '';
          if (this.utils.containsBlockedWord(value)) {
            e.preventDefault();
            e.stopPropagation();
            input.value = this.utils.getRandomReplacement();
            this.utils.log('Blocked Enter submission');
            return false;
          }
        }
      });
    });

    return inputs.length;
  }
}