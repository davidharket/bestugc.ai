import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Generate a session ID that persists across page views but not browser sessions
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    // Generate a random session ID
    sessionId = 'vs_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
}

// Track a page visit
async function trackVisit(page: string) {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getSessionId();
    
    await fetch('/api/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        page,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
      }),
    });
  } catch (error) {
    // Silently fail - don't break the user experience
    console.warn('Failed to track visit:', error);
  }
}

// Custom hook for visitor tracking
export function useVisitorTracking() {
  const router = useRouter();

  useEffect(() => {
    // Track the initial page load
    trackVisit(router.asPath);

    // Track route changes
    const handleRouteChange = (url: string) => {
      trackVisit(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
}

export default useVisitorTracking;