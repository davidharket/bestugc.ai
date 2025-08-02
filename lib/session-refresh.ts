import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

interface RefreshableSession {
  data: any;
  status: string;
  refreshUserData: () => Promise<void>;
  isRefreshing: boolean;
}

export function useRefreshableSession(): RefreshableSession {
  const { data, status, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUserData = useCallback(async () => {
    if (!data?.user) return;
    
    setIsRefreshing(true);
    try {
      // Fetch fresh user data from the database
      const response = await fetch('/api/user/current');
      if (response.ok) {
        const freshUserData = await response.json();
        
        // Update the session with fresh data
        await update({
          ...data,
          user: {
            ...data.user,
            credits: freshUserData.credits,
            plan: freshUserData.plan
          }
        });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [data, update]);

  return {
    data,
    status,
    refreshUserData,
    isRefreshing
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