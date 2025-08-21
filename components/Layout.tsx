// components/Layout.tsx
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CreditsPopup } from './CreditsPopup';
import { useRefreshableSession } from '../lib/session-refresh';
import { useAffiliateTracking } from '../lib/affiliate-middleware';
import { useAffiliateAttribution } from '../hooks/useAffiliateAttribution';

export const Layout = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  // Use basic session on dashboard, refreshable session elsewhere
  const basicSession = useSession();
  const refreshableSession = useRefreshableSession();
  
  // Track affiliate clicks and attribution
  useAffiliateTracking();
  useAffiliateAttribution();
  
  // Use refreshable session for all pages now
  const { data: session, status } = refreshableSession;
  const refreshUserData = refreshableSession.refreshUserData;
  const isRefreshing = refreshableSession.isRefreshing;
  const triggerFrequentPolling = refreshableSession.triggerFrequentPolling;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditsPopupOpen, setCreditsPopupOpen] = useState(false);
  const [freshCredits, setFreshCredits] = useState<number | null>(null);
  const [freshPlan, setFreshPlan] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showExtendedLoader, setShowExtendedLoader] = useState(false);

  // Listen for global session refresh events - optimized for better performance
  useEffect(() => {
    const handleSessionRefresh = () => {
      // Debounce refresh calls to prevent excessive API requests
      if (!isRefreshing) {
        refreshUserData();
      }
    };

    const handleTriggerFrequentPolling = () => {
      triggerFrequentPolling();
    };

    const handleCreditsUpdated = (event: CustomEvent) => {
      setFreshCredits(event.detail.credits);
      setFreshPlan(event.detail.plan);
    };

    window.addEventListener('session-refresh', handleSessionRefresh);
    window.addEventListener('trigger-frequent-polling', handleTriggerFrequentPolling);
    window.addEventListener('credits-updated', handleCreditsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('session-refresh', handleSessionRefresh);
      window.removeEventListener('trigger-frequent-polling', handleTriggerFrequentPolling);
      window.removeEventListener('credits-updated', handleCreditsUpdated as EventListener);
    };
  }, [refreshUserData, triggerFrequentPolling, isRefreshing]); // Added isRefreshing to dependencies

  // Handle router changes - simplified to prevent tab switching issues
  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      // Only show loader for actual navigation, not tab switching
      if (document.hidden) return; // Don't trigger on hidden tab
      
      const currentPath = router.asPath;
      const isActualRouteChange = url !== currentPath;
      
      // Only show loader for completely different routes, not query changes
      const isDifferentPage = (() => {
        const currentBase = currentPath.split('?')[0];
        const newBase = url.split('?')[0];
        return currentBase !== newBase;
      })();
      
      // Very conservative loader - only for different pages
      if (isActualRouteChange && isDifferentPage) {
        setIsTransitioning(true);
        setShowExtendedLoader(true);
      }
    };

    const handleRouteChangeComplete = () => {
      // Always clear loaders quickly
      setIsTransitioning(false);
      setShowExtendedLoader(false);
    };

    const handleRouteChangeError = () => {
      setIsTransitioning(false);
      setShowExtendedLoader(false);
    };

    // Clear loaders immediately when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTransitioning(false);
        setShowExtendedLoader(false);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router.asPath]); // Only depend on actual path, not showExtendedLoader

  interface UserSession {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
    credits?: number;
  }
  const baseUser = session?.user as UserSession;
  
  // Use fresh data if available, otherwise fall back to session data
  const user = {
    ...baseUser,
    credits: freshCredits !== null ? freshCredits : (baseUser?.credits ?? 0),
    plan: freshPlan !== null ? freshPlan : (baseUser?.plan || 'FREE')
  };

  // Show fullscreen loading when session is loading or during transitions
  if (status === 'loading' || showExtendedLoader) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin border-4 border-orange-500 border-t-transparent rounded-full w-12 h-12"></div>
          {showExtendedLoader && (
            <div className="text-gray-400 text-sm animate-pulse">
              {isTransitioning ? 'Loading...' : 'Preparing dashboard...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Navigation Bar */}
      <header className="fixed top-6 left-14 right-14 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <nav className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-2xl px-6 py-3">
            <div className="flex items-center justify-between h-15">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-semibold text-white font-poppins">Best UGC</span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {session ? (
                    /* Authenticated user navigation */
                    <>
                      <Link href="/dashboard" className={`${router.pathname === '/dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-sm font-normal transition-all duration-200`}>
                        Dashboard
                      </Link>
                      <Link href="/creations" className={`${router.pathname === '/creations' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-sm font-normal transition-all duration-200`}>
                        Creations
                      </Link>
                      <Link href="/subscription" className={`${router.pathname === '/subscription' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-sm font-normal transition-all duration-200`}>
                        Account
                      </Link>
                      <Link href="/affiliate-dashboard" className={`${router.pathname === '/affiliate-dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-sm font-normal transition-all duration-200`}>
                        Affiliate
                      </Link>
                    </>
                  ) : (
                    /* Unauthenticated user navigation */
                    <>
                      <Link href="/#features" className="text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-sm font-normal transition-all duration-200">
                        Features
                      </Link>
                      <Link href="/affiliate" className="text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-sm font-normal transition-all duration-200">
                        Affiliate
                      </Link>
                      <Link href="/pricing" className="text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-sm font-normal transition-all duration-200">
                        Pricing
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <div className="flex items-center gap-4">
                  {/* Credits Display */}
                  <div className="flex items-center justify-between bg-black border border-gray-700 rounded-[15px] px-4 py-2 min-w-fit">
                    <div className="flex items-center gap-2">
                      <img src="/credits.svg" alt="Credits" className="w-5 h-5" />
                      <span className="text-white font-normal">{user.credits ?? 0}</span>
                    </div>
                    <button
                      onClick={() => setCreditsPopupOpen(true)}
                      className="text-orange-400 hover:text-orange-300 text-lg font-normal transition-colors ml-3"
                      title="Buy more credits"
                    >
                      +
                    </button>
                  </div>


                  {/* Create Button */}
                  <Link href="/dashboard" className="btn-primary px-6 py-3 text-sm flex items-center gap-2 rounded-[15px]">
                    <img src="/ai-star.svg" alt="AI" className="w-4 h-4" />
                    Create
                  </Link>

                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => signIn()} className="btn-secondary px-10 py-3 text-sm">
                    Login
                  </button>
                  <button onClick={() => signIn()} className="btn-primary px-6 py-3 text-sm">
                    Get started
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white p-2 rounded-md"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-800">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {session ? (
                  /* Authenticated user mobile menu */
                  <>
                    <Link href="/dashboard" className={`block ${router.pathname === '/dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-base font-normal`}>
                      Dashboard
                    </Link>
                    <Link href="/creations" className={`block ${router.pathname === '/creations' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-base font-normal`}>
                      My Creations
                    </Link>
                    <Link href="/subscription" className={`block ${router.pathname === '/subscription' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-base font-normal`}>
                      Account
                    </Link>
                    <Link href="/affiliate-dashboard" className={`block ${router.pathname === '/affiliate-dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 '} px-3 py-2 rounded-md text-base font-normal`}>
                      Affiliate
                    </Link>
                    <button onClick={() => signOut()} className="block w-full text-left text-gray-300 hover:text-red-400  px-3 py-2 rounded-md text-base font-normal">
                      Sign Out
                    </button>
                  </>
                ) : (
                  /* Unauthenticated user mobile menu */
                  <>
                    <Link href="/#features" className="block text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-base font-normal">
                      Features
                    </Link>
                    <Link href="/affiliate" className="block text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-base font-normal">
                      Affiliate
                    </Link>
                    <Link href="/pricing" className="block text-gray-300 hover:text-orange-400  px-3 py-2 rounded-md text-base font-normal">
                      Pricing
                    </Link>
                    <button onClick={() => signIn()} className="btn-secondary w-full text-base">
                      Login
                    </button>
                    <button onClick={() => signIn()} className="btn-primary w-full text-base">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-3">
              <div className="flex items-center mb-4">
                <span className="text-xl font-semibold text-white font-poppins">Best UGC</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Create high-converting AI video ads in minutes. Transform your product links into 
                professional UGC content that drives real results.
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <img key={i} src="/star.svg" alt="Star" className="w-4 h-4" />
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">How It Works</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/image-ads" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Image Ads</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Help Center</Link></li>
                <li><a href="mailto:david@drift.as" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Contact</a></li>
                <li><Link href="/settings" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Account</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Terms</Link></li>
                <li><Link href="/affiliate" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Affiliate</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Best UGC. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Credits Popup */}
      <CreditsPopup 
        isOpen={creditsPopupOpen} 
        onClose={() => setCreditsPopupOpen(false)}
        currentCredits={user?.credits ?? 0}
      />
    </div>
  );
};
