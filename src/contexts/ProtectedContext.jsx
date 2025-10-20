/**
 * Protected Context
 * 
 * Provides hashing utilities throughout the application.
 * No state management - just utility functions.
 * 
 * @module contexts/ProtectedContext
 */

import { createContext, useContext } from 'react';
import * as hashing from '../utils/hashing';

const ProtectedContext = createContext(null);

/**
 * Protected Provider Component
 * Wraps application to provide hashing utilities
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function ProtectedProvider({ children }) {
  const value = {
    hashString: hashing.hashString,
    hashArray: hashing.hashArray,
    containsHashedWord: hashing.containsHashedWord,
    containsHashedSite: hashing.containsHashedSite,
    getDisplayHash: hashing.getDisplayHash,
    isHash: hashing.isHash,
  };

  return (
    <ProtectedContext.Provider value={value}>
      {children}
    </ProtectedContext.Provider>
  );
}

/**
 * Hook to access protected/hashing utilities
 * Must be used within ProtectedProvider
 * 
 * @returns {Object} Hashing utility functions
 * @throws {Error} If used outside ProtectedProvider
 * 
 * @example
 * function MyComponent() {
 *   const { hashString, isHash } = useProtected();
 *   const hash = await hashString('example');
 *   return <div>{hash}</div>;
 * }
 */
export function useProtected() {
  const context = useContext(ProtectedContext);
  
  if (!context) {
    throw new Error('useProtected must be used within ProtectedProvider');
  }
  
  return context;
}