/**
 * Settings Component
 * 
 * Main settings page with tabbed interface.
 * Provides comprehensive configuration options for the extension.
 * 
 * Tabs:
 * - General: Master settings and redirect URL
 * - Blocked Words: Manage word filtering
 * - Replacement Phrases: Manage healthy alternatives
 * - Blocked Sites: Manage site blocking
 * - Statistics: View usage stats
 * - Advanced: Performance tuning and reset
 * - About: Extension information
 * 
 * Features:
 * - Sidebar navigation
 * - Tab-based interface
 * - Responsive layout
 * - Toast notifications
 * - Gradient header
 * 
 * @component
 */

import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useStats } from "../hooks/useStats";
import { useToast } from "../components/ToastContainer";
import { GeneralTab } from "./tabs/GeneralTab";
import { WordsTab } from "./tabs/WordsTab";
import { PhrasesTab } from "./tabs/PhrasesTab";
import { SitesTab } from "./tabs/SitesTab";
import { StatsTab } from "./tabs/StatsTab";
import { AdvancedTab } from "./tabs/AdvancedTab";
import { AboutTab } from "./tabs/AboutTab";

export const Settings = () => {
  // Load settings, stats, and toast
  const { settings, updateSettings } = useSettings();
  const { stats, resetStats } = useStats();
  const { showToast } = useToast();
  
  // Track active tab
  const [activeTab, setActiveTab] = useState("general");

  /**
   * Tab configuration
   * Defines all available tabs with icons and labels
   */
  const tabs = [
    { id: "general", name: "General", icon: "⚙️" },
    { id: "words", name: "Blocked Words", icon: "📝" },
    { id: "phrases", name: "Replacement Phrases", icon: "💬" },
    { id: "sites", name: "Blocked Sites", icon: "🚫" },
    { id: "stats", name: "Statistics", icon: "📊" },
    { id: "advanced", name: "Advanced", icon: "⚡" },
    { id: "about", name: "About", icon: "ℹ️" },
  ];

  /**
   * Render the active tab component
   * Passes common props to all tabs
   * 
   * @returns {React.ReactElement} Active tab component
   */
  const renderTab = () => {
    // Common props for all tabs
    const props = { settings, updateSettings, stats, resetStats, showToast };

    // Render appropriate tab component
    switch (activeTab) {
      case "general":
        return <GeneralTab {...props} />;
      case "words":
        return <WordsTab {...props} />;
      case "phrases":
        return <PhrasesTab {...props} />;
      case "sites":
        return <SitesTab {...props} />;
      case "stats":
        return <StatsTab {...props} />;
      case "advanced":
        return <AdvancedTab {...props} />;
      case "about":
        return <AboutTab />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header with gradient */}
      <header className="bg-gradient-to-r from-primary to-secondary shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {/* Extension icon */}
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
              🌿
            </div>
            
            {/* Title and subtitle */}
            <div className="text-white">
              <h1 className="text-3xl font-bold">Wellness Filter</h1>
              <p className="text-white/80 text-sm">
                Advanced Settings & Configuration
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar navigation */}
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

          {/* Main content - active tab */}
          <main className="lg:col-span-3">{renderTab()}</main>
        </div>
      </div>
    </div>
  );
};