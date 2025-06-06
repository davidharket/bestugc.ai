import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useState } from 'react';

// Import icons for social logins - using placeholders for now
// You would typically use an icon library like react-icons
const GoogleIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">G</span>;
const GithubIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">GH</span>;
const AppleIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">A</span>;
const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2.5" viewBox="0 0 20 20" fill="currentColor">
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

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingEmail(true);
    try {
        // For EmailProvider, NextAuth handles the CSRF token implicitly if it's a GET request or
        // if you are using its built-in pages. For a custom UI and POST, explicitly passing it
        // isn't usually required for EmailProvider sign-in initiation, but doesn't hurt.
        // The main thing is the `email` field in the options.
      await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
      // If signIn with redirect: false is successful for EmailProvider, 
      // it will redirect to verifyRequest page by default, or you can handle it.
      // Since NextAuth 0.4.0+ `signIn` returns a promise that resolves to either
      // an error object if the sign-in fails, or undefined if it was successful (and a redirect is happening).
      // For email, it should redirect to verifyRequest page, or handle response if redirect is false.
      // For this setup, we expect NextAuth to handle the redirect to verifyRequest, so no explicit error handling here.
      // setIsLoadingEmail(false); // Usually not reached if redirect occurs
    } catch (error) {
      console.error("Email sign-in error", error);
      setIsLoadingEmail(false);
      // You might want to show an error to the user here
    }
  };

  const providerDisplay: Record<string, { icon: JSX.Element, name: string, style: string }> = {
    google: {
      icon: <GoogleIcon />,
      name: "Google",
      style: "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-sm hover:shadow-md"
    },
    github: {
      icon: <GithubIcon />,
      name: "GitHub",
      style: "bg-gray-800 hover:bg-gray-900 text-white shadow-sm hover:shadow-md"
    },
    apple: {
      icon: <AppleIcon />,
      name: "Apple",
      style: "bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md"
    },
    // Add other providers here if needed
  };

  // Filter out the Email provider from the list of OAuth providers to render separately
  const oauthProviders = providers && Object.values(providers).filter(p => p.id !== 'email');

  return (
    <>
      <Head>
        <title>Sign In - Ad Automation</title>
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-[20px] shadow-lg">
          <div>
            {/* You can place your logo here */}
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or create a new one to start generating ads
            </p>
          </div>

          {/* Email Sign-in Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-[10px] relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoadingEmail}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoadingEmail}
                className="group relative w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-[20px] text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out disabled:opacity-70"
              >
                {isLoadingEmail ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : <EmailIcon />}
                {isLoadingEmail ? 'Sending link...' : 'Sign in with Email'}
              </button>
            </div>
          </form>

          {oauthProviders && oauthProviders.length > 0 && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          )}

          {/* OAuth Providers */}
          <div className="space-y-4">
            {oauthProviders && oauthProviders.map((provider) => {
              const display = providerDisplay[provider.id.toLowerCase()];
              if (!display) return null;

              return (
                <div key={provider.name}>
                  <button
                    onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-[20px] transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${display.style}`}
                  >
                    {display.icon}
                    Sign in with {display.name}
                  </button>
                </div>
              );
            })}
            {!providers && (
                <p className="text-center text-sm text-gray-500">No sign-in methods configured. Please contact support.</p>
            )}
          </div>
        </div>
         <p className="mt-8 text-center text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const providers = await getProviders();
  // If a user is already logged in, redirect them to the dashboard
  // This requires access to the session object, which can be obtained using getSession from next-auth/react
  // For simplicity, this example doesn't implement server-side redirect if already logged in,
  // but it's a good practice to add it.
  return {
    props: { 
      providers, 
      // csrfToken: await csrfToken(context) // Generally not needed for EmailProvider initiation via signIn()
    },
  };
} 