// pages/ad/render.tsx
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
import axios from 'axios';

export default function RenderAd() {
  const router = useRouter();
  const { adData, resetAdData } = useAdCreation();
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleRender = async () => {
    setRendering(true);
    setSaveError(null);
    try {
      // The adData contains everything needed for the dynamic template generator on the backend.
      await axios.post('/api/render/start-job', {
        adData: { ...adData, templateId: 1 }, // templateId is a remnant but can be used if you add more dynamic generators.
      });
      setMessage("Great! Your video is being created. You'll see it on your dashboard shortly.");
      setTimeout(() => {
        resetAdData(); // Clear the context after the job is successfully submitted
        router.push('/dashboard');
      }, 3000);
    } catch (e: any) {
      console.error('Error starting render job:', e);
      setSaveError(e.response?.data?.error || 'Failed to start render job.');
      setRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-4">Ready to Generate Your Video?</h1>
        <p className="text-gray-600 mb-8">
          You've provided all the necessary details. Click the button below to start the rendering process. Your final video will appear on your dashboard once it's complete.
        </p>

        {saveError && <div className="mb-4 text-red-600 p-4 bg-red-50 rounded-lg">{saveError}</div>}
        {message && <div className="mb-4 text-green-600 p-4 bg-green-50 rounded-lg">{message}</div>}

        <div className="flex justify-center gap-4 mt-6">
          <button
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 disabled:opacity-50"
            onClick={handleRender}
            disabled={rendering || !!message}
          >
            {rendering ? 'Queuing...' : 'Generate Video'}
          </button>
          <button
            className="px-6 py-3 border rounded-lg hover:bg-gray-100 transition"
            onClick={() => router.back()}
            disabled={rendering}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// We need to import toast from react-hot-toast at the top
// import toast from 'react-hot-toast';