// pages/auth/signin.tsx
import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.331,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

interface SignInPageProps {
  providers: Record<string, ClientSafeProvider> | null;
  csrfToken?: string;
}

export default function SignInPage({ providers, csrfToken }: SignInPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate password confirmation for signup
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Password strength validation for signup
    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // CAPTCHA validation for signup (only if CAPTCHA is enabled)
    const captchaEnabled = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (isSignUp && captchaEnabled && !captchaToken) {
      setError('Please complete the CAPTCHA verification');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        name: isSignUp ? name : undefined,
        captchaToken: isSignUp ? captchaToken : undefined,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin' ? 'Invalid credentials' : result.error);
      } else if (result?.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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

  // Only show Google provider
  const oauthProviders = providers && Object.values(providers).filter(p => p.id === 'google');

  return (
    <>
      <Head>
        <title>Sign In - Best UGC</title>
        <meta name="description" content="Sign in to create AI-powered video ads that convert" />
      </Head>
      
      <div className="bg-black text-white min-h-screen">
        {/* Hero Section with Sign In Form */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold leading-tight sm:leading-relaxed tracking-wide mb-6 sm:mb-8">
              {isSignUp ? 'Join ' : 'Let\'s create some '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                videos
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-white mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              {isSignUp 
                ? 'Create your account and start making AI video ads in minutes' 
                : 'Sign in to continue creating high-converting AI video ads'
              }
            </p>
          </div>

          {/* Sign In Form Card */}
          <div className="max-w-md mx-auto">
            <div className="rounded-[20px] border border-gray-700 p-6 sm:p-8" style={{ backgroundColor: '#111827' }}>
              
              {/* Google Sign In Button */}
              {oauthProviders && oauthProviders.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleProviderSignIn(provider.id)}
                  disabled={loadingProvider === provider.id}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-900 rounded-[20px] font-normal transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mb-6 disabled:opacity-50"
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
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              ))}

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-gray-400" style={{ backgroundColor: '#111827' }}>Or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required={isSignUp}
                      className="w-full bg-black border border-gray-700 rounded-[15px] px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full bg-black border border-gray-700 rounded-[15px] px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    className="w-full bg-black border border-gray-700 rounded-[15px] px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder={isSignUp ? "Create a password" : "Enter your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {isSignUp && (
                  <div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required={isSignUp}
                      className="w-full bg-black border border-gray-700 rounded-[15px] px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}

                {isSignUp && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                      theme="dark"
                    />
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-[15px] p-3">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary px-6 py-4 disabled:opacity-70 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  )}
                </button>
              </form>

              {/* Toggle Sign Up/Sign In */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setName('');
                    setPassword('');
                    setConfirmPassword('');
                    setCaptchaToken(null);
                    if (recaptchaRef.current) {
                      recaptchaRef.current.reset();
                    }
                  }}
                  className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              {/* Loading fallback */}
              {!providers && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">Loading sign-in options...</p>
                </div>
              )}
            </div>

            {/* Footer Text */}
            <div className="text-center mt-6 sm:mt-8 space-y-3 sm:space-y-4">
              <p className="text-xs text-gray-500 px-4">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-orange-400 hover:text-orange-300 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-orange-400 hover:text-orange-300 transition-colors">
                  Privacy Policy
                </Link>
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm text-gray-400">
                <span>New to Best UGC?</span>
                <Link href="/" className="text-orange-400 hover:text-orange-300 font-normal transition-colors">
                  Learn more
                </Link>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                <div className="flex -space-x-3 sm:-space-x-4">
                  <img src="/socialproof1.png" alt="User testimonial" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-black" />
                  <img src="/socialproof2.png" alt="User testimonial" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-black" />
                  <img src="/socialproof3.png" alt="User testimonial" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-black" />
                  <img src="/socialproof4.png" alt="User testimonial" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-black" />
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <img key={i} src="/star.svg" alt="Star rating" className="w-3 sm:w-4 h-3 sm:h-4" />
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs sm:text-sm">Loved by 100+ businesses</span>
                </div>
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
