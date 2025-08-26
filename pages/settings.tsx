import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import BarLoader from '../components/BarLoader';

// Custom hook for profile operations
const useProfile = () => {
  const { data: session, update } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const updateProfile = async (name: string, email: string) => {
    setIsUpdating(true);
    setMessage('');

    try {
      await axios.put('/api/user/update-profile', { name, email });
      await update(); // Refresh the session
      setMessage('Profile updated successfully!');
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    setIsUpdating(true);
    try {
      await axios.delete('/api/user/delete-account');
      toast.success('Account deleted successfully. You will be redirected.');
      signOut({ callbackUrl: '/' });
    } catch (error: any) {
      console.error('Account deletion error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to delete account';
      setMessage(errorMsg);
      toast.error(errorMsg);
      setIsUpdating(false);
    }
  };

  return { updateProfile, deleteAccount, isUpdating, message };
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { updateProfile, deleteAccount, isUpdating, message } = useProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchBillingHistory = async () => {
      if (status === 'authenticated') {
        setLoadingBilling(true);
        try {
          const response = await axios.get('/api/user/billing-history');
          setBillingHistory(response.data || []);
        } catch (error: any) {
          console.error('Error fetching billing history:', error);
          // Don't show error for billing history if endpoint doesn't exist yet
        } finally {
          setLoadingBilling(false);
        }
      }
    };

    fetchBillingHistory();
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BarLoader size="lg" />
      </div>
    );
  }

  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfile(name, email);
  };

  interface UserSession extends NonNullable<typeof session.user> {
    plan?: string;
    credits?: number;
  }
  const user = session.user as UserSession;

  return (
    <>
      <Head>
        <title>Account Settings - Best UGC</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
              <p className="text-gray-400">Manage your account information and preferences</p>
            </div>
            <Link
              href="/dashboard"
              className="btn-primary"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Account Overview */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Account Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⭐</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Credits Balance</p>
                  <p className="text-2xl font-bold text-white">{user.credits ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Current Plan</p>
                  <p className="text-xl font-bold text-white">{user.plan || 'Free'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">👤</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Type</p>
                  <p className="text-xl font-bold text-white">Personal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes('successfully') 
                ? 'bg-green-900/20 border border-green-800 text-green-400' 
                : 'bg-red-900/20 border border-red-800 text-red-400'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className={`btn-primary ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating ? (
                <>
                  <BarLoader size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Billing History */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Billing History</h2>
            <Link href="/subscription" className="text-orange-400 hover:text-orange-300 text-sm font-medium">
              Manage Subscription
            </Link>
          </div>

          {loadingBilling ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="text-4xl mb-3 block">💳</span>
              <p className="text-sm">No billing history found.</p>
              <p className="text-xs">Your payment history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((transaction, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-gray-400 text-sm">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${transaction.amount}</p>
                    <p className={`text-xs ${
                      transaction.status === 'completed' ? 'text-green-400' : 
                      transaction.status === 'pending' ? 'text-orange-400' : 
                      'text-red-400'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Security */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Account Security</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">OAuth Authentication</h3>
                <p className="text-gray-400 text-sm">Your account is secured with Google OAuth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/subscription" className="card-interactive">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Manage Subscription</h3>
                <p className="text-gray-400 text-sm">Update billing and subscription settings</p>
              </div>
            </div>
          </Link>

          <Link href="/help" className="card-interactive">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Help & Support</h3>
                <p className="text-gray-400 text-sm">Get help and view documentation</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-800">
          <h2 className="text-xl font-semibold text-white mb-4">Danger Zone</h2>
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
            <p className="text-red-300 text-sm mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={deleteAccount}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}