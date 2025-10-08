/**
 * App Context
 * 
 * Global state management using React Context.
 * Provides settings and statistics to all components.
 * 
 * @module contexts/AppContext
 */

import { createContext, useContext } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useStats } from '../hooks/useStats';

const AppContext = createContext(null);

/**
 * App Provider Component
 * Wraps application to provide global state
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function AppProvider({ children }) {
  const settingsState = useSettings();
  const statsState = useStats();

  const value = {
    // Settings
    settings: settingsState.settings,
    updateSettings: settingsState.updateSettings,
    settingsLoading: settingsState.loading,
    
    // Stats
    stats: statsState.stats,
    resetStats: statsState.resetStats,
    loadStats: statsState.loadStats,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to access app context
 * Must be used within AppProvider
 * 
 * @returns {Object} App context value
 * @throws {Error} If used outside AppProvider
 * 
 * @example
 * function MyComponent() {
 *   const { settings, updateSettings } = useApp();
 *   return <div>{settings.blockedWords.length} words blocked</div>;
 * }
 */
export function useApp() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  
  return context;
}