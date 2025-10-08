export const AddItemInput = ({ 
  value, 
  onChange, 
  onAdd, 
  placeholder, 
  buttonText = 'Add',
  buttonColor = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-primary hover:bg-secondary',
    green: 'bg-green-500 hover:bg-green-600',
    orange: 'bg-orange-500 hover:bg-orange-600'
  };

  return (
    <div className="flex gap-3">
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
        placeholder={placeholder}
        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none transition-colors"
      />
      <button 
        onClick={onAdd}
        className={`px-6 py-3 ${colorClasses[buttonColor]} text-white rounded-xl font-semibold transition-colors flex items-center gap-2`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        {buttonText}
      </button>
    </div>
  );
};