// pages/index.tsx
import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Enhanced showcase videos with variety
const showcaseVideos = [
  '/hero3_compressed.mp4',
  '/v1_compressed.mp4',
  '/v2_compressed.mp4',
  '/hero2_compressed.mp4',
  '/hero1_compressed.mp4',
  '/v5_compressed.mp4',
  '/v6_compressed.mp4',
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
    if (status === 'authenticated' && router.pathname === '/') {
      router.push('/dashboard');
    }
  }, [session, status, router, router.pathname]);

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
        <div className="max-w-6xl mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 text-center">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight sm:leading-relaxed tracking-wide mb-4 sm:mb-6">
            The best way to<br />
            create <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>AI videos</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg text-white mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Enter your product link → Create AI videos in minutes
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6 px-4">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="btn-primary px-4 sm:px-8 py-3 sm:py-4 flex-1 sm:flex-none sm:w-48 text-sm sm:text-base"
            >
              Start creating
            </button>
            
            <button
              onClick={scrollToFeatures}
              className="btn-secondary px-4 sm:px-8 py-3 sm:py-4 flex-1 sm:flex-none sm:w-48 text-sm sm:text-base"
            >
              Features
            </button>
          </div>
        </div>

        {/* Hero Video Carousel - Full Width */}
        <div className="relative mb-8 sm:mb-16 -mt-4 sm:-mt-6">
          <div className="overflow-hidden">
            <div className="flex gap-2 sm:gap-3 lg:gap-4 animate-scroll-left px-4 sm:px-6 lg:px-8">
              {/* Triple set of hero videos for seamless infinite scroll */}
              {Array(3).fill([
                '/hero-content/BestUGC-avatar (1)_compressed.mp4',
                '/hero-content/final-ad-cmeo58zo5000f4agk9qlt5you-9x16_compressed.mp4',
                '/landing-page-content/bugc – Laget med Clipchamp_short_compressed.mp4',
                '/hero3_compressed.mp4',
                '/v1_compressed.mp4',
                '/v2_compressed.mp4',
                '/hero2_compressed.mp4',
                '/hero1_compressed.mp4'
              ]).flat().map((video, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <div className="w-20 sm:w-24 md:w-32 lg:w-40 xl:w-48 rounded-lg sm:rounded-xl overflow-hidden border border-gray-700 group-hover:border-orange-clean transition-all duration-300" style={{ backgroundColor: '#111827', aspectRatio: '9/16' }}>
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
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap px-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="flex -space-x-3 sm:-space-x-4">
                <img src="/socialproof1.png" alt="User testimonial" className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-black" />
                <img src="/socialproof2.png" alt="User testimonial" className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-black" />
                <img src="/socialproof3.png" alt="User testimonial" className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-black" />
                <img src="/socialproof4.png" alt="User testimonial" className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-black" />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                <span className="text-white font-normal text-sm sm:text-base">Over 500+ videos created</span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star.svg" alt="Star rating" className="w-3 sm:w-4 h-3 sm:h-4" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section ref={featuresRef} id="features" className="bg-black py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative space-y-20 sm:space-y-24">
            {/* Vertical connecting lines - hidden on mobile */}
            <div className="hidden lg:block absolute left-4 top-16 bottom-36 w-px bg-white opacity-30"></div>
            
            {/* Step 1: Enter any link */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-center lg:space-y-0 animate-on-scroll animate-slide-in-left">
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-3 sm:mb-4">
                  <span className="bg-black px-2 py-1 mr-2 rounded">1.</span> Enter any <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>link</span>
                </h2>
                <p className="text-base sm:text-lg text-white pl-0 lg:pl-14">
                  Enter anything from a product link to a real estate listing
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                <img 
                  src="/image1-section1.png" 
                  alt="Enter any link interface"
                  className="w-full max-w-sm sm:max-w-lg mx-auto lg:ml-auto rounded-xl sm:rounded-2xl shadow-lg"
                />
              </div>
            </div>

            {/* Step 2: Get AI generated scripts */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-center lg:space-y-0 animate-on-scroll animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-3 sm:mb-4">
                  <span className="bg-black px-2 py-1 mr-2 rounded">2.</span>Get AI generated <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>scripts</span>
                </h2>
                <p className="text-base sm:text-lg text-white pl-0 lg:pl-14">
                  Get several scripts that you can use or edit to your needs
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
                <img 
                  src="/image2-section1.png" 
                  alt="AI generated scripts interface"
                  className="w-full max-w-sm sm:max-w-lg mx-auto lg:ml-auto rounded-xl sm:rounded-2xl shadow-lg"
                />
              </div>
            </div>

            {/* Step 3: Select an AI Avatar */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-center lg:space-y-0 animate-on-scroll animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-3 sm:mb-4">
                  <span className="bg-black px-2 py-1 mr-2 rounded">3.</span>Select an <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>AI Avatar</span>
                </h2>
                <p className="text-base sm:text-lg text-white pl-0 lg:pl-14">
                  Select from our vast library of AI avatars
                </p>
              </div>
              <div className="animate-on-scroll animate-slide-in-right" style={{ animationDelay: '0.8s' }}>
                <img 
                  src="/image3-section1.png" 
                  alt="AI Avatar selection interface"
                  className="w-full max-w-sm sm:max-w-lg mx-auto lg:ml-auto rounded-xl sm:rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Generate Videos Section */}
      <section className="bg-black py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-8 sm:mb-16">
            Generate <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>Videos</span>
          </h2>
        </div>
        
        {/* Infinite Scrolling Avatar Videos - Full Width */}
        <div className="relative mb-8 sm:mb-16">
          <div className="overflow-hidden">
            <div className="flex gap-3 sm:gap-4 lg:gap-6 animate-scroll-left px-4 sm:px-6 lg:px-8">
              {/* Triple set of videos for seamless infinite scroll */}
              {Array(3).fill(showcaseVideos).flat().map((video, index) => (
                <div key={index} className="relative group flex-shrink-0">
                  <div className="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-700 group-hover:border-orange-clean transition-all duration-300" style={{ backgroundColor: '#111827', aspectRatio: '9/16' }}>
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
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* CTA Button */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-primary px-6 sm:px-8 py-3 sm:py-4 gap-2 text-sm sm:text-base"
          >
            Get started
            <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 hidden sm:py-20" style={{ backgroundColor: '#111827' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-24">
            {/* No back and forth with creators */}
            <div className="text-center hidden md:block">
              <h3 className="text-white text-base sm:text-lg mb-4 sm:mb-8 px-2">No back and fourth with creators</h3>
              <div className="flex justify-center items-center mb-4 h-32 sm:h-48">
                <img 
                  src="/nobackandforthwithcreators.png" 
                  alt="No back and forth with creators comparison"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* Use minutes instead of months */}
            <div className="text-center">
              <h3 className="text-white text-base sm:text-lg mb-4 sm:mb-8 px-2">Use minutes instead of months</h3>
              <div className="flex justify-center items-center mb-4 h-32 sm:h-48">
                <img 
                  src="/minutesinsteadofmonths.png" 
                  alt="Minutes instead of months comparison"
                  className="max-h-full w-auto object-contain"
                />
              </div>
            </div>

            {/* For 5% of the cost */}
            <div className="text-center">
              <h3 className="text-white text-base sm:text-lg mb-4 sm:mb-8 px-2">For 5% of the cost</h3>
              <div className="flex justify-center items-center mb-4 h-32 sm:h-48">
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

      {/* Product Images Section */}
      <section className="py-12 sm:py-20" style={{ backgroundColor: '#00000' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            
            {/* Left Column - Text Content */}
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6 sm:mb-8">
                Generate stunning <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>product images</span>
              </h2>
              
              <div className="space-y-4 sm:space-y-6 text-white">
                <p className="text-base sm:text-lg leading-relaxed">	
		 Choose a template, upload your product image, get stunning results
		</p>
                <p className="text-base sm:text-lg leading-relaxed">
                  Our AI is trained on product photography and preserves logos, branding and product shapes
                </p>
              </div>
              
              {/* Call to Action Button */}
              <div className="mt-8">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="btn-primary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
                >
                  Start creating images
                </button>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/landing-page-content/image-section.png" 
                alt="Product images showcase"
                className="w-full max-w-lg rounded-xl sm:rounded-2xl shadow-lg"
              />
            </div>
          </div>
          
          {/* Template Gallery */}
          <div className="mt-16">
            <h3 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-8">
              Select a template
            </h3>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {[
                {
                  filename: "60lucky_Product_photography_of_a_skin_care_product_in_a_silver__bfa8f6db-ed62-4a50-9429-b858ce2a62ac.png",
                  description: "Professional product photography"
                },
                {
                  filename: "acandeloro_A_photo_of_a_luxurious_amber-colored_hand_cream_bott_97f6bf57-bb39-4631-9eb4-b9d0373a3bf9.png",
                  description: "Skincare product display"
                },
                {
                  filename: "anvayc_A_minimalist_and_premium_product_shot_of_a_dark_green_ma_e75d1de3-8f7d-414c-9ddc-d4a0a8383ca5.png",
                  description: "Minimalist product design"
                },
                {
                  filename: "blackmonkey1495335_A_minimalistic_black_and_red_perfume_bottle__8b07b9c5-e8bd-457f-b74b-def68fa1df41.png",
                  description: "Bottle product shot"
                },
                {
                  filename: "chars_62968_a_tube_of_hand_cream_placed_on_a_rustic_wooden_tabl_fa105895-7f15-488d-a5fc-2e265da84c2b.png",
                  description: "Skincare product display"
                },
                {
                  filename: "etejaz_Product_photography_one_white_skin_cream_product_on_a_cl_0e337b86-7400-40ba-b3e9-844ef098636a.png",
                  description: "Professional product photography"
                },
                {
                  filename: "garam_63333_two_white_cosmetic_tube_products_clean_and_minimal__1948653f-5252-46bd-81f8-3de4f1d6255e.png",
                  description: "Tube packaging display"
                },
                {
                  filename: "lorimarc_A_sleek_flat-lay_of_a_stubby_amber_supplement_jar_with_c57f072d-4d83-400f-982d-18a36808f98f.png",
                  description: "Jar product photography"
                },
                {
                  filename: "majestymidjorney_a_white_eco_shampoo_bottle_with_a_wooden_cap_a_33949851-d346-4cb1-8135-301edab6d7ce.png",
                  description: "Bottle product shot"
                },
                {
                  filename: "sophie.agostine_Product_photography_a_bottle_of_face_serum_with_5bb3a407-c8f1-485c-8cf4-66d5c2a9f922.png",
                  description: "Professional product photography"
                },
                {
                  filename: "stevezi_Cinematic_beauty_product_packshot_in_nature_close-up_of_7815f66b-9598-4cee-b996-dbc8945c1ea8.png",
                  description: "Natural outdoor setting"
                },
                {
                  filename: "u4295568577_A_minimalist_product_photo_of_an_amber_glass_droppe_f2c0b527-e242-4d13-a7e2-319aa93b6f70.png",
                  description: "Minimalist product design"
                },
                {
                  filename: "anvayc_A_minimalist_and_premium_product_shot_of_a_dark_green_ma_e75d1de3-8f7d-414c-9ddc-d4a0a8383ca5.png",
                  description: "Minimalist product design"
                },
                {
                  filename: "binksologue_Product_photograph_of_a_beige_cosmetic_jar_with_a_d_d5a817aa-39af-441f-9ab7-dc62fcab41a5.png",
                  description: "Jar product photography"
                },
                {
                  filename: "bmdesign_An_attractive_young_African_American_model_around_age__9f0462d4-dc20-4c44-b584-35e0f9530fdf.png",
                  description: "Person showcasing product"
                },
                {
                  filename: "design.gora.group._a_man_holding_two_jars_of_vitamins_t-shirt_w_21d28063-0192-4517-8a7e-90e967115ebf.png",
                  description: "Person showcasing product"
                },
                {
                  filename: "dsigntank_39649_This_is_an_advertising_product_photo_of_a_green_a4e5efc9-ee2a-4e58-b139-3900804b3e43.png",
                  description: "Product display template"
                },
                {
                  filename: "jjeongs83_a_beautiful_and_healthy_young_woman_holding_this_prod_bacf013c-e8b6-4a9d-898f-ac25a0747c06.png",
                  description: "Person showcasing product"
                },
                {
                  filename: "kobeni_08_A_photo_of_a_Japanese_woman_holding_a_face_cream_in_o_d559dfe8-f36f-4db1-8a80-c7404e698af5.png",
                  description: "Skincare product display"
                },
                {
                  filename: "ryansgate_High-contrast_luxury_flat_lay_of_skincare_and_wellnes_521900f2-26a8-4f92-b022-36c67c715784.png",
                  description: "Skincare product display"
                }
              ].map((template) => (
                <div key={template.filename} className="break-inside-avoid">
                  <div className="relative group rounded-[15px] overflow-hidden transition-all duration-200 border border-gray-700 hover:border-orange-500/50">
                    <img
                      src={`/image-inspo/${template.filename}`}
                      alt={template.description}
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                      <a
                        href="https://bestugc.ai/auth/signin?callbackUrl=https%3A%2F%2Fbestugc.ai%2F%23features"
                        className="btn-secondary px-4 py-2 text-sm font-normal transition-colors"
                      >
                        Use Template
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-black py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white text-center mb-8 sm:mb-16">
            Have questions?
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
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
              <div key={index} className="rounded-lg sm:rounded-xl border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
                <button 
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between hover:bg-gray-700 transition-all duration-300 rounded-lg sm:rounded-xl"
                >
                  <span className="text-white font-normal text-sm sm:text-base pr-4">{faq.question}</span>
                  <span className={`text-orange-clean text-lg sm:text-xl transform transition-transform duration-300 flex-shrink-0 ${expandedFaq === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <p className="text-white leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 sm:mb-6">
            Ready to Create Your First AI Video Ad?
          </h2>
          <p className="text-base sm:text-lg text-white mb-6 sm:mb-8 leading-relaxed">
            Join forward-thinking businesses maximizing ROI with AI-powered video ads optimized for social media conversions. 
            Start free, scale unlimited.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="btn-secondary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base"
            >
              Get Started - It's Free
            </button>
            <div className="text-white text-sm sm:text-lg text-center">
              No credit card required • 20 free credits
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

