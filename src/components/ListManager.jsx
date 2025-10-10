/**
 * List Manager Component
 * 
 * Reusable component for managing lists of items.
 * Now with persistent lock/unlock toggle for sensitive data.
 * 
 * @component
 */

import { memo, useCallback, useState } from 'react';
import Badge from './Badge';
import { AddItemInput } from './AddItemInput';
import { SectionHeader } from './SectionHeader';

const ListManager = memo(({
  items = [],
  onAdd,
  onRemove,
  onClear,
  placeholder = 'Enter item...',
  buttonText = 'Add',
  emptyText = 'No items yet',
  variant = 'default',
  title,
  inputValue,
  onInputChange,
  renderItem,
  itemIcon,
  maxHeight = 'max-h-96',
  isVulnerable = false,
  onRequestShow,
}) => {
  // Track if vulnerable content is revealed (locked/unlocked state)
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Color schemes for different variants
  const variants = {
    default: {
      button: 'primary',
      section: 'primary',
      badge: 'default'
    },
    danger: {
      button: 'orange',
      section: 'orange',
      badge: 'danger'
    },
    success: {
      button: 'green',
      section: 'green',
      badge: 'default'
    }
  };

  const colors = variants[variant];

  // Memoized remove handler factory
  const createRemoveHandler = useCallback((index) => {
    return () => onRemove(index);
  }, [onRemove]);

  // Handle unlock request - show confirmation first
  const handleUnlockRequest = useCallback(() => {
    if (onRequestShow) {
      onRequestShow(() => setIsUnlocked(true));
    }
  }, [onRequestShow]);

  // Handle lock - no confirmation needed
  const handleLock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  // Determine if content should be hidden
  const shouldHideContent = isVulnerable && !isUnlocked;

  return (
    <div className="space-y-6">
      {/* Lock/Unlock Toggle - shown when vulnerable */}
      {isVulnerable && (
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
      )}

      {/* Add input section - always visible */}
      <div className={`p-6 rounded-xl border-2 ${
        variant === 'default' ? 'bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20' :
        variant === 'danger' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' :
        'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
      }`}>
        <AddItemInput
          value={inputValue}
          onChange={onInputChange}
          onAdd={onAdd}
          placeholder={placeholder}
          buttonText={buttonText}
          buttonColor={colors.button}
        />
      </div>

      {/* Items list */}
      <div>
        {title && (
          <SectionHeader
            title={title}
            count={items.length}
            countColor={colors.section}
          />
        )}

        {/* Warning banner when locked */}
        {shouldHideContent && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">🔒</span>
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>Protected Content:</strong> This list is locked for your privacy. 
                  Use the unlock button above to view and manage items.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* List content - hidden if vulnerable and locked */}
        {!shouldHideContent && (
          <>
            <div className={`space-y-2 ${maxHeight} overflow-y-auto pr-2`}>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="font-medium">{emptyText}</p>
                  <p className="text-sm mt-1">Add one using the input above</p>
                </div>
              ) : (
                items.map((item, index) => (
                  renderItem ? (
                    renderItem(item, index, onRemove)
                  ) : (
                    <Badge
                      key={`${item}-${index}`}
                      onRemove={createRemoveHandler(index)}
                      variant={colors.badge}
                      icon={itemIcon}
                    >
                      {item}
                    </Badge>
                  )
                ))
              )}
            </div>

            {/* Clear all button - only show when unlocked */}
            {onClear && items.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={onClear}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </>
        )}

        {/* Show count even when locked */}
        {shouldHideContent && items.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'} hidden
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ListManager.displayName = 'ListManager';

export default ListManager;