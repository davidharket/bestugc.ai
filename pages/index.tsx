// pages/index.tsx
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Enhanced showcase videos with variety
const showcaseVideos = [
  '/avatars/female-brunette-adult-inside.mp4',
  '/avatars/male-brunette-adult-inside.mp4',
  '/avatars/female-blonde-senior-inside.mp4',
  '/avatars/female-blonde2-adult-inside.mp4',
  '/avatars/male-blonde-adult-inside.mp4',
  '/avatars/female-brunette2-adult-inside.mp4',
];

const features = [
  {
    icon: '🎬',
    title: 'AI-Powered Scripts',
    description: 'Generate converting ad scripts instantly with our advanced AI that understands your product and audience.'
  },
  {
    icon: '👥',
    title: 'Diverse AI Avatars',
    description: 'Choose from our library of lifelike avatars representing different demographics and personalities.'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Create professional video ads in minutes, not weeks. From product URL to finished ad in under 10 minutes.'
  },
  {
    icon: '🎯',
    title: 'ROI Optimized',
    description: 'Templates and scripts engineered to maximize return on ad spend across social media platforms.'
  },
  {
    icon: '📱',
    title: 'Multi-Format',
    description: 'Perfect for TikTok, Instagram, Facebook, YouTube - all formats and aspect ratios covered.'
  },
  {
    icon: '💰',
    title: 'Maximize Ad Spend',
    description: 'Replace expensive UGC creators and production teams. Create unlimited variations to find your highest-ROI creative.'
  }
];

// Testimonials removed - will add real customer testimonials later

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Auto-rotate showcase videos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % showcaseVideos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);


  return (
    <>
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-white">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 mb-6">
                <span className="text-orange-400 text-sm font-medium">✨ AI-Powered Video Ads</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Never overpay for{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  UGC
                </span>{' '}
                again
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Transform your product link into high-ROI video ads optimized for social media conversions. 
                Our AI creates authentic-looking user-generated content that maximizes your advertising spend.
              </p>

              {/* Key Benefits */}
              <div className="space-y-4 text-lg text-gray-300 mb-10">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚀</span>
                  <span>Enter your product link → Create UGC ads in minutes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👸</span>
                  <span>Choose from diverse AI avatars and voices</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💖</span>
                  <span>Proven converting templates and scripts</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <span>Test variations 10x faster than traditional UGC</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transform hover:scale-105 transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.331,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    Start Creating - Free
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <a href="/about" className="px-8 py-4 border-2 border-orange-500 text-orange-400 font-semibold rounded-xl hover:bg-orange-500/10 transition-all duration-300 inline-block text-center">
                  How it works
                </a>
              </div>

              {/* Social Proof */}
              <div className="mt-8 pt-8 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-3">Trusted by growing businesses</p>
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {['👩‍💼', '👨‍💻', '👩‍🚀', '👨‍🎨', '👩‍🔬'].map((emoji, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center border-2 border-black">
                        <span className="text-sm">{emoji}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-orange-400 text-sm">⭐</span>
                    ))}
                    <span className="text-gray-400 text-sm ml-2">4.9/5 rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Video Showcase */}
            <div className="relative">
              <div className="relative max-w-sm mx-auto">
                {/* Phone Frame */}
                <div className="relative bg-black p-2 rounded-[2.5rem] shadow-2xl border-4 border-gray-800">
                  <div className="relative bg-black rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/16' }}>
                    {/* Video */}
                    <video
                      key={showcaseVideos[currentVideoIndex]}
                      src={showcaseVideos[currentVideoIndex]}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    
                    {/* Overlay UI Elements */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                      <div className="bg-black/50 backdrop-blur rounded-full px-3 py-1">
                        <span className="text-white text-xs font-medium">AI Generated</span>
                      </div>
                      <div className="bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center">
                        <span className="text-white text-xs">▶</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/50 backdrop-blur rounded-xl p-3">
                        <p className="text-white text-sm font-medium">🔥 This serum changed my skin!</p>
                        <p className="text-gray-300 text-xs mt-1">Click link in bio for 20% off ✨</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-3 shadow-lg animate-bounce">
                  <span className="text-white text-xl">🎬</span>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-3 shadow-lg animate-pulse">
                  <span className="text-white text-xl">✨</span>
                </div>

                {/* Video Indicators */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {showcaseVideos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentVideoIndex ? 'bg-orange-500 w-6' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              From Product Link to Viral Ad in{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI handles everything from script writing to avatar selection. Just provide your product and watch the magic happen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Paste Your URL',
                description: 'Enter any product page link. Our AI analyzes the content, extracts images, and understands your product.',
                icon: '🔗'
              },
              {
                step: '02', 
                title: 'AI Creates Everything',
                description: 'Choose from AI-generated scripts, select your perfect avatar, and customize the format for your platform.',
                icon: '🤖'
              },
              {
                step: '03',
                title: 'Download & Launch',
                description: 'Get your professional video ad in minutes. Test variations, scale what works, dominate your market.',
                icon: '🚀'
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-black border border-gray-800 rounded-2xl p-8 h-full hover:border-orange-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                  <div className="text-6xl mb-4">{item.icon}</div>
                  <div className="text-orange-500 text-sm font-bold mb-2">STEP {item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>
                
                {/* Connecting Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-white mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Maximize Your ROI
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional features optimized for social media conversions, designed to get the most from every advertising dollar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full hover:border-orange-500/50 transition-all duration-300 group-hover:bg-gray-800">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials section removed - will add real customer testimonials later */}

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-white mb-6">
            Ready to Create Your First AI Video Ad?
          </h2>
          <p className="text-xl text-orange-100 mb-8 leading-relaxed">
            Join forward-thinking businesses maximizing ROI with AI-powered video ads optimized for social media conversions. 
            Start free, scale unlimited.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              Get Started - It's Free
            </button>
            <div className="text-orange-100 text-sm">
              ✨ No credit card required • 20 free credits
            </div>
          </div>
        </div>
      </section>
    </>
  );
}