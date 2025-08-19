// pages/image-ads.tsx
import { useState } from 'react';

export default function ImageAdsPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would add logic to send the email to your mailing list API
    console.log('Waitlist submission:', email);
    setSubmitted(true);
  };

  return (
      <div className="bg-black py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 mb-6">
              <span className="text-orange-400 text-sm font-medium">✨ Coming Soon</span>
            </div>
            
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              The Future of Product Placement: 
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent block mt-2">
                AI Image Ads
              </span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-300 leading-relaxed">
              Imagine your product, seamlessly held and showcased by our AI avatars in any setting. Generate lifestyle product photos for your social media, ads, and e-commerce store in seconds.
            </p>
          </div>

          {/* How it Works */}
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-12">How It Works</h2>
            <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-0">
              <div className="flex flex-col items-center p-6 bg-gray-900 border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <p className="text-lg font-semibold text-white mb-2">Upload Your Product</p>
                <p className="text-sm text-gray-400">Provide an image of your product with a transparent background.</p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-gray-900 border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <p className="text-lg font-semibold text-white mb-2">Choose Your Avatar</p>
                <p className="text-sm text-gray-400">Select an avatar and a scene from our growing library.</p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-gray-900 border border-gray-800 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <p className="text-lg font-semibold text-white mb-2">Generate Image</p>
                <p className="text-sm text-gray-400">Our AI generates a photorealistic image of the avatar using your product.</p>
              </div>
            </div>
          </div>

          {/* Waitlist Section */}
          <div className="mx-auto mt-20 max-w-lg">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4">Be the First to Know</h3>
              <p className="text-gray-400 mb-6">Join our waitlist to get early access when image ads launch.</p>
              
              {submitted ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-green-400">Thank you! You're on the waitlist.</p>
                  <p className="text-sm text-gray-400 mt-2">We'll notify you when image ads are ready.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email-address" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Join Waitlist
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Additional Features Preview */}
          <div className="mx-auto mt-20 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-8">What Makes It Special</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-2">Endless Creativity</h3>
                <p className="text-gray-400">Generate unlimited variations with different avatars, poses, and backgrounds.</p>
              </div>
              
              <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-400">Create professional product photos in seconds, not hours or days.</p>
              </div>
              
              <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">💰</div>
                <h3 className="text-lg font-semibold text-white mb-2">Cost Effective</h3>
                <p className="text-gray-400">No need for expensive photoshoots or professional models.</p>
              </div>
              
              <div className="text-left bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">📱</div>
                <h3 className="text-lg font-semibold text-white mb-2">Social Ready</h3>
                <p className="text-gray-400">Perfect for Instagram, Facebook, TikTok, and all social platforms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}