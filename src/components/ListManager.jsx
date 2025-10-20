// src/components/ListManager.jsx
import { useState, useCallback, useMemo } from 'react';
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from './ConfirmationModal';
import Input from './Inputs/Input';
import Button from './Button';
import { hashString } from '../utils/hashing';

export const ListManager = ({
  // Core props
  items = [],
  onItemsChange,
  itemName = 'item',
  itemNamePlural,
  
  // UI props
  placeholder,
  icon,
  variant = 'default',
  showList = true,
  
  // Behavior props
  confirmAdd = false,
  confirmRemove = false,
  allowDuplicates = false,
  isProtected = false,
  
  // Transform/Validate props
  transformItem,
  validateItem,
  
  // Utility props
  showToast,
  maxItems,
  minLength = 1,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(!isProtected);
  const confirmation = useConfirmation();

  // Computed values
  const pluralName = itemNamePlural || `${itemName}s`;
  
  // Color configuration based on variant
  const variantConfig = useMemo(() => ({
    default: {
      addButton: 'btn-primary',
      border: 'border-primary/20',
      bg: 'from-primary/5 to-secondary/5',
      icon: icon || '📝',
      inputClass: 'input-base flex-1',
      containerClass: 'p-6 rounded-xl border-2 bg-gradient-to-r',
    },
    danger: {
      addButton: 'btn-danger',
      border: 'border-red-200',
      bg: 'from-red-50 to-orange-50',
      icon: icon || '🚫',
      inputClass: 'input-base flex-1',
      containerClass: 'p-6 rounded-xl border-2 bg-gradient-to-r',
    },
    success: {
      addButton: 'bg-green-600 hover:bg-green-700 text-white',
      border: 'border-green-200',
      bg: 'from-green-50 to-emerald-50',
      icon: icon || '✨',
      inputClass: 'input-base flex-1',
      containerClass: 'p-6 rounded-xl border-2 bg-gradient-to-r',
    },
    warning: {
      addButton: 'bg-orange-600 hover:bg-orange-700 text-white',
      border: 'border-orange-200',
      bg: 'from-orange-50 to-yellow-50',
      icon: icon || '⚠️',
      inputClass: 'input-base flex-1',
      containerClass: 'p-6 rounded-xl border-2 bg-gradient-to-r',
    },
    compact: {
      icon: icon || '📝',
    },
  }), [icon]);

  const config = variantConfig[variant] || variantConfig.default;

  // Calculate stats for maxItems
  const stats = useMemo(() => {
    if (!maxItems) return null;
    return {
      current: items.length,
      max: maxItems,
      percentage: Math.round((items.length / maxItems) * 100)
    };
  }, [items.length, maxItems]);

  /**
   * Handle adding a new item
   * Hashes the item if isProtected is true
   */
  const handleAdd = useCallback(async () => {
    let value = inputValue.trim();
    
    if (!value) return;
    if (value.length < minLength) {
      if (showToast) {
        showToast(`${itemName} must be at least ${minLength} characters`, 'error');
      }
      return;
    }

    // Transform if function provided
    if (transformItem) {
      value = transformItem(value);
    }

    // Validate if function provided
    if (validateItem) {
      const error = validateItem(value);
      if (error) {
        if (showToast) showToast(error, 'error');
        return;
      }
    }

    // Check max items
    if (maxItems && items.length >= maxItems) {
      if (showToast) {
        showToast(`Maximum ${maxItems} ${pluralName.toLowerCase()} allowed`, 'error');
      }
      return;
    }

    // Hash if protected
    let itemToAdd = value;
    if (isProtected) {
      try {
        itemToAdd = await hashString(value);
      } catch (error) {
        console.error('Error hashing item:', error);
        if (showToast) {
          showToast('Failed to process item', 'error');
        }
        return;
      }
    }

    // Check duplicates (check against hashed value if protected)
    if (!allowDuplicates && items.includes(itemToAdd)) {
      if (showToast) {
        showToast(`This ${itemName.toLowerCase()} is already blocked`, 'info');
      }
      return;
    }

    // Add with confirmation if needed
    if (confirmAdd) {
      const message = typeof confirmAdd === 'string' 
        ? confirmAdd.replace('{item}', value)
        : `Add "${value}" to ${pluralName.toLowerCase()}?`;
      
      confirmation.showConfirmation({
        title: `Add ${itemName}?`,
        message,
        confirmText: 'Add',
        confirmColor: 'primary',
        onConfirm: () => {
          onItemsChange([...items, itemToAdd]);
          setInputValue('');
          if (showToast) {
            showToast(`${itemName} blocked successfully`, 'success');
          }
        }
      });
    } else {
      onItemsChange([...items, itemToAdd]);
      setInputValue('');
      if (showToast) {
        showToast(`${itemName} blocked successfully`, 'success');
      }
    }
  }, [inputValue, items, itemName, pluralName, minLength, maxItems, transformItem, validateItem, allowDuplicates, confirmAdd, isProtected, onItemsChange, showToast, confirmation]);

  /**
   * Handle removing an item
   */
  const handleRemove = useCallback((index) => {
    const itemToRemove = items[index];
    
    if (confirmRemove) {
      // For protected items, we can't show the actual value
      const displayText = isProtected 
        ? `this ${itemName.toLowerCase()}`
        : `"${itemToRemove}"`;
      
      const message = typeof confirmRemove === 'string'
        ? confirmRemove.replace('{item}', displayText)
        : `Remove ${displayText}?`;
      
      confirmation.showConfirmation({
        title: `Remove ${itemName}?`,
        message,
        confirmText: 'Remove',
        confirmColor: 'red',
        onConfirm: () => {
          const newItems = items.filter((_, i) => i !== index);
          onItemsChange(newItems);
          if (showToast) {
            showToast(`${itemName} removed`, 'success');
          }
        }
      });
    } else {
      const newItems = items.filter((_, i) => i !== index);
      onItemsChange(newItems);
      if (showToast) {
        showToast(`${itemName} removed`, 'success');
      }
    }
  }, [items, itemName, confirmRemove, isProtected, onItemsChange, showToast, confirmation]);

  /**
   * Handle unlocking protected list
   */
  const handleUnlock = useCallback(() => {
    confirmation.showConfirmation({
      title: '⚠️ Warning: Sensitive Content',
      message: `The ${pluralName.toLowerCase()} contain potentially triggering content that may not be safe for recovery. Are you sure you want to view them?`,
      confirmText: 'Yes, Show List',
      cancelText: 'Keep Hidden',
      confirmColor: 'orange',
      onConfirm: () => {
        setIsUnlocked(true);
        if (showToast) {
          showToast('List unlocked temporarily', 'info');
        }
      }
    });
  }, [pluralName, showToast, confirmation]);

  // Compact variant rendering (matching Quick Block style)
  if (variant === 'compact') {
    return (
      <div className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl border-2 border-red-400/40 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{config.icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            {items.length} blocked {pluralName.toLowerCase()}
          </h3>
        </div>

        {/* Input and Block Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="bg-black/20 rounded-lg p-3 mb-3">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder={placeholder || `Enter ${itemName.toLowerCase()}...`}
                className="w-full bg-transparent border-none text-white placeholder-white/50 focus:outline-none p-0 text-xs font-mono"
                maxLength={100}
              />
            </div>
            <p className="text-xs text-white/60">
              {itemName}s are blocked immediately after adding
            </p>
          </div>
          
          <Button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="flex-shrink-0 px-4 py-3 bg-white text-red-600 rounded-lg font-bold text-sm hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 flex flex-col items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-xs">Block</span>
          </Button>
        </div>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmation.isOpen}
          onClose={confirmation.closeModal}
          title={confirmation.config.title}
          message={confirmation.config.message}
          confirmText={confirmation.config.confirmText}
          cancelText={confirmation.config.cancelText}
          confirmColor={confirmation.config.confirmColor}
          onConfirm={confirmation.handleConfirm}
          onCancel={confirmation.handleCancel}
        />
      </div>
    );
  }

  // Original full variant rendering (for settings page)
  return (
    <div className="space-y-6">
      {/* Add Input Section */}
      <div className={`${config.containerClass} ${config.border} ${config.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">
            Add {itemName}
          </h3>
          <span className="text-sm text-gray-600 font-medium">
            {items.length} {items.length === 1 ? itemName.toLowerCase() : pluralName.toLowerCase()}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={placeholder || `Enter ${itemName.toLowerCase()}...`}
            className={config.inputClass}
            maxLength={100}
          />
          <Button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className={`btn-base btn-md ${config.addButton} font-medium`}
          >
            Add
          </Button>
        </div>
        
        {maxItems && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{stats.current} / {stats.max}</span>
              <span>{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  stats.percentage >= 90 ? 'bg-red-500' :
                  stats.percentage >= 70 ? 'bg-orange-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* List Display Section */}
      {showList && (
        <>
          {isProtected && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isUnlocked ? 'bg-green-100 rotate-0' : 'bg-yellow-100 rotate-12'
                }`}>
                  {isUnlocked ? '🔓' : '🔒'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isUnlocked ? 'List Visible' : 'List Protected'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {items.length} {items.length === 1 ? itemName.toLowerCase() : pluralName.toLowerCase()}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={isUnlocked ? () => setIsUnlocked(false) : handleUnlock}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isUnlocked 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white animate-pulse'
                }`}
              >
                {isUnlocked ? 'Lock' : 'Unlock to View'}
              </Button>
            </div>
          )}

          {(!isProtected || isUnlocked) && items.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <span className="text-gray-700 break-all font-mono text-sm">
                        {item}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleRemove(index)}
                      className="ml-3 text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0"
                      aria-label={`Remove ${itemName}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!isProtected || isUnlocked) && items.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3 opacity-30">{config.icon}</div>
              <p className="text-gray-600 font-medium mb-1">
                No {pluralName.toLowerCase()} yet
              </p>
              <p className="text-sm text-gray-500">
                Add your first {itemName.toLowerCase()} above to get started
              </p>
            </div>
          )}

          {isProtected && !isUnlocked && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Protected List Hidden
                  </h4>
                  <p className="text-sm text-yellow-800">
                    This list contains sensitive content that may not be safe for recovery. 
                    Click unlock above to view or manage them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.closeModal}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        confirmColor={confirmation.config.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
};

export default ListManager;