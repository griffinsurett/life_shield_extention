/**
 * List Manager Component
 * 
 * Reusable component for managing lists of items.
 * Now with optimized re-renders using useCallback.
 * 
 * @component
 */

import { memo, useCallback } from 'react';
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
  maxHeight = 'max-h-96'
}) => {
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

  return (
    <div className="space-y-6">
      {/* Add input section */}
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
      </div>

      {/* Clear all button */}
      {onClear && items.length > 0 && (
        <div>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
});

ListManager.displayName = 'ListManager';

export default ListManager;