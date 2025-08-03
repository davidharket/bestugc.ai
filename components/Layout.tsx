// components/Layout.tsx
import Link from 'next/link';
import { signIn, signOut } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CreditsPopup } from './CreditsPopup';
import { useRefreshableSession } from '../lib/session-refresh';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { data: session, status, refreshUserData, isRefreshing } = useRefreshableSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditsPopupOpen, setCreditsPopupOpen] = useState(false);

  // Listen for global session refresh events and route changes
  useEffect(() => {
    const handleSessionRefresh = () => {
      refreshUserData();
    };

    const handleRouteChange = (url: string) => {
      // Refresh credits when navigating to key pages where credits matter
      const creditPages = ['/dashboard', '/creations', '/subscription', '/settings'];
      if (creditPages.some(page => url.includes(page))) {
        refreshUserData();
      }
    };

    window.addEventListener('session-refresh', handleSessionRefresh);
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      window.removeEventListener('session-refresh', handleSessionRefresh);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [refreshUserData, router.events]);

  interface UserSession {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    plan?: string;
    credits?: number;
  }
  const user = session?.user as UserSession;

  // Show fullscreen loading when session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Navigation Bar */}
      <header className="bg-black/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-white">Best UGC</span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  {session ? (
                    /* Authenticated user navigation */
                    <>
                      <Link href="/dashboard" className={`${router.pathname === '/dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`}>
                        Dashboard
                      </Link>
                      <Link href="/creations" className={`${router.pathname === '/creations' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`}>
                        My Creations
                      </Link>
                      <Link href="/subscription" className={`${router.pathname === '/subscription' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`}>
                        Subscription
                      </Link>
                      <Link href="/settings" className={`${router.pathname === '/settings' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`}>
                        Settings
                      </Link>
                      <Link href="/help" className={`${router.pathname === '/help' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-sm font-medium transition-all duration-200`}>
                        Help
                      </Link>
                    </>
                  ) : (
                    /* Unauthenticated user navigation */
                    <>
                      <Link href="/about" className="text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                        How It Works
                      </Link>
                      <Link href="/pricing" className="text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                        Pricing
                      </Link>
                      <Link href="/image-ads" className="text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200">
                        Image Ads
                        <span className="ml-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Soon</span>
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
                  <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                    <span className="text-orange-400 text-sm">⭐</span>
                    <span className="text-white text-sm font-medium">{user.credits ?? 0}</span>
                    <button 
                      onClick={() => setCreditsPopupOpen(true)}
                      className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                      title="Top up credits"
                    >
                      +
                    </button>
                  </div>

                  {/* Plan Badge */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 rounded-lg">
                    <span className="text-white text-xs font-semibold">{user.plan || 'FREE'}</span>
                  </div>

                  {/* Create Video Button */}
                  <Link href="/ad/create" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                    Create Video
                  </Link>

                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 text-gray-300 hover:text-white p-2 rounded-md hover:bg-gray-900 transition-all duration-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name?.[0] || user.email?.[0] || 'U'}
                        </span>
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="py-1">
                        <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400">
                          Settings
                        </Link>
                        <Link href="/help" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400">
                          Help
                        </Link>
                        <hr className="my-1 border-gray-700" />
                        <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-red-400">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => signIn()} className="text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
                    Sign In
                  </button>
                  <button onClick={() => signIn()} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                    Get Started
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
                    <Link href="/dashboard" className={`block ${router.pathname === '/dashboard' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-base font-medium`}>
                      Dashboard
                    </Link>
                    <Link href="/creations" className={`block ${router.pathname === '/creations' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-base font-medium`}>
                      My Creations
                    </Link>
                    <Link href="/subscription" className={`block ${router.pathname === '/subscription' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-base font-medium`}>
                      Subscription
                    </Link>
                    <Link href="/settings" className={`block ${router.pathname === '/settings' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-base font-medium`}>
                      Settings
                    </Link>
                    <Link href="/help" className={`block ${router.pathname === '/help' ? 'text-orange-400 bg-gray-900' : 'text-gray-300 hover:text-orange-400 hover:bg-gray-900'} px-3 py-2 rounded-md text-base font-medium`}>
                      Help
                    </Link>
                    <button onClick={() => signOut()} className="block w-full text-left text-gray-300 hover:text-red-400 hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium">
                      Sign Out
                    </button>
                  </>
                ) : (
                  /* Unauthenticated user mobile menu */
                  <>
                    <Link href="/about" className="block text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium">
                      How It Works
                    </Link>
                    <Link href="/pricing" className="block text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium">
                      Pricing
                    </Link>
                    <Link href="/image-ads" className="block text-gray-300 hover:text-orange-400 hover:bg-gray-900 px-3 py-2 rounded-md text-base font-medium">
                      Image Ads
                    </Link>
                    <button onClick={() => signIn()} className="block w-full text-left bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2 rounded-md text-base font-medium">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Page Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-white">Best UGC</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Create high-converting AI video ads in minutes. Transform your product links into 
                professional UGC content that drives real results.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-orange-400 text-sm">⭐</span>
                  ))}
                  <span className="text-gray-400 text-sm ml-2">4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">How It Works</Link></li>
                <li><Link href="/pricing" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Pricing</Link></li>
                <li><Link href="/image-ads" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Image Ads</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Help Center</Link></li>
                <li><a href="mailto:david@drift.as" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Contact</a></li>
                <li><Link href="/settings" className="text-gray-300 hover:text-orange-400 text-sm transition-colors">Account</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Best UGC. All rights reserved.</p>
            <div className="flex items-center gap-6 mt-4 sm:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">Terms</Link>
            </div>
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