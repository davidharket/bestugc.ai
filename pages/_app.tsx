import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { AdCreationProvider } from '../components/AdCreationContext'
import { Layout } from '../components/Layout'
import { Toaster } from 'react-hot-toast'
import { useVisitorTracking } from '../lib/useVisitorTracking'
import GoogleAnalytics from '../components/GoogleAnalytics'

function AppContent({ Component, pageProps }: { Component: any, pageProps: any }) {
  // Initialize visitor tracking
  useVisitorTracking();

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