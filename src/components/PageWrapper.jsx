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

// src/components/PageWrapper.jsx
import { AppProvider } from '../contexts/AppContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ModalProvider } from '../contexts/ModalContext';
import { ToastProvider } from './ToastContainer';
import { ErrorBoundary } from './ErrorBoundary';
import '../index.css';

export const PageWrapper = ({ 
  children, 
  withProviders = true,
  showErrorDetails = true 
}) => {
  if (withProviders) {
    return (
      <ErrorBoundary showDetails={showErrorDetails}>
        <ModalProvider>
          <AuthProvider>
            <AppProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AppProvider>
          </AuthProvider>
        </ModalProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary showDetails={showErrorDetails}>
      {children}
    </ErrorBoundary>
  );
};