// src/components/ListManager.jsx
import { useState, useCallback, useMemo } from 'react';
import { useConfirmation } from '../hooks/useConfirmation';
import { ConfirmationModal } from './ConfirmationModal';
import Badge from './Badge';
import Input from './Inputs/Input';
import Button from './Button';

export const ListManager = ({
  // Core props
  items = [],
  onItemsChange,
  itemName = 'item',
  itemNamePlural,
  
  // UI props
  placeholder,
  icon,
  variant = 'default', // 'default', 'danger', 'success', 'warning', 'compact'
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
      addButton: 'px-5 py-2.5 bg-white text-red-600 rounded-lg font-bold text-sm hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200',
      border: 'border-red-400/40',
      bg: 'from-red-500/20 to-pink-500/20',
      icon: icon || '🚫',
      inputClass: 'flex-1 px-3 py-2.5 rounded-lg text-sm bg-black/20 border-0 text-white placeholder-white/60',
      containerClass: 'p-4 bg-gradient-to-br rounded-xl border-2 backdrop-blur-sm',
      headerClass: 'mb-3',
      titleClass: 'text-sm font-bold uppercase tracking-wide',
      countClass: 'text-xs font-medium opacity-80',
      helperClass: 'text-xs opacity-80 mt-3',
    },
  }), [icon]);

  const config = variantConfig[variant] || variantConfig.default;

  // Add item handler
  const handleAdd = useCallback(() => {
    let processed = inputValue.trim();
    if (!processed) {
      showToast?.(`Please enter a ${itemName.toLowerCase()}`, 'error');
      return;
    }

    if (transformItem) {
      processed = transformItem(processed);
    }

    if (processed.length < minLength) {
      showToast?.(`${itemName} must be at least ${minLength} character${minLength > 1 ? 's' : ''}`, 'error');
      return;
    }

    if (validateItem) {
      const error = validateItem(processed, items);
      if (error) {
        showToast?.(error, 'error');
        return;
      }
    }

    if (!allowDuplicates && items.includes(processed)) {
      showToast?.(`"${processed}" is already in the list`, 'error');
      return;
    }

    if (maxItems && items.length >= maxItems) {
      showToast?.(`Maximum ${maxItems} ${pluralName.toLowerCase()} allowed`, 'error');
      return;
    }

    const performAdd = () => {
      onItemsChange([...items, processed]);
      setInputValue('');
      showToast?.(`Added "${processed}"`, 'success');
    };

    if (confirmAdd) {
      const confirmMessage = typeof confirmAdd === 'string' 
        ? confirmAdd.replace('{item}', processed)
        : `Are you sure you want to add "${processed}"?`;
        
      confirmation.showConfirmation({
        title: `Add ${itemName}?`,
        message: confirmMessage,
        confirmText: `Yes, Add ${itemName}`,
        confirmColor: variant === 'danger' ? 'red' : 'primary',
        onConfirm: performAdd
      });
    } else {
      performAdd();
    }
  }, [inputValue, items, itemName, pluralName, minLength, maxItems, allowDuplicates, confirmAdd, transformItem, validateItem, onItemsChange, showToast, variant, confirmation]);

  // Remove item handler
  const handleRemove = useCallback((index) => {
    const item = items[index];
    
    const performRemove = () => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onItemsChange(newItems);
      showToast?.(`Removed "${item}"`, 'success');
    };

    if (confirmRemove) {
      const confirmMessage = typeof confirmRemove === 'string'
        ? confirmRemove.replace('{item}', item)
        : `Remove "${item}" from the list?`;
        
      confirmation.showConfirmation({
        title: `Remove ${itemName}?`,
        message: confirmMessage,
        confirmText: 'Yes, Remove',
        confirmColor: 'red',
        onConfirm: performRemove
      });
    } else {
      performRemove();
    }
  }, [items, itemName, confirmRemove, onItemsChange, showToast, confirmation]);

  // Clear all handler
  const handleClearAll = useCallback(() => {
    confirmation.showConfirmation({
      title: `Clear All ${pluralName}?`,
      message: `This will remove all ${items.length} ${items.length === 1 ? itemName.toLowerCase() : pluralName.toLowerCase()}. This action cannot be undone.`,
      confirmText: 'Yes, Clear All',
      confirmColor: 'red',
      onConfirm: () => {
        onItemsChange([]);
        showToast?.(`All ${pluralName.toLowerCase()} cleared`, 'success');
      }
    });
  }, [items, itemName, pluralName, onItemsChange, showToast, confirmation]);

  // Unlock handler for protected lists
  const handleUnlock = useCallback(() => {
    confirmation.showConfirmation({
      title: `Show ${pluralName}?`,
      message: `This will reveal your ${pluralName.toLowerCase()}. These are hidden for your privacy and protection. Continue?`,
      confirmText: 'Yes, Show List',
      confirmColor: 'orange',
      onConfirm: () => setIsUnlocked(true)
    });
  }, [pluralName, confirmation]);

  // Stats display
  const stats = useMemo(() => ({
    current: items.length,
    max: maxItems,
    percentage: maxItems ? Math.round((items.length / maxItems) * 100) : null
  }), [items.length, maxItems]);

  // Render compact variant (like Current Site style)
  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className={`${config.containerClass} ${config.border} ${config.bg}`}>
          <div className={config.headerClass}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <h3 className={config.titleClass}>Add {itemName}</h3>
              </div>
              <span className={config.countClass}>
                {items.length} {items.length === 1 ? itemName.toLowerCase() : pluralName.toLowerCase()}
              </span>
            </div>
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
              className={`${config.addButton} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              Block
            </Button>
          </div>

          <p className={config.helperClass}>
            {itemName}s are blocked immediately after adding
          </p>
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

  // Original full variant rendering
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

      {/* Rest of the component (Protected lists, etc.) */}
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
                {isUnlocked ? 'Lock' : 'Unlock'}
              </Button>
            </div>
          )}

          {(!isProtected || isUnlocked) ? (
            items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-5xl mb-3 opacity-20">{config.icon}</div>
                <p className="text-gray-500 font-medium">No {pluralName.toLowerCase()} yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first one above</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">
                    Current {pluralName} ({items.length})
                  </h3>
                  {items.length > 3 && (
                    <Button
                      onClick={handleClearAll}
                      className="btn-base btn-sm btn-danger"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl max-h-96 overflow-y-auto">
                  {items.map((item, index) => (
                    <Badge
                      key={`${item}-${index}`}
                      onRemove={() => handleRemove(index)}
                    >
                      <span className="mr-1">{config.icon}</span>
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl animate-pulse">🛡️</span>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Content Protected</p>
                  <p className="text-sm text-yellow-800">
                    Your {pluralName.toLowerCase()} are hidden for privacy but remain active.
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