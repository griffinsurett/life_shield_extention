// src/components/PageWrapper.jsx
import { AuthProvider } from '../contexts/AuthContext'; // Add this import

/**
 * Page Wrapper Component
 * 
 * Centralizes common setup for all extension pages.
 * Handles styles, error boundaries, and context providers.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.withProviders - Include AppProvider and ToastProvider (default: true)
 * @param {boolean} props.showErrorDetails - Show detailed error info (default: true)
 */

import { AppProvider } from '../contexts/AppContext';
import { ToastProvider } from './ToastContainer';
import { ErrorBoundary } from './ErrorBoundary';
import '../index.css'; // Import styles once here

export const PageWrapper = ({ 
  children, 
  withProviders = true,
  showErrorDetails = true 
}) => {
  if (withProviders) {
    return (
      <ErrorBoundary showDetails={showErrorDetails}>
        <AuthProvider>  {/* Add this */}
          <AppProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AppProvider>
        </AuthProvider>  {/* Add this */}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary showDetails={showErrorDetails}>
      {children}
    </ErrorBoundary>
  );
};