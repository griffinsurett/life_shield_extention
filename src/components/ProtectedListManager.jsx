// src/components/ProtectedListManager.jsx
/**
 * Protected List Manager Component
 * 
 * Secure wrapper around ListManager for sensitive data (blocked words/sites).
 * Adds lock/unlock functionality and vulnerability protection.
 * 
 * Key features:
 * - Lock/unlock toggle for viewing sensitive content
 * - Confirmation modal before unlocking
 * - Security warnings and messaging
 * - Protected state management
 * 
 * @component
 */

import { useState, useCallback } from 'react';
import ListManager from './ListManager';

export const ProtectedListManager = ({
  items,
  itemName,           // Singular: "Word", "Site"
  itemNamePlural,     // Plural: "Blocked Words", "Blocked Sites"
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  onClear,
  placeholder,
  variant = 'default',
  itemIcon,
  hideList = false,
  showConfirmation,
  maxHeight = 'max-h-96',
}) => {
  // Track if protected content is unlocked
  const [isUnlocked, setIsUnlocked] = useState(false);

  /**
   * Handle unlock request - show confirmation first
   */
  const handleUnlockRequest = useCallback(() => {
    showConfirmation({
      title: `⚠️ Show ${itemNamePlural}?`,
      message: `You are about to reveal your list of ${itemNamePlural.toLowerCase()}. This is sensitive content that helps protect your browsing experience. Are you sure you want to display it?`,
      confirmText: "Yes, Show List",
      cancelText: "Keep Hidden",
      confirmColor: "primary",
      onConfirm: () => setIsUnlocked(true)
    });
  }, [showConfirmation, itemNamePlural]);

  /**
   * Handle lock - no confirmation needed
   */
  const handleLock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  // In hideList mode, don't show lock/unlock - just use the base component
  if (hideList) {
    return (
      <>
        <ListManager
          items={items}
          inputValue={inputValue}
          onInputChange={onInputChange}
          onAdd={onAdd}
          onRemove={onRemove}
          onClear={onClear}
          placeholder={placeholder}
          buttonText={`Block ${itemName}`}
          emptyText={`No ${itemNamePlural.toLowerCase()} yet`}
          title={itemNamePlural}
          variant={variant}
          itemIcon={itemIcon}
          hideList={true}
        />
        
        {/* Security note in hideList mode */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              variant === 'default' ? 'bg-primary/10' :
              variant === 'danger' ? 'bg-red-100' :
              'bg-green-100'
            }`}>
              <span className="text-2xl">{itemIcon || '📝'}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Total {itemNamePlural}
              </p>
              <p className="text-3xl font-bold text-gray-800">{items.length}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <strong>Protected:</strong>
              </span>
              {' '}List hidden for privacy. Access via full Settings page.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Full mode with lock/unlock protection
  return (
    <div className="space-y-6">
      {/* Lock/Unlock Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isUnlocked ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            {isUnlocked ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {isUnlocked ? 'Content Unlocked' : 'Content Locked'}
            </h3>
            <p className="text-sm text-gray-600">
              {isUnlocked 
                ? 'Sensitive content is visible'
                : 'Protected for your privacy'
              }
            </p>
          </div>
        </div>
        
        {/* Lock/Unlock Button */}
        {isUnlocked ? (
          <button
            onClick={handleLock}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Lock
          </button>
        ) : (
          <button
            onClick={handleUnlockRequest}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            Unlock
          </button>
        )}
      </div>

      {/* Add Input - always visible */}
      <ListManager
        items={items}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onAdd={onAdd}
        onRemove={onRemove}
        onClear={isUnlocked ? onClear : undefined}
        placeholder={placeholder}
        buttonText={`Block ${itemName}`}
        emptyText={`No ${itemNamePlural.toLowerCase()} yet`}
        title={`Current ${itemNamePlural}`}
        variant={variant}
        itemIcon={itemIcon}
        maxHeight={maxHeight}
        hideList={!isUnlocked}
      />

      {/* Warning banner when locked */}
      {!isUnlocked && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>Protected Content:</strong> This list is locked for your privacy. 
                Use the unlock button above to view and manage items.
              </p>
            </div>
          </div>
          
          {/* Show count even when locked */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-lg">
                <svg className="w-4 h-4 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-medium text-yellow-800 text-sm">
                  {items.length} {items.length === 1 ? 'item' : 'items'} hidden
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};