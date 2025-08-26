import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAdCreation } from '../../components/AdCreationContext';
import Head from 'next/head';

interface TestData {
  productVideoUrl?: string;
  avatarId?: number;
  templateId?: string;
  script?: string;
  audioUrl?: string;
  audioDuration?: number;
  wordTimings?: Array<{ word: string; startTime: number; endTime: number; }>;
}

export default function TestRenderProductVideo() {
  const router = useRouter();
  const { adData, setAdData } = useAdCreation();
  const [testData, setTestData] = useState<TestData>({
    productVideoUrl: '',
    avatarId: 26, // Female Blonde (New) - has product capability
    templateId: 'minimalist-split',
    script: 'Check out this amazing product! It\'s perfect for your needs.',
    audioUrl: '',
    audioDuration: 5
  });

  // Sample product video URL (you can replace this with an actual generated video)
  const sampleProductVideoUrl = '/api/serve-video/temp/sample-product-video.mp4';
  
  // Sample audio URL (you can replace this with actual TTS audio)
  const sampleAudioUrl = '/api/serve-audio/temp/sample-audio.wav';

  const setupTestData = () => {
    const completeTestData = {
      ...adData,
      // Product video settings
      productVideoUrl: testData.productVideoUrl || sampleProductVideoUrl,
      productVideoData: {
        includeProductVideo: true,
        selectedImageId: 'test-image-id',
        productDescription: 'A premium product for testing',
        productImages: ['https://example.com/product.jpg'],
        avatarId: testData.avatarId
      },
      
      // Basic ad settings
      avatarId: testData.avatarId,
      templateId: testData.templateId,
      script: testData.script,
      selectedScript: testData.script,
      audioUrl: testData.audioUrl || sampleAudioUrl,
      audioDuration: testData.audioDuration,
      wordTimings: testData.wordTimings,
      
      // Required template settings
      format: '9:16',
      duration: 30,
      language: 'en',
      audience: 'General audience',
      enableSubtitles: true,
      subtitleStyle: 'modern-bold',
      subtitleAnimation: 'fade' as 'fade',
      subtitlePosition: 'bottom' as 'bottom',
      useCapsLock: false,
      oneWordAtATime: false,
      fontSize: 50,
      
      // Sample assets
      selectedImages: ['/test-images/sample1.jpg', '/test-images/sample2.jpg'],
      selectedVideos: [],
      selectedBRoll: [],
      orderedImages: [
        { url: '/test-images/sample1.jpg', order: 0 },
        { url: '/test-images/sample2.jpg', order: 1 }
      ],
      orderedVideos: [],
      orderedBRoll: [],
      
      // Brand info
      brandName: 'Test Brand',
      summary: 'Testing product video render functionality',
      showPromo: false
    };

    setAdData(completeTestData);
    console.log('Test data set up:', completeTestData);
  };

  const navigateToRender = () => {
    // Set flag to indicate that we should generate preview on render page
    sessionStorage.setItem('shouldGeneratePreview', 'true');
    router.push('/ad-test/render');
  };

  const navigateToTemplate = () => {
    router.push('/ad-test/template');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Test Product Video Render</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Test Product Video Render</h1>
          <p className="text-gray-400">Test the rendering system with product videos</p>
        </div>

        {/* Test Configuration */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Product Video URL</label>
              <input
                type="text"
                value={testData.productVideoUrl}
                onChange={(e) => setTestData(prev => ({ ...prev, productVideoUrl: e.target.value }))}
                placeholder={`Default: ${sampleProductVideoUrl}`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-gray-500 text-sm mt-1">Leave blank to use sample URL</p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Avatar ID</label>
              <select
                value={testData.avatarId}
                onChange={(e) => setTestData(prev => ({ ...prev, avatarId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value={26}>Female Blonde (New) - ID 26</option>
                <option value={29}>Female Blonde 4 (New) - ID 29</option>
                <option value={30}>Female Blonde 5 (New) - ID 30</option>
                <option value={31}>Female Brunette (New) - ID 31</option>
                <option value={32}>Male Brunette 1 (New) - ID 32</option>
                <option value={33}>Male Brunette 2 (New) - ID 33</option>
                <option value={34}>Male Brunette 3 (New) - ID 34</option>
              </select>
              <p className="text-gray-500 text-sm mt-1">Select an avatar that can hold products</p>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Template ID</label>
              <select
                value={testData.templateId}
                onChange={(e) => setTestData(prev => ({ ...prev, templateId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              >
                <option value="minimalist-split">Minimalist Split</option>
                <option value="dynamic-reveal">Dynamic Reveal</option>
                <option value="product-showcase">Product Showcase</option>
                <option value="social-story">Social Story</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Test Script</label>
              <textarea
                value={testData.script}
                onChange={(e) => setTestData(prev => ({ ...prev, script: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Audio URL</label>
              <input
                type="text"
                value={testData.audioUrl}
                onChange={(e) => setTestData(prev => ({ ...prev, audioUrl: e.target.value }))}
                placeholder={`Default: ${sampleAudioUrl}`}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              />
              <p className="text-gray-500 text-sm mt-1">Leave blank to use sample URL</p>
            </div>
          </div>
        </div>

        {/* Current AdData Display */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Current AdData</h2>
          <div className="bg-gray-800 rounded-lg p-4 overflow-auto max-h-64">
            <pre className="text-gray-300 text-sm">
              {JSON.stringify(adData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={setupTestData}
            className="w-full btn-primary"
          >
            Setup Test Data
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={navigateToTemplate}
              className="btn-secondary"
            >
              Go to Template Page
            </button>

            <button
              onClick={navigateToRender}
              className="btn-primary"
              disabled={!adData.avatarId || !adData.templateId}
            >
              Go to Render Page
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside text-blue-200 space-y-2">
            <li>Click "Setup Test Data" to configure the ad data with product video settings</li>
            <li>Use "Go to Template Page" to test the template preview with product videos</li>
            <li>Use "Go to Render Page" to test the actual render process</li>
            <li>The render system should automatically use the product video when available</li>
            <li>Check the browser console and server logs for detailed logging</li>
            <li><strong>Safety:</strong> The system will fallback to standard avatar videos if product video is invalid</li>
          </ol>
        </div>

        {/* Safety Notice */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 mt-4">
          <h3 className="text-lg font-semibold text-green-300 mb-2">System Safety</h3>
          <ul className="list-disc list-inside text-green-200 space-y-1">
            <li>System always defaults to standard avatar videos</li>
            <li>Product videos are only used when valid and available</li>
            <li>Robust error handling ensures render process never fails due to missing product videos</li>
            <li>All existing functionality remains unchanged for users without product videos</li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button 
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => router.push('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}