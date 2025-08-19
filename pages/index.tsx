// pages/index.tsx
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Enhanced showcase videos with variety
const showcaseVideos = [
  '/hero3.mp4',
  '/v1.mp4',
  '/v2.mp4',
  '/hero2.mp4',
  '/v3.mp4',
  '/v4.mp4',
  '/hero1.mp4',
  '/v5.mp4',
  '/v6.mp4',
];

const features = [
  {
    icon: '/videos.svg',
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

// Hook for scroll animations
function useScrollAnimation() {
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const featuresRef = useRef<HTMLElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useScrollAnimation();

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
      <Head>
        <title>Best UGC - The #1 AI UGC Tool | Create High-Converting Video Ads</title>
        <meta name="description" content="Create high-converting AI video ads in minutes. Transform your product links into professional UGC content that drives real results. Never overpay for UGC again." />
      </Head>
      
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Heading */}
          <h1 className="text-5xl lg:text-7xl font-semibold leading-relaxed tracking-wide mb-8">
            The best way to<br />
            create <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>AI videos</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-white mb-12 max-w-2xl mx-auto">
            Enter your product link → Create AI videos in minutes
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="btn-primary px-8 py-4 w-48"
            >
              Start creating
            </button>
            
            <button
              onClick={scrollToFeatures}
              className="btn-secondary px-8 py-4 w-48"
            >
              Features
            </button>
          </div>

          {/* Three Overlapping Phone Mockups */}
          <div className="relative flex justify-center items-end max-w-4xl mx-auto mb-16">
            {/* Left Phone */}
            <div className="relative transform -rotate-12 scale-90 z-10">
              <div className="w-64 bg-black rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-800" style={{ aspectRatio: '9/19.5' }}>
                <div className="w-full h-full bg-black rounded-[2rem] overflow-hidden relative">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
		    >
                    <source src="/hero1.mp4" type="video/mp4" />
                    {/* Fallback for unsupported browsers */}
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl mb-2">🎬</div>
                        <div className="text-sm">Video Preview</div>
                      </div>
                    </div>
                  </video>
                  {/* TikTok-style overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Center Phone */}
            <div className="relative z-20 mx-4">
              <div className="w-72 bg-black rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-800" style={{ aspectRatio: '9/19.5' }}>
                <div className="w-full h-full bg-black rounded-[2rem] overflow-hidden relative">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onEnded={(e) => e.currentTarget.play()}
                    onError={(e) => {
                      console.error('Video failed to load:', e);
                      // Try to reload the video once
                      setTimeout(() => {
                        e.currentTarget.load();
                      }, 1000);
                    }}
                  >
                    <source src="/hero2.mp4" type="video/mp4" />
                    {/* Fallback for unsupported browsers */}
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl mb-2">🎬</div>
                        <div className="text-sm">Video Preview</div>
                      </div>
                    </div>
                  </video>
                  {/* TikTok-style overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Right Phone */}
            <div className="relative transform rotate-12 scale-90 z-10">
              <div className="w-64 bg-black rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-800" style={{ aspectRatio: '9/19.5' }}>
                <div className="w-full h-full bg-black rounded-[2rem] overflow-hidden relative">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    onEnded={(e) => e.currentTarget.play()}
                    onError={(e) => {
                      console.error('Video failed to load:', e);
                      // Try to reload the video once
                      setTimeout(() => {
                        e.currentTarget.load();
                      }, 1000);
                    }}
                  >
                    <source src="/hero3.mp4" type="video/mp4" />
                    {/* Fallback for unsupported browsers */}
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-2xl mb-2">🎬</div>
                        <div className="text-sm">Video Preview</div>
                      </div>
                    </div>
                  </video>
                  {/* TikTok-style overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                <img src="/socialproof1.png" alt="User testimonial" className="w-12 h-12 rounded-full" />
                <img src="/socialproof2.png" alt="User testimonial" className="w-12 h-12 rounded-full" />
                <img src="/socialproof3.png" alt="User testimonial" className="w-12 h-12 rounded-full" />
                <img src="/socialproof4.png" alt="User testimonial" className="w-12 h-12 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-normal">Loved by 100+ businesses</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star.svg" alt="Star rating" className="w-4 h-4" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section id="features" className="bg-black py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative space-y-24">
            {/* Vertical connecting lines */}
            <div className="absolute left-4 top-16 bottom-36 w-px bg-white opacity-30"></div>
            
            {/* Step 1: Enter any link */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-on-scroll animate-slide-in-left">
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
                  <span className="bg-black px-2 py-1 mr-2">1.</span> Enter any <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>link</span>
                </h2>
                <p className="text-lg text-white pl-14">
                  Enter anything from a product link,<br></br> to a real estate listing
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                <img 
                  src="/image1-section1.png" 
                  alt="Enter any link interface"
                  className="w-full max-w-lg ml-auto rounded-2xl"
                />
              </div>
            </div>

            {/* Step 2: Get AI generated scripts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-on-scroll animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
                  <span className="bg-black px-2 py-1 mr-2">2.</span>Get AI generated <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>scripts</span>
                </h2>
                <p className="text-lg text-white pl-14">
                  Get several scripts that you can use,<br></br>or edit to your needs
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
                <img 
                  src="/image2-section1.png" 
                  alt="AI generated scripts interface"
                  className="w-full max-w-lg ml-auto rounded-2xl"
                />
              </div>
            </div>

            {/* Step 3: Select an AI Avatar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-on-scroll animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-4">
                  <span className="bg-black px-2 py-1 mr-2">3.</span>Select an <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>AI Avatar</span>
                </h2>
                <p className="text-lg text-white pl-14">
                  Select from our vast library of<br></br>AI avatars
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.8s' }}>
                <img 
                  src="/image3-section1.png" 
                  alt="AI Avatar selection interface"
                  className="w-full max-w-lg ml-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Generate Videos Section */}
      <section className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-16">
            Generate <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>Videos</span>
          </h2>
          
          {/* Infinite Scrolling Avatar Videos */}
          <div className="relative mb-16 overflow-hidden">
            <div className="flex gap-4 animate-scroll-left">
              {/* First set of videos */}
              {showcaseVideos.slice(0, 5).map((video, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <div className="w-48 rounded-2xl overflow-hidden border-2 border-gray-700 group-hover:border-orange-clean transition-all duration-300" style={{ backgroundColor: '#111827', aspectRatio: '9/16' }}>
                    <video
                      src={video}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      onEnded={(e) => e.currentTarget.play()}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                </div>
              ))}
              {/* Duplicate set for infinite effect */}
              {showcaseVideos.slice(0, 5).map((video, index) => (
                <div key={`duplicate-${index}`} className="relative group flex-shrink-0">
                  <div className="w-48 rounded-2xl overflow-hidden border-2 border-gray-700 group-hover:border-orange-clean transition-all duration-300" style={{ backgroundColor: '#111827', aspectRatio: '9/16' }}>
                    <video
                      src={video}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      onEnded={(e) => e.currentTarget.play()}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-primary px-8 py-4 gap-2"
          >
            Get started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20" style={{ backgroundColor: '#111827' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {/* No back and forth with creators */}
            <div className="text-center">
              <h3 className="text-white text-lg mb-8">No back and fourth with creators</h3>
              <div className="flex justify-center items-center mb-4 h-48">
                <img 
                  src="/nobackandforthwithcreators.png" 
                  alt="No back and forth with creators comparison"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* Use minutes instead of months */}
            <div className="text-center">
              <h3 className="text-white text-lg mb-8">Use minutes instead of months</h3>
              <div className="flex justify-center items-center mb-4 h-48">
                <img 
                  src="/minutesinsteadofmonths.png" 
                  alt="Minutes instead of months comparison"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* For 5% of the cost */}
            <div className="text-center">
              <h3 className="text-white text-lg mb-8">For 5% of the cost</h3>
              <div className="flex justify-center items-center mb-4 h-48">
                <img 
                  src="/5percentofthecost.png" 
                  alt="5% of the cost comparison"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-semibold text-white text-center mb-16">
            Have questions?
          </h2>
          
          <div className="space-y-4">
            {[
              {
                question: "What is Best UGC?",
                answer: "Best UGC is an AI-powered platform that creates authentic-looking user-generated content videos from your product links in minutes."
              },
              {
                question: "How does the AI avatar selection work?",
                answer: "You can choose from our diverse library of AI avatars based on gender, age, and scene preferences. Each avatar is trained to deliver natural, engaging presentations."
              },
              {
                question: "What video formats do you support?",
                answer: "We support all major social media formats including TikTok (9:16), Instagram Stories (9:16), Facebook/Instagram Feed (1:1), and YouTube (16:9)."
              },
              {
                question: "How long does it take to create a video?",
                answer: "Once you provide your product link and make your selections, videos are typically generated within 2-5 minutes depending on length and complexity."
              },
              {
                question: "What's included in the free trial?",
                answer: "You get 20 free credits to start with - no credit card required. Each video generation costs 1 credit, so you can create up to 20 videos for free."
              },
              {
                question: "Can I edit the AI-generated scripts?",
                answer: "Yes! You can customize and edit any of the AI-generated scripts to match your brand voice and specific messaging needs."
              }
            ].map((faq, index) => (
              <div key={index} className="rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-700 transition-all duration-300 rounded-xl"
                >
                  <span className="text-white font-normal">{faq.question}</span>
                  <span className={`text-orange-clean text-lg transform transition-transform duration-300 ${expandedFaq === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 py-6">
                    <p className="text-white leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold text-white mb-6">
            Ready to Create Your First AI Video Ad?
          </h2>
          <p className="text-lg text-white mb-8 leading-relaxed">
            Join forward-thinking businesses maximizing ROI with AI-powered video ads optimized for social media conversions. 
            Start free, scale unlimited.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="btn-secondary"
            >
              Get Started - It's Free
            </button>
            <div className="text-white text-lg">
              No credit card required • 20 free credits
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

