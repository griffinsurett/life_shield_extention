// src/components/PageWrapper.jsx
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
        <AppProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppProvider>
      </ErrorBoundary>
    );
  }

  // For simple pages like blocked page that don't need full context
  return (
    <ErrorBoundary showDetails={showErrorDetails}>
      {children}
    </ErrorBoundary>
  );
};