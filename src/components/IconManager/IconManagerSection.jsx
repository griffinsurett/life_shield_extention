// src/components/IconManager/IconManagerSection.jsx
import { useState } from "react";
import { useIconManager } from "../../hooks/useIconManager";
import { IconUploadModal } from "./IconUploadModal";
import { IconCard } from "./IconCard";
import Button from "../Button";
import { ICON_CONFIG, ICON_VALIDATION } from "../../config/icons";

export const IconManagerSection = ({ showToast, showConfirmation }) => {
  const { icons, activeIconId, loading, uploadIcon, switchIcon, deleteIcon } =
    useIconManager();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [iconName, setIconName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (!ICON_VALIDATION.validateSize(file.size)) {
      showToast(ICON_VALIDATION.getErrorMessage('size'), "error");
      return;
    }

    // Validate file type
    if (!ICON_VALIDATION.validateFormat(file.type)) {
      showToast(ICON_VALIDATION.getErrorMessage('format'), "error");
      return;
    }

    setSelectedFile(file);
    setIconName(file.name.replace(/\.[^/.]+$/, ""));

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await uploadIcon(selectedFile, iconName);
      handleCloseModal();
    } catch {
      // Error handled by hook
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setIconName("");
    setPreviewUrl(null);
  };

  const handleSwitchIcon = (iconId) => {
    showConfirmation({
      title: iconId === "default" ? "Reset to Default Icon?" : "Switch Icon?",
      message:
        iconId === "default"
          ? "This will reset the extension icon to the default Wellness Filter icon."
          : "This will change the extension icon across all tabs and notifications.",
      confirmText: iconId === "default" ? "Reset" : "Switch",
      confirmColor: "primary",
      onConfirm: () => switchIcon(iconId),
    });
  };

  const handleDeleteIcon = (iconId, iconName) => {
    showConfirmation({
      title: "Delete Custom Icon?",
      message: `Are you sure you want to delete "${iconName}"? This action cannot be undone.`,
      confirmText: "Delete",
      confirmColor: "red",
      onConfirm: () => deleteIcon(iconId),
    });
  };

  return (
    <>
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Custom Extension Icon
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload custom icons for enhanced privacy and anonymity
        </p>

        {/* Anonymity Notice */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🔒</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Anonymity Protection
              </h4>
              <p className="text-sm text-blue-800">
                Custom icons help disguise this extension's presence in your
                browser toolbar and notification center, making it less
                identifiable to others who might view your screen.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-4">
          <Button
            onClick={() => setShowUploadModal(true)}
            disabled={loading || icons.length >= ICON_CONFIG.MAX_ICONS}
            className="btn-base btn-md btn-primary flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload Custom Icon
          </Button>
          {icons.length >= ICON_CONFIG.MAX_ICONS && (
            <p className="text-sm text-orange-600 mt-2">
              {ICON_VALIDATION.getErrorMessage('limit')}
            </p>
          )}
        </div>

        {/* Icon Grid */}
        <div className="space-y-3">
          {/* Default Icon */}
          <IconCard
            isDefault
            isActive={activeIconId === "default"}
            onSwitch={() => handleSwitchIcon("default")}
          />

          {/* Custom Icons */}
          {icons.map((icon) => (
            <IconCard
              key={icon.id}
              icon={icon}
              isActive={activeIconId === icon.id}
              onSwitch={() => handleSwitchIcon(icon.id)}
              onDelete={() => handleDeleteIcon(icon.id, icon.name)}
            />
          ))}

          {/* Empty State */}
          {icons.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2 opacity-20">🎨</div>
              <p className="text-gray-500 text-sm font-medium">
                No custom icons yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Upload your first custom icon above
              </p>
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">
            Requirements
          </h4>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• Formats: {ICON_CONFIG.SUPPORTED_FORMATS.map(f => f.split('/')[1].toUpperCase()).join(', ')}</li>
            <li>• Max size: {ICON_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB</li>
            <li>• Recommended: Square images (1:1 ratio)</li>
            <li>• Maximum {ICON_CONFIG.MAX_ICONS} custom icons</li>
          </ul>
        </div>
      </div>

      {/* Upload Modal */}
      <IconUploadModal
        isOpen={showUploadModal}
        onClose={handleCloseModal}
        selectedFile={selectedFile}
        iconName={iconName}
        previewUrl={previewUrl}
        uploading={uploading}
        onFileSelect={handleFileSelect}
        onIconNameChange={setIconName}
        onUpload={handleUpload}
      />
    </>
  );
};