// src/settings/Settings.jsx
/**
 * Settings Component
 *
 * Main settings page with code splitting.
 * Tabs are lazy-loaded to reduce initial bundle size.
 *
 * SIMPLIFIED: Removed advanced technical settings for better UX
 *
 * @component
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { useToast } from "../../components/ToastContainer";
import { SimpleErrorBoundary } from "../../components/ErrorBoundary";

// Lazy load all tab components
const GeneralTab = lazy(() => import("./tabs/GeneralTab"));
const AccountTab = lazy(() => import("./tabs/AccountTab"));
const WordsTab = lazy(() => import("./tabs/WordsTab"));
const PhrasesTab = lazy(() => import("./tabs/PhrasesTab"));
const SitesTab = lazy(() => import("./tabs/SitesTab"));
const StatsTab = lazy(() => import("./tabs/StatsTab"));
const AboutTab = lazy(() => import("./tabs/AboutTab"));

/**
 * Loading spinner component
 */
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
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", name: "General", icon: "⚙️", component: GeneralTab },
    { id: "account", name: "Account", icon: "👤", component: AccountTab },
    { id: "words", name: "Blocked Words", icon: "📝", component: WordsTab },
    {
      id: "phrases",
      name: "Replacement Phrases",
      icon: "💬",
      component: PhrasesTab,
    },
    { id: "sites", name: "Blocked Sites", icon: "🚫", component: SitesTab },
    { id: "stats", name: "Statistics", icon: "📊", component: StatsTab },
    { id: "about", name: "About", icon: "ℹ️", component: AboutTab },
  ];

  // Get active tab component
  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const TabComponent = activeTabData?.component;

  // Memoized tab renderer with lazy loading
  const renderTab = useCallback(() => {
    if (!TabComponent) return null;

    const props = { showToast };

    return (
      <SimpleErrorBoundary>
        <Suspense fallback={<TabLoader />}>
          <TabComponent {...props} />
        </Suspense>
      </SimpleErrorBoundary>
    );
  }, [TabComponent, showToast]);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <header className="bg-gradient-to-r from-primary to-secondary shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              🌿
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">Wellness Filter</h1>
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
            <nav className="bg-white rounded-2xl shadow-lg p-4 sticky top-6">
              <div className="space-y-2">
                {tabs.map((tab) => (
                  <button
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
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <main className="lg:col-span-3">{renderTab()}</main>
        </div>
      </div>
    </div>
  );
};
