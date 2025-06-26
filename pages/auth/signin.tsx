// pages/auth/signin.tsx
import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.331,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const GithubIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
  </svg>
);

const AppleIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M15.5 1.25c-1.061 0-1.95.684-2.427 1.592C12.636 2.313 12.16 2 11.625 2c-1.061 0-1.95.684-2.427 1.592-.437-.529-.915-.842-1.45-.842-1.061 0-1.95.684-2.427 1.592-.437-.529-.915-.842-1.45-.842C2.81 3.5 2 4.31 2 5.375c0 1.061.81 1.875 1.875 1.875.535 0 1.013-.313 1.45-.842.477.908 1.366 1.592 2.427 1.592.535 0 1.013-.313 1.45-.842.477.908 1.366 1.592 2.427 1.592.535 0 1.013-.313 1.45-.842.477.908 1.366 1.592 2.427 1.592C16.69 8.25 17.5 7.44 17.5 6.375S16.69 4.5 15.625 4.5c-.535 0-1.013.313-1.45.842-.477-.908-1.366-1.592-2.427-1.592zm-4.875 10.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
  </svg>
);

interface SignInPageProps {
  providers: Record<string, ClientSafeProvider> | null;
  csrfToken?: string;
}

export default function SignInPage({ providers, csrfToken }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingEmail(true);
    try {
      await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
    } catch (error) {
      console.error("Email sign-in error", error);
      setIsLoadingEmail(false);
    }
  };

  const handleProviderSignIn = async (providerId: string) => {
    setLoadingProvider(providerId);
    try {
      await signIn(providerId, { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error(`${providerId} sign-in error`, error);
      setLoadingProvider(null);
    }
  };

  const providerDisplay: Record<string, { icon: JSX.Element, name: string, style: string }> = {
    google: {
      icon: <GoogleIcon />,
      name: "Google",
      style: "bg-white hover:bg-gray-100 border-gray-300 text-gray-900 shadow-md hover:shadow-lg"
    },
    github: {
      icon: <GithubIcon />,
      name: "GitHub",
      style: "bg-gray-800 hover:bg-gray-900 text-white shadow-md hover:shadow-lg"
    },
    apple: {
      icon: <AppleIcon />,
      name: "Apple",
      style: "bg-black hover:bg-gray-900 text-white shadow-md hover:shadow-lg border border-gray-800"
    },
  };

  // Filter out the Email provider from the list of OAuth providers to render separately
  const oauthProviders = providers && Object.values(providers).filter(p => p.id !== 'email');

  return (
    <>
      <Head>
        <title>Sign In - Ageco.ai</title>
        <meta name="description" content="Sign in to create AI-powered video ads that convert" />
      </Head>
      
      <div className="min-h-screen bg-black flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-white/10 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
          
          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-2xl">A</span>
                </div>
                <span className="text-3xl font-bold">Ageco.ai</span>
              </div>
              
              <h1 className="text-5xl font-extrabold leading-tight mb-6">
                Create viral video ads with AI
              </h1>
              
              <p className="text-xl text-orange-100 leading-relaxed mb-8">
                Transform your product links into high-converting video ads in minutes. 
                No expensive creators, no production teams—just results.
              </p>
            </div>

            {/* Social Proof */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['👩‍💼', '👨‍💻', '👩‍🚀', '👨‍🎨', '👩‍🔬'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30">
                      <span className="text-lg">{emoji}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-300 text-lg">⭐</span>
                    ))}
                  </div>
                  <p className="text-orange-100 text-sm">Loved by 1000+ businesses</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-orange-100 text-sm">Videos Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">90%</div>
                  <div className="text-orange-100 text-sm">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">340%</div>
                  <div className="text-orange-100 text-sm">ROAS Boost</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white">Ageco.ai</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Welcome back
              </h2>
              <p className="text-gray-400">
                Sign in to start creating AI video ads
              </p>
            </div>

            {/* Email Sign-in Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-6 mb-6">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoadingEmail}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoadingEmail}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:transform-none"
              >
                {isLoadingEmail ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending magic link...</span>
                  </>
                ) : (
                  <>
                    <EmailIcon />
                    <span>Continue with Email</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            {oauthProviders && oauthProviders.length > 0 && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-black text-gray-400">Or continue with</span>
                </div>
              </div>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              {oauthProviders && oauthProviders.map((provider) => {
                const display = providerDisplay[provider.id.toLowerCase()];
                if (!display) return null;

                return (
                  <button
                    key={provider.name}
                    onClick={() => handleProviderSignIn(provider.id)}
                    disabled={loadingProvider === provider.id}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-800 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 ${display.style}`}
                  >
                    {loadingProvider === provider.id ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        {display.icon}
                        <span>Continue with {display.name}</span>
                      </>
                    )}
                  </button>
                );
              })}
              
              {!providers && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">Loading sign-in options...</p>
                </div>
              )}
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-orange-400 hover:text-orange-300 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-400 hover:text-orange-300 underline">
                  Privacy Policy
                </Link>
              </p>
              
              <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                <span>New to Ageco.ai?</span>
                <Link href="/" className="text-orange-400 hover:text-orange-300 font-medium">
                  Learn more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const providers = await getProviders();
  return {
    props: { 
      providers, 
    },
  };
}