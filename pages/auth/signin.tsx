import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

// Import icons for social logins - using placeholders for now
// You would typically use an icon library like react-icons
const GoogleIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">G</span>;
const GithubIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">GH</span>;
const AppleIcon = () => <span className="w-6 h-6 flex items-center justify-center border rounded-full mr-3 text-sm">A</span>;

interface SignInPageProps {
  providers: Record<string, ClientSafeProvider> | null;
}

export default function SignInPage({ providers }: SignInPageProps) {
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
          <div className="mt-8 space-y-4">
            {providers && Object.values(providers).map((provider) => {
              const display = providerDisplay[provider.id.toLowerCase()];
              if (!display) return null; // Skip if no display config for this provider

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
    props: { providers },
  };
} 