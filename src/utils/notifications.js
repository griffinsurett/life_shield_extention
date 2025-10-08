export const showNotification = (title, message) => {
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: title,
      message: message,
      priority: 1
    });
  }
};

export const sendNotificationRequest = (title, message) => {
  chrome.runtime.sendMessage({
    action: 'showNotification',
    title,
    message
  });
};