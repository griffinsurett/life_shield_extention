// src/components/BlockingBehaviorSection.jsx
import Input from "./Inputs/Input";
import Textarea from "./Inputs/Textarea";

export const BlockingBehaviorSection = ({
  useCustomUrl,
  redirectUrl,
  customMessage,
  onToggleCustomUrl,
  onRedirectChange,
  onMessageChange,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Blocking Behavior
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose what happens when blocked content is detected
      </p>

      <div className="space-y-4">
        {/* Built-in Blocked Page Option */}
        <label
          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
            !useCustomUrl
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="blockBehavior"
              checked={!useCustomUrl}
              onChange={() => onToggleCustomUrl(false)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🛡️</span>
                <span className="font-semibold text-gray-800">
                  Built-in Blocked Page
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Show a custom message on our blocked page
              </p>

              {!useCustomUrl && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (optional)
                  </label>
                  <Textarea
                    value={customMessage || ""}
                    onChange={onMessageChange}
                    placeholder="This site is blocked for your wellbeing"
                    className="textarea-base"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        </label>

        {/* Custom URL Option */}
        <label
          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
            useCustomUrl
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="blockBehavior"
              checked={useCustomUrl}
              onChange={() => onToggleCustomUrl(true)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔗</span>
                <span className="font-semibold text-gray-800">
                  Custom Redirect URL
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Redirect to a specific website when content is blocked
              </p>

              {useCustomUrl && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Redirect URL
                  </label>
                  <Input
                    type="url"
                    value={redirectUrl}
                    onChange={onRedirectChange}
                    placeholder="https://example.com"
                    className="input-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a full URL including https://
                  </p>
                </div>
              )}
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};