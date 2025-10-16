// src/pages/settings/tabs/WellnessTab.jsx
import { SobrietySettings } from "../../../components/Sobriety/SobrietySettings";

const WellnessTab = ({ showToast, showConfirmation }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Wellness Journey
      </h2>
      <p className="text-gray-600 mb-6">
        Track your progress and celebrate your milestones
      </p>

      <div className="space-y-8">
        {/* Sobriety Tracker Section */}
        <div className="pb-8 border-b border-gray-200">
          <SobrietySettings
            showToast={showToast}
            showConfirmation={showConfirmation}
          />
        </div>

        {/* Future Wellness Features Teaser */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                More Wellness Tools Coming Soon
              </h3>
              <p className="text-sm text-blue-800">
                Daily check-ins, mood tracking, and gratitude journaling features in development
              </p>
            </div>
          </div>
        </div>

        {/* Support Resources Card */}
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🤝</span>
            <h3 className="font-semibold text-green-900">Support Resources</h3>
          </div>
          <div className="space-y-2 text-sm text-green-800">
            <p className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span>National Crisis Hotline: <strong>988</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <span className="text-green-600">•</span>
              <span>SAMHSA Helpline: <strong>1-800-662-4357</strong></span>
            </p>
            <p className="text-xs text-green-700 mt-3 italic">
              Remember: You're not alone on this journey. Help is always available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessTab;