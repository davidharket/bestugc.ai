import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

// A simple layout component (can be expanded or moved to _app.tsx for global layout)
const SettingsLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <>
      <Head>
        <title>{title} - Ad Automation Settings</title>
      </Head>
      <div className="min-h-screen bg-gray-100 font-sans">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-md">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default function GeneralSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await axios.post('/api/user/update-profile', {
        name: name,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Optimistically update session or refetch if backend doesn't return full user
      // Forcing a session update will refetch the session and include the new name
      await updateSession({ name });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      setIsLoading(true);
      await axios.post('/api/user/delete-account');
      signOut({ callbackUrl: '/' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete account.' });
      setIsLoading(false);
    }
  };

  if (status === 'loading' || !session?.user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">Loading...</div>;
  }

  return (
    <SettingsLayout title="General Settings">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Profile Information</h2>
      {message && (
        <div className={`mb-4 p-3 rounded-[10px] text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-[10px] shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-[10px] shadow-sm py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading || (session?.user?.name === name)}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-[20px] shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <hr className="my-8 border-gray-200" />

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Management</h2>
      <div>
        <h3 className="text-lg font-medium text-gray-800">Delete Account</h3>
        <p className="mt-1 text-sm text-gray-600 mb-3">
          Permanently delete your account and all associated data. This action is irreversible.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isLoading} // Prevent action while other profile updates might be loading
          className="w-auto px-4 py-2 border border-red-300 text-sm font-medium rounded-[20px] text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          Delete My Account
        </button>
      </div>
    </SettingsLayout>
  );
} 