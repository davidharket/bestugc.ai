import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { AdCreationProvider } from '../components/AdCreationContext'
import { Toaster } from 'react-hot-toast'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AdCreationProvider>
        <Component {...pageProps} />
        <Toaster />
      </AdCreationProvider>
    </SessionProvider>
  )
} 