// src/components/BlockingNotice.jsx
import React from 'react';

export const BlockingNotice = ({ 
  type = 'words', // 'words' or 'sites'
  variant = 'warning' // 'warning', 'info', 'danger'
}) => {
  const config = {
    words: {
      icon: '🛡️',
      title: 'Instant Protection',
      message: 'Words are filtered immediately after adding. Your blocked words are working in the background to protect your wellness journey.',
      action: 'filtered from all web pages'
    },
    sites: {
      icon: '⚠️',
      title: 'Instant Protection',
      message: 'Sites are blocked immediately after adding. Your block list is working in the background to protect your wellness journey.',
      action: 'redirect you to your safe space'
    }
  };

  const variantStyles = {
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      titleColor: 'text-orange-900',
      textColor: 'text-orange-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800'
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      titleColor: 'text-red-900',
      textColor: 'text-red-800'
    }
  };

  const content = config[type];
  const styles = variantStyles[variant];

  return (
    <div className={`p-4 ${styles.bg} border-2 ${styles.border} rounded-xl`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{content.icon}</span>
        <div>
          <p className={`text-sm ${styles.titleColor} font-medium mb-1`}>
            {content.title}
          </p>
          <p className={`text-xs ${styles.textColor}`}>
            {content.message}
          </p>
          <p className={`text-xs ${styles.textColor} mt-1 font-medium`}>
            • Blocked {type} will {content.action}
          </p>
          <p className={`text-xs ${styles.textColor} mt-1`}>
            • Go to Settings to view and manage your complete list
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockingNotice;