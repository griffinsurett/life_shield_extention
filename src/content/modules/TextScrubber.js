export class TextScrubber {
  constructor(utils) {
    this.utils = utils;
    this.processedElements = new WeakSet();
  }

  scrubTextNodesIn(container) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement &&
              (node.parentElement.tagName === 'SCRIPT' ||
               node.parentElement.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    const nodesToUpdate = [];

    while ((node = walker.nextNode())) {
      if (this.utils.containsBlockedWord(node.textContent)) {
        nodesToUpdate.push(node);
      }
    }

    nodesToUpdate.forEach(node => {
      node.textContent = this.utils.scrubText(node.textContent);
    });

    return nodesToUpdate.length;
  }
}