// src/pages/settings/Settings.jsx
/**
 * Settings Component
 *
 * Main settings page with checkbox-controlled modal.
 *
 * @component
 */

// src/pages/settings/Settings.jsx
import { useState, useCallback, lazy, Suspense } from "react";
import { useToast } from "../../components/ToastContainer";
import { useConfirmation } from "../../hooks/useConfirmation";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { SimpleErrorBoundary } from "../../components/ErrorBoundary";
import { AccountSection } from "./components/AccountSection";
import Button from "../../components/Button";
import { BRAND } from "../../config";

// Lazy load all tab components
const GeneralTab = lazy(() => import("./tabs/GeneralTab"));
const WordsTab = lazy(() => import("./tabs/WordsTab"));
const PhrasesTab = lazy(() => import("./tabs/PhrasesTab"));
const SitesTab = lazy(() => import("./tabs/SitesTab"));
const StatsTab = lazy(() => import("./tabs/StatsTab"));
const AboutTab = lazy(() => import("./tabs/AboutTab"));

const TabLoader = () => (
  <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

export const Settings = () => {
  const { showToast } = useToast();
  const confirmation = useConfirmation();
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", name: "General", icon: "⚙️", component: GeneralTab },
    { id: "words", name: "Blocked Words", icon: "📝", component: WordsTab },
    { id: "sites", name: "Blocked Sites", icon: "🚫", component: SitesTab },
    { id: "phrases", name: "Replacement Phrases", icon: "💬", component: PhrasesTab },
    { id: "stats", name: "Statistics", icon: "📊", component: StatsTab },
    { id: "about", name: "About", icon: "ℹ️", component: AboutTab },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const TabComponent = activeTabData?.component;

  const renderTab = useCallback(() => {
    if (!TabComponent) return null;

    const props = {
      showToast,
      showConfirmation: confirmation.showConfirmation,
    };

    return (
      <SimpleErrorBoundary>
        <Suspense fallback={<TabLoader />}>
          <TabComponent {...props} />
        </Suspense>
      </SimpleErrorBoundary>
    );
  }, [TabComponent, showToast, confirmation.showConfirmation]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <header className="bg-gradient-to-r from-primary to-secondary shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              {BRAND.ICON}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">{BRAND.NAME}</h1>
              <p className="text-white/80 text-sm">
                Advanced Settings & Configuration
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg sticky top-6 overflow-hidden">
              {/* Main Navigation */}
              <nav className="p-0">
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      {tab.name}
                    </Button>
                  ))}
                </div>
              </nav>

              <div className="border-t border-gray-200 mx-4"></div>

              <AccountSection showToast={showToast} />
            </div>
          </aside>

          <main className="lg:col-span-3">{renderTab()}</main>
        </div>
      </div>

      {/* Confirmation Modal - using the new system */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.closeModal}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        confirmColor={confirmation.config.confirmColor}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
};