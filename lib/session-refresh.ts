import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';

interface RefreshableSession {
  data: any;
  status: string;
  refreshUserData: () => Promise<void>;
  isRefreshing: boolean;
  triggerFrequentPolling: () => void;
}

// Pages where credit updates are critical (more frequent polling)
const CREDIT_CRITICAL_PAGES = ['/subscription', '/settings', '/creations'];

// Pages where we should do minimal polling 
const MINIMAL_POLLING_PAGES = ['/dashboard', '/affiliate-dashboard'];

// Pages where we should NOT do automatic polling (only ad generation pipeline to prevent API costs)
const POLLING_EXCLUDED_PAGES = ['/ad'];

export function useRefreshableSession(): RefreshableSession {
  const { data, status, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  
  // Polling state management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const frequentPollingUntilRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  
  const refreshUserData = useCallback(async (force = false) => {
    if (!data?.user) return;
    
    // Prevent multiple simultaneous refreshes (unless forced) - increased debounce
    const now = Date.now();
    if (!force && (isRefreshing || (now - lastRefreshRef.current < 5000))) return; // Increased from 1s to 5s
    
    // Don't trigger refresh if tab is not visible (to prevent unwanted refreshes)
    if (!force && document.hidden) return;
    
    setIsRefreshing(true);
    lastRefreshRef.current = now;
    
    try {
      const url = force ? '/api/user/current?force=true' : '/api/user/current';
      const response = await fetch(url);
      if (response.ok) {
        const freshUserData = await response.json();
        
        // Update the session with fresh data
        await update({
          ...data,
          user: {
            ...data.user,
            credits: freshUserData.credits,
            plan: freshUserData.plan,
            name: freshUserData.name,
            email: freshUserData.email
          }
        });
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('credits-updated', {
          detail: { credits: freshUserData.credits, plan: freshUserData.plan }
        }));
        
        // Reset retry count on success
        retryCountRef.current = 0;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Exponential backoff for retries
      retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
    } finally {
      setIsRefreshing(false);
    }
  }, [data, update, isRefreshing]);

  // Trigger frequent polling for 2 minutes after credit-consuming actions
  const triggerFrequentPolling = useCallback(() => {
    frequentPollingUntilRef.current = Date.now() + (2 * 60 * 1000); // 2 minutes
    refreshUserData(true); // Immediate forced refresh
  }, [refreshUserData]);

  // Setup smart polling
  useEffect(() => {
    if (status !== 'authenticated' || !data?.user) return;

    const startPolling = () => {
      if (intervalRef.current) return; // Already polling

      const poll = async () => {
        // Skip polling on excluded pages to prevent interference
        const isOnExcludedPage = POLLING_EXCLUDED_PAGES.some(page => 
          router.pathname.startsWith(page)
        );
        if (isOnExcludedPage) {
          // Still schedule next poll but with a longer interval
          intervalRef.current = setTimeout(poll, 300000); // Check again in 5 minutes
          return;
        }
        
        const now = Date.now();
        const isOnCriticalPage = CREDIT_CRITICAL_PAGES.some(page => 
          router.pathname.startsWith(page)
        );
        const isOnMinimalPage = MINIMAL_POLLING_PAGES.some(page => 
          router.pathname.startsWith(page)
        );
        
        // Determine polling interval - very conservative to prevent tab switching issues
        let interval: number;
        
        if (now < frequentPollingUntilRef.current) {
          // Frequent polling after credit actions (every 30 seconds instead of 15)
          interval = 30000;
        } else if (isOnCriticalPage) {
          // Regular polling on credit-critical pages (every 2 minutes instead of 60s)
          interval = 120000;
        } else if (isOnMinimalPage) {
          // Minimal polling on dashboard/affiliate pages (every 15 minutes instead of 10)
          interval = 900000;
        } else {
          // Very infrequent polling on other pages (every 10 minutes instead of 5)
          interval = 600000;
        }
        
        // Apply exponential backoff on errors
        const backoffMultiplier = Math.pow(1.5, retryCountRef.current);
        interval *= backoffMultiplier;
        
        // Only refresh if tab is visible and not on minimal polling pages during background refresh
        if (!document.hidden || !isOnMinimalPage) {
          await refreshUserData();
        }
        
        // Schedule next poll
        intervalRef.current = setTimeout(poll, interval);
      };

      // Start polling immediately, then at intervals
      poll();
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start polling (no tab visibility handling)
    startPolling();

    return () => {
      stopPolling();
    };
  }, [status, data?.user, router.pathname, refreshUserData]);

  return {
    data,
    status,
    refreshUserData,
    isRefreshing,
    triggerFrequentPolling
  };
}

// Global session refresh utility
let refreshPromise: Promise<void> | null = null;

export async function refreshSessionGlobally() {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = new Promise(async (resolve) => {
    try {
      // Trigger a session update across all components
      const event = new CustomEvent('session-refresh');
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to refresh session globally:', error);
    } finally {
      refreshPromise = null;
      resolve();
    }
  });
  
  return refreshPromise;
}

// Global trigger for frequent polling after credit-consuming actions
export function triggerFrequentPollingGlobally() {
  try {
    const event = new CustomEvent('trigger-frequent-polling');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Failed to trigger frequent polling globally:', error);
  }
}