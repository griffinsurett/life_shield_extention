// src/components/SettingSection.jsx
export const SettingSection = ({ 
  title, 
  description, 
  children, 
  noBorder = false 
}) => {
  return (
    <div className={noBorder ? "" : "pb-6 border-b border-gray-200"}>
      {title && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-4">{description}</p>
          )}
        </>
      )}
      {children}
    </div>
  );
};