export const SectionHeader = ({ title, count, countColor = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {count !== undefined && (
        <span className={`px-3 py-1 ${colorClasses[countColor]} rounded-full text-sm font-medium`}>
          {count} {title.toLowerCase()}
        </span>
      )}
    </div>
  );
};