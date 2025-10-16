/**
 * Premium Context
 *
 * Tracks subscription entitlements for the signed-in user.
 * Exposes a simple `isPremium` flag that flips immediately when
 * a subscription is activated or cancelled.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { createLogger } from '../utils/logger';

const logger = createLogger('PremiumContext');
const PremiumContext = createContext(null);

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);
const TERMINAL_STATUSES = new Set([
  'canceled',
  'cancelled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
]);

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;

  const status = String(subscription.status ?? '').toLowerCase();
  if (!status) return false;
  if (TERMINAL_STATUSES.has(status)) return false;
  if (!ACTIVE_STATUSES.has(status)) return false;

  const now = Date.now();

  const cancelAt = parseDate(subscription.cancel_at);
  if (cancelAt && cancelAt.getTime() <= now) {
    return false;
  }

  const endedAt =
    parseDate(subscription.ended_at) ??
    parseDate(subscription.canceled_at) ??
    parseDate(subscription.cancelled_at);
  if (endedAt && endedAt.getTime() <= now) {
    return false;
  }

  return true;
};

export function PremiumProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(false);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setStateForUser = useCallback((userId, setter) => {
    if (!isMountedRef.current) return;
    if (currentUserIdRef.current !== userId) return;
    setter();
  }, []);

  const fetchSubscription = useCallback(
    async (targetUser) => {
      const targetUserId = targetUser?.id ?? null;

      if (!isMountedRef.current) return null;

      if (!targetUserId) {
        setSubscription(null);
        setError(null);
        setLoading(false);
        return null;
      }

      setStateForUser(targetUserId, () => {
        setLoading(true);
        setError(null);
      });

      try {
        const { data, error: queryError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        setStateForUser(targetUserId, () => {
          setSubscription(data ?? null);
        });

        return data ?? null;
      } catch (err) {
        logger.error('Failed to load premium subscription', err);
        setStateForUser(targetUserId, () => {
          setSubscription(null);
          setError(err);
        });
        return null;
      } finally {
        setStateForUser(targetUserId, () => {
          setLoading(false);
        });
      }
    },
    [setStateForUser],
  );

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
    fetchSubscription(user);

    if (!user) {
      return undefined;
    }

    const channel = supabase
      .channel(`premium-subscriptions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const payloadUserId =
            payload.new?.user_id ?? payload.old?.user_id ?? null;
          if (payloadUserId !== user.id) {
            return;
          }

          if (!isMountedRef.current) {
            return;
          }

          if (payload.eventType === 'DELETE') {
            setStateForUser(user.id, () => {
              setSubscription(null);
            });
            return;
          }

          if (payload.new) {
            setStateForUser(user.id, () => {
              setSubscription(payload.new);
              setError(null);
            });
          } else {
            fetchSubscription(user);
          }
        },
      );

    // Subscribe and handle status in callback
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('Premium subscription channel connected');
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Premium subscription channel error');
      } else if (status === 'TIMED_OUT') {
        logger.warn('Premium subscription channel timed out');
      } else if (status === 'CLOSED') {
        logger.info('Premium subscription channel closed');
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubscription, setStateForUser]);

  const refresh = useCallback(() => fetchSubscription(user), [fetchSubscription, user]);

  const value = useMemo(() => {
    const status = String(subscription?.status ?? '').toLowerCase() || null;
    const isPremium = isSubscriptionActive(subscription);
    const cancellationScheduled = Boolean(subscription?.cancel_at_period_end);
    const cancellationEffectiveAt =
      parseDate(subscription?.cancel_at) ??
      parseDate(subscription?.current_period_end);

    return {
      subscription,
      status,
      isPremium,
      isCancelling: cancellationScheduled,
      cancellationEffectiveAt,
      loading: authLoading || loading,
      error,
      refresh,
    };
  }, [subscription, authLoading, loading, error, refresh]);

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
}