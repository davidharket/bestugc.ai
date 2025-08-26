import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { AdCreationProvider } from '../components/AdCreationContext'
import { Layout } from '../components/Layout'
import { Toaster } from 'react-hot-toast'
import { useVisitorTracking } from '../lib/useVisitorTracking'
import GoogleAnalytics from '../components/GoogleAnalytics'
import { useEffect } from 'react'

function AppContent({ Component, pageProps }: { Component: any, pageProps: any }) {
  // Initialize visitor tracking
  useVisitorTracking();

  // Cache busting for build manifest mismatches
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Failed to fetch')) {
        console.log('[Cache Bust] Detected failed fetch, clearing cache and reloading...');
        // Clear all browser caches
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
              registration.unregister();
            }
          });
        }
        // Force hard reload
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <GoogleAnalytics />
      <SessionProvider session={session}>
        <AdCreationProvider>
          <AppContent Component={Component} pageProps={pageProps} />
          <Toaster />
        </AdCreationProvider>
      </SessionProvider>
    </>
  )
} 