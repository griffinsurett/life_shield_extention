export class TextScrubber {
  constructor(utils) {
    this.utils = utils;
  }

  scrubTextNodesIn(element) {
    if (!element) return 0;
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let count = 0;
    const nodesToScrub = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue && node.nodeValue.trim() && this.utils.containsBlockedWord(node.nodeValue)) {
        nodesToScrub.push(node);
      }
    }

    nodesToScrub.forEach(node => {
      const original = node.nodeValue;
      const scrubbed = this.utils.scrubText(original);
      if (scrubbed !== original) {
        node.nodeValue = scrubbed;
        count++;
      }
    });

    return count;
  }
}