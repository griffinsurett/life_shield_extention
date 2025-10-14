// src/components/IconManager/IconUploadModal.jsx
import { Modal } from "../Modal";
import Button from "../Button";
import Input from "../Inputs/Input";

export const IconUploadModal = ({
  isOpen,
  onClose,
  selectedFile,
  iconName,
  previewUrl,
  uploading,
  onFileSelect,
  onIconNameChange,
  onUpload,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
      animationType="slide-up"
      showCloseButton={true}
    >
      <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-t-2xl">
        <h2 className="text-xl font-bold text-white">Upload Custom Icon</h2>
        <p className="text-white/80 text-sm mt-1">
          Choose an image file to use as your extension icon
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Icon File
          </label>
          <input
            type="file"
            accept=".svg,.png,.jpg,.jpeg,.ico,.webp"
            onChange={onFileSelect}
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-secondary cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">
            SVG, PNG, JPG, ICO, or WebP • Max 2MB
          </p>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-xl">
              {[16, 48, 128].map((size) => (
                <div key={size} className="text-center">
                  <div
                    className="bg-white rounded-lg shadow-sm flex items-center justify-center mb-1 mx-auto"
                    style={{ width: size, height: size }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: size - 4, height: size - 4 }}
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs text-gray-500">{size}px</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Name Input */}
        {selectedFile && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon Name
            </label>
            <Input
              type="text"
              value={iconName}
              onChange={(e) => onIconNameChange(e.target.value)}
              placeholder="e.g., Privacy Icon"
              className="input-base"
              maxLength={30}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            className="flex-1 btn-base btn-md btn-secondary font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={onUpload}
            disabled={!selectedFile || !iconName.trim() || uploading}
            className="flex-1 btn-base btn-md btn-primary font-semibold flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              "Upload Icon"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};