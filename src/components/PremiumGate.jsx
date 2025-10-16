import { usePremium } from '../contexts/PremiumContext';

/**
 * Renders children only when the user has an active premium subscription.
 * Optionally renders a fallback when premium access is unavailable.
 */
export function PremiumGate({ children, fallback = null, showWhileLoading = false }) {
  const { isPremium, loading } = usePremium();

  if (loading && !showWhileLoading) {
    return fallback;
  }

  if (!isPremium) {
    return fallback;
  }

  return children;
}

