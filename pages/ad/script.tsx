// pages/ad/script.tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdCreation } from '../../components/AdCreationContext';
import toast from 'react-hot-toast';

const scriptTypes = [
  { key: 'cta', label: 'Call to Action' },
  { key: 'lifestyle', label: 'Product Lifestyle' },
  { key: 'brand', label: 'Brand Story' },
];

export default function ScriptAdPage() {
  const router = useRouter();
  const { adData, setAdData } = useAdCreation();
  
  // Initialize state from context or set defaults
  const [scripts, setScripts] = useState(adData.scripts || {});
  const [selectedScript, setSelectedScript] = useState(adData.script || '');
  const [loading, setLoading] = useState(false);

  // Fetch scripts only if they don't already exist in the context
  useEffect(() => {
    const fetchScripts = async () => {
      if (Object.keys(scripts).length > 0) return; // Don't re-fetch
      if (!adData.summary) return; // Don't fetch if no product summary

      setLoading(true);
      const toastId = toast.loading('Generating script variations...');
      try {
        const response = await axios.post('/api/generate-script', {
          summary: adData.summary,
          productName: adData.brandName,
          language: adData.language,
        });
        const generatedScripts = response.data.scripts || {};
        setScripts(generatedScripts);
        // Set the first generated script as the initial selection
        const firstScript = Object.values(generatedScripts)[0] as string || '';
        setSelectedScript(firstScript);
        setAdData({ scripts: generatedScripts, script: firstScript });
        toast.success('Scripts generated!', { id: toastId });
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to generate scripts.', { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchScripts();
  }, [adData.summary, adData.brandName, adData.language, setAdData]);

  const handleRegenerateScripts = async () => {
    setLoading(true);
    const toastId = toast.loading('Regenerating scripts...');
    try {
      const response = await axios.post('/api/generate-script', {
        summary: adData.summary,
        productName: adData.brandName,
        language: adData.language,
      });
      const generatedScripts = response.data.scripts || {};
      setScripts(generatedScripts);
      // Set the first generated script as the initial selection
      const firstScript = Object.values(generatedScripts)[0] as string || '';
      setSelectedScript(firstScript);
      setAdData({ scripts: generatedScripts, script: firstScript });
      toast.success('New scripts generated!', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to regenerate scripts.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Ensure the final selected script is saved to context before proceeding
    setAdData({ script: selectedScript });
    router.push('/ad/avatar'); // The flow goes to avatar selection next
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose a Script - Step 3</h1>
          <p className="text-gray-400">Select a script for your ad, or edit it below</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="card mb-8">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-orange-500"></div>
                <span className="text-orange-400 text-lg">Generating script variations...</span>
              </div>
            </div>
          </div>
        )}

        {/* Script Selection */}
        {!loading && Object.keys(scripts).length > 0 && (
          <div className="card mb-8">
            {/* Script Type Tabs */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Generated Scripts</h2>
                <button
                  onClick={handleRegenerateScripts}
                  disabled={loading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                {Object.keys(scripts).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedScript(scripts[key])}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedScript === scripts[key]
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                    }`}
                  >
                    {scriptTypes.find(t => t.key === key)?.label || 'Generated'}
                  </button>
                ))}
              </div>
            </div>

            {/* Script Editor */}
            <div>
              <label className="block text-gray-300 font-medium mb-3">
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
              />
              <p className="text-gray-500 text-sm mt-2">
                This script will be used for the video narration. You can edit it to better fit your needs.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && Object.keys(scripts).length === 0 && (
          <div className="card mb-8">
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
        <div className="flex justify-between">
          <button
            className="btn-secondary"
            onClick={() => router.back()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            className={`btn-primary ${!selectedScript || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={!selectedScript || loading}
          >
            Continue to Avatar Selection
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}