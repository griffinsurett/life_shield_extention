/**
 * Blocked Page Component
 * 
 * Displays when user tries to access blocked content.
 * Shows custom message with extension logo.
 */

import { useState, useEffect } from 'react';
import { BRAND, DEFAULTS } from '../../config';

const Blocked = () => {
  const [customMessage, setCustomMessage] = useState(DEFAULTS.CUSTOM_MESSAGE);
  const [blockedUrl, setBlockedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get custom message from storage
    try {
      chrome.storage.sync.get(['customMessage'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Storage error:', chrome.runtime.lastError);
          setIsLoading(false);
          return;
        }
        
        if (result.customMessage) {
          setCustomMessage(result.customMessage);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error accessing storage:', error);
      setIsLoading(false);
    }

    // Get the URL that was blocked (from URL params)
    try {
      const params = new URLSearchParams(window.location.search);
      const url = params.get('blocked');
      if (url) {
        setBlockedUrl(decodeURIComponent(url));
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
  }, []);

  const goBack = () => {
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.remove(tabs[0].id);
          }
        });
      }
    } catch (error) {
      console.error('Error going back:', error);
      window.close();
    }
  };

  const openSettings = () => {
    try {
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-secondary flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-purple-600 to-secondary flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-fade-in">
        {/* Logo */}
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl">
          {BRAND.ICON}
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Content Blocked
        </h1>
        
        {/* Custom Message */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 mb-6">
          <p className="text-lg text-gray-700 leading-relaxed">
            {customMessage}
          </p>
        </div>

        {/* Blocked URL (if available) */}
        {blockedUrl && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">Blocked URL:</p>
            <p className="text-xs text-gray-700 font-mono break-all">
              {blockedUrl}
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={goBack}
            className="px-6 py-3 bg-primary hover:bg-secondary text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Go Back
          </button>
          <button
            onClick={openSettings}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-all"
          >
            Open Settings
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {BRAND.NAME} • {BRAND.TAGLINE}
          </p>
        </div>
      </div>
    </div>
  );
};

export { Blocked };