import { useListManager } from '../../shared/hooks/useListManager';
import { AddItemInput } from '../../shared/components/AddItemInput';
import { ListItem } from '../../shared/components/ListItem';
import { SectionHeader } from '../../shared/components/SectionHeader';
import { DEFAULT_SETTINGS } from '../../shared/utils/constants';

export const PhrasesTab = ({ settings, updateSettings, showToast }) => {
  const phraseManager = useListManager(
    settings.replacementPhrases,
    (phrases) => updateSettings({ replacementPhrases: phrases }),
    { 
      itemName: 'phrase',
      transform: (val) => val.trim(),
      duplicateCheck: true
    }
  );

  const resetPhrases = async () => {
    if (!confirm('Reset all phrases to defaults?')) return;
    await updateSettings({ replacementPhrases: DEFAULT_SETTINGS.replacementPhrases });
    showToast('Phrases reset to defaults', 'success');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Replacement Phrases</h2>
      <p className="text-gray-600 mb-6">These healthy phrases replace blocked words when detected</p>

      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
        <AddItemInput
          value={phraseManager.inputValue}
          onChange={phraseManager.setInputValue}
          onAdd={phraseManager.addItem}
          placeholder="Enter a healthy replacement phrase..."
          buttonText="Add Phrase"
          buttonColor="green"
        />
      </div>

      <div>
        <SectionHeader 
          title="Current Phrases" 
          count={settings.replacementPhrases.length}
          countColor="green"
        />
        
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {settings.replacementPhrases.map((phrase, index) => (
            <ListItem 
              key={index} 
              onRemove={() => phraseManager.removeItem(index)}
              bgColor="green"
            >
              <span className="italic">&quot;{phrase}&quot;</span>
            </ListItem>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={resetPhrases}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};