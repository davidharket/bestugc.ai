// pages/ad/script.tsx
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSession, signIn } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { useAdCreation } from '../../components/AdCreationContext';
import toast from 'react-hot-toast';
import BarLoader from '../../components/BarLoader';

const scriptTypes = [
  { key: 'cta', label: 'Call to Action' },
  { key: 'lifestyle', label: 'Product Lifestyle' },
  { key: 'brand', label: 'Brand Story' },
  { key: 'trending', label: 'Trending Style' },
  { key: 'custom', label: 'Custom Appeal' },
];

export default function ScriptAdPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { adData, setAdData } = useAdCreation();

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (status === 'unauthenticated') {
      signIn()
      return
    }
  }, [status])

  // Show loading while authenticating
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BarLoader size="lg" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null
  }
  
  // Initialize state from context or set defaults
  const [scripts, setScripts] = useState(adData.scripts || {});
  const [selectedScript, setSelectedScript] = useState(adData.script || '');
  const [loading, setLoading] = useState(false);
  
  // Track if we're already fetching to prevent duplicate requests
  const fetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
  // Persistent flag to track if scripts have been generated for this session
  const scriptsGeneratedRef = useRef(Object.keys(adData.scripts || {}).length > 0);

  // Sync state with context when context updates (but don't trigger regeneration)
  useEffect(() => {
    if (adData.scripts && Object.keys(adData.scripts).length > 0) {
      setScripts(adData.scripts);
      scriptsGeneratedRef.current = true;
      hasInitializedRef.current = true;
    }
    if (adData.script) {
      setSelectedScript(adData.script);
    }
  }, [adData.scripts, adData.script]);

  // Fetch scripts only if they don't already exist in the context
  useEffect(() => {
    const fetchScripts = async () => {
      // Prevent duplicate requests
      if (fetchingRef.current) return;
      if (scriptsGeneratedRef.current) return; // Don't re-fetch if scripts have been generated
      if (hasInitializedRef.current && Object.keys(scripts).length > 0) return; // Don't re-fetch existing scripts
      if (!adData.summary) return; // Don't fetch if no product summary

      fetchingRef.current = true;
      setLoading(true);
      try {
        const response = await axios.post('/api/generate-script', {
          summary: adData.summary,
          productName: adData.brandName,
          language: adData.language,
          isAiGenerated: true,
        });
        const generatedScripts = response.data.scripts || {};
        setScripts(generatedScripts);
        // Set the first generated script as the initial selection
        const firstScript = Object.values(generatedScripts)[0] as string || '';
        setSelectedScript(firstScript);
        setAdData({ scripts: generatedScripts, script: firstScript });
        hasInitializedRef.current = true;
        scriptsGeneratedRef.current = true;
      } catch (err: any) {
        if (err.response?.status === 429) {
          const rateLimitInfo = err.response?.data?.rateLimitInfo;
          const resetTime = rateLimitInfo?.resetTime ? new Date(rateLimitInfo.resetTime) : null;
          const resetTimeString = resetTime ? resetTime.toLocaleTimeString() : 'later';
          toast.error(
            `Rate limit exceeded. You can generate more scripts after ${resetTimeString}.`,
            { duration: 8000 }
          );
        } else {
          toast.error(err.response?.data?.error || 'Failed to generate scripts.');
        }
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchScripts();
  }, [adData.summary, adData.brandName, adData.language]);

  const handleRegenerateScripts = async () => {
    // Temporarily reset flags to allow regeneration
    fetchingRef.current = true;
    setLoading(true);
    try {
      const response = await axios.post('/api/generate-script', {
        summary: adData.summary,
        productName: adData.brandName,
        language: adData.language,
        isAiGenerated: true,
      });
      const generatedScripts = response.data.scripts || {};
      setScripts(generatedScripts);
      // Set the first generated script as the initial selection
      const firstScript = Object.values(generatedScripts)[0] as string || '';
      setSelectedScript(firstScript);
      setAdData({ scripts: generatedScripts, script: firstScript });
      toast.success('New scripts generated!');
    } catch (err: any) {
      if (err.response?.status === 429) {
        const rateLimitInfo = err.response?.data?.rateLimitInfo;
        const resetTime = rateLimitInfo?.resetTime ? new Date(rateLimitInfo.resetTime) : null;
        const resetTimeString = resetTime ? resetTime.toLocaleTimeString() : 'later';
        toast.error(
          `Rate limit exceeded. You can generate more scripts after ${resetTimeString}.`,
          { duration: 8000 }
        );
      } else {
        toast.error(err.response?.data?.error || 'Failed to regenerate scripts.');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleNext = () => {
    // Ensure the final selected script is saved to context before proceeding
    setAdData({ script: selectedScript });
    router.push('/ad/avatar'); // The flow goes to avatar selection next
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Choose a Script</h1>
          <p className="text-sm sm:text-base text-gray-400">Select a script for your ad, or edit it below</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card mb-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <BarLoader size="xl" />
                </div>
                <div className="text-center">
                  <span className="text-orange-400 text-lg font-medium">Generating script variations...</span>
                  <p className="text-gray-400 text-sm mt-1">Creating personalized scripts for your product</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Script Selection */}
        {!loading && Object.keys(scripts).length > 0 && (
          <div className="card mb-8">
            {/* Script Type Tabs */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Generated Scripts</h2>
                <button
                  onClick={handleRegenerateScripts}
                  disabled={loading}
                  className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-6">
                {Object.keys(scripts).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedScript(scripts[key])}
                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-600 rounded-[10px] text-gray-300 transition-colors duration-200 ${
                      selectedScript === scripts[key]
                        ? 'border-orange-500'
                        : 'hover:border-orange-500'
                    }`}
                    style={{ backgroundColor: '#111827' }}
                  >
                    {scriptTypes.find(t => t.key === key)?.label || 'Generated'}
                  </button>
                ))}
              </div>
            </div>

            {/* Script Editor */}
            <div>
              <label className="block text-gray-300 font-normal mb-3">
                Selected Script 
                <span className="text-gray-500 text-sm font-normal ml-2">
                  (Feel free to edit and customize)
                </span>
              </label>
              <textarea
                className="input w-full"
                rows={12}
                value={selectedScript}
                onChange={(e) => setSelectedScript(e.target.value)}
                placeholder="Your ad script will appear here..."
                maxLength={400}
              />
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1 sm:gap-0">
                <p className="text-gray-500 text-xs sm:text-sm">
                  This script will be used for the video narration. You can edit it to better fit your needs.
                </p>
                <span className="text-gray-500 text-xs sm:text-sm">{selectedScript.length}/600</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && Object.keys(scripts).length === 0 && (
          <div className="card mb-8 rounded rounded-[15px]">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.044-5.709-2.709M15 17h3a2 2 0 002-2V9a2 2 0 00-2-2h-3m-6 8H6a2 2 0 01-2-2V9a2 2 0 012-2h3m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 7h6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Scripts Available</h3>
              <p className="text-gray-400 mb-4">
                We'll generate scripts based on your product information from the previous steps.
              </p>
              <button
                onClick={handleRegenerateScripts}
                disabled={loading}
                className="btn-primary"
              >
                Generate Scripts
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            className="btn-secondary w-full sm:w-auto order-2 sm:order-1"
            onClick={() => router.back()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            className={`btn-primary w-full sm:w-auto order-1 sm:order-2 ${!selectedScript || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={!selectedScript || loading}
          >
            <span className="hidden sm:inline">Continue to Avatar Selection</span>
            <span className="sm:hidden">Continue</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Server-side authentication check
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=' + encodeURIComponent('/ad/script'),
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
};
