/**
 * Words Tab Component
 * 
 * Full blocked words management interface.
 * Now significantly simplified using ListManager and AppContext.
 * 
 * @component
 */

import { useApp } from '../../contexts/AppContext';
import ListManager from '../../components/ListManager';

export const WordsTab = ({ wordManager, showConfirmation }) => {
  const { settings } = useApp();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Blocked Words Management
      </h2>

      <ListManager
        items={settings.blockedWords}
        inputValue={wordManager.inputValue}
        onInputChange={wordManager.setInputValue}
        onAdd={() => wordManager.addItem(showConfirmation)}
        onRemove={wordManager.removeItem}
        onClear={() => wordManager.clearAll("Are you sure you want to remove all blocked words?")}
        placeholder="Enter word or phrase to block..."
        buttonText="Add Word"
        emptyText="No blocked words yet"
        title="Current Blocked Words"
        variant="default"
      />
    </div>
  );
};