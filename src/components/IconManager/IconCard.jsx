// src/components/IconManager/IconCard.jsx
import Button from "../Button";
import Icon from "../../assets/icon.png"

export const IconCard = ({
  icon,
  isActive,
  isDefault = false,
  onSwitch,
  onDelete,
}) => {
  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon Preview */}
        {isDefault ? (
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-gray-200">
            <img
              src={Icon}
              alt="Default Icon"
              className="w-10 h-10 object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={icon.sizes[48]}
              alt={icon.name}
              className="w-10 h-10 object-contain"
            />
          </div>
        )}

        {/* Icon Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 truncate">
            {isDefault ? "Default Icon" : icon.name}
          </h4>
          <p className="text-sm text-gray-600">
            {isDefault
              ? "Original Wellness Filter icon"
              : `${icon.type.toUpperCase()} • ${new Date(
                  icon.createdAt
                ).toLocaleDateString()}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive ? (
            <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
              ✓ Active
            </div>
          ) : (
            <Button
              onClick={onSwitch}
              className="btn-base btn-sm btn-primary"
            >
              Switch
            </Button>
          )}
          {!isDefault && (
            <Button
              onClick={onDelete}
              className="btn-base btn-sm btn-danger"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};