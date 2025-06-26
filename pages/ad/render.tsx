import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react'; // <-- Import useSession

export default function RenderAdPage() {
  const router = useRouter();
  const { data: session } = useSession(); // <-- Get the user's session
  const { adData, resetAdData } = useAdCreation();
  const [isRendering, setIsRendering] = useState(false);

  const handleRender = async () => {
    setIsRendering(true);
    const toastId = toast.loading('Saving your ad configuration...');

    // Authentication Check
    if (!session?.user?.id) {
      toast.error('You must be logged in to create an ad.', { id: toastId });
      setIsRendering(false);
      return;
    }

    if (!adData.templateId) {
      toast.error('No template selected. Please go back and choose a template.', { id: toastId });
      setIsRendering(false);
      return;
    }

    try {
      // Step 1: Create the Ad record in the database.
      const createAdResponse = await axios.post('/api/ads/create', { adData });
      const { adId } = createAdResponse.data;

      toast.loading('Ad saved. Starting render job...', { id: toastId });

      // Step 2: Trigger the Inngest job with the new adId and templateId.
      await axios.post('/api/render/start-job', {
        adId: adId,
        templateId: adData.templateId,
      });

      toast.success('Your video is in the queue! Redirecting to your creations.', {
        id: toastId,
        duration: 4000,
      });

      setTimeout(() => {
        resetAdData();
        router.push('/creations');
      }, 2000);

    } catch (e: any) {
      console.error('Error starting render job:', e.response?.data || e.message);
      const errorMessage = e.response?.data?.message || 'Failed to start the render job.';
      toast.error(errorMessage, { id: toastId });
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Ready to Generate Your Video?</h1>
          <p className="text-gray-400">
            You've provided all the necessary details. Click the button below to start the rendering process.
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Video Summary</h2>
          <div className="space-y-4">
            {adData.brandName && (
              <div className="flex justify-between">
                <span className="text-gray-400">Brand:</span>
                <span className="text-white font-medium">{adData.brandName}</span>
              </div>
            )}
            {adData.format && (
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white font-medium">{adData.format}</span>
              </div>
            )}
            {adData.language && (
              <div className="flex justify-between">
                <span className="text-gray-400">Language:</span>
                <span className="text-white font-medium">{adData.language.toUpperCase()}</span>
              </div>
            )}
            {adData.templateId && (
              <div className="flex justify-between">
                <span className="text-gray-400">Template:</span>
                <span className="text-white font-medium">{adData.templateId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Generate Your Video</h3>
            <p className="text-gray-400">
              Your final video will appear on the 'My Creations' page once rendering is complete. 
              This typically takes 2-5 minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              className={`w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${isRendering ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleRender}
              disabled={isRendering}
            >
              {isRendering ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Generate Video
                </>
              )}
            </button>
            
            <button
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-800 text-white font-medium rounded-xl border border-gray-700 hover:bg-gray-700 transition-all"
              onClick={() => router.back()}
              disabled={isRendering}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}