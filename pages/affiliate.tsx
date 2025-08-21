// pages/affiliate.tsx
import { useState } from 'react';

const testimonials = [
  {
    name: "Patrick Qureshi",
    title: "Founder Sharewine",
    content: "We went from spending days developing content to generating it in a fraction of the time. The platform's powerful AI makes creating high-quality content quick and easy, allowing us to focus more on strategy and growth.",
    image: "/socialproof1.png"
  },
  {
    name: "Aaron Nosbisch", 
    title: "Founder Brez",
    content: "Creating content used to be a complicated and time-consuming process. MakeUGC simplified everything. They weren't just scroll-stoppers — users actually thought they were real people and engaged like crazy.",
    image: "/socialproof2.png"
  },
  {
    name: "Eileen Lee",
    title: "Senior marketing Nano Foam", 
    content: "MakeUGC helped us increase ROAS by 140% by turning feature launches into scroll-stopping video content — without ever picking up a camera.",
    image: "/socialproof3.png"
  }
];

export default function AffiliatePage() {
  const [basicReferrals, setBasicReferrals] = useState(5);
  const [proReferrals, setProReferrals] = useState(3);
  const [premiumReferrals, setPremiumReferrals] = useState(2);
  
  // Plan prices in USD for commission calculation
  const basicPrice = 49.90; // $49.90
  const proPrice = 99.90; // $99.90  
  const premiumPrice = 149.90; // $149.90
  
  const calculateEarnings = () => {
    const basicEarnings = basicReferrals * basicPrice * 0.1;
    const proEarnings = proReferrals * proPrice * 0.1;
    const premiumEarnings = premiumReferrals * premiumPrice * 0.1;
    return {
      total: Math.floor(basicEarnings + proEarnings + premiumEarnings),
      basic: Math.floor(basicEarnings),
      pro: Math.floor(proEarnings),
      premium: Math.floor(premiumEarnings)
    };
  };
  
  const earnings = calculateEarnings();

  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl lg:text-7xl font-semibold text-white mb-6 leading-tight">
            Earn Monthly Income With{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
              Best UGC
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            Refer people to Best UGC and earn 10% of monthly recurring income for life. There's no limit to how much you can earn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#signup" className="btn-primary px-8 py-4 w-48">
              Become An Affiliate
            </a>
            <a href="#resources" className="btn-secondary px-8 py-4 w-48">
              Get Affiliate Resources
            </a>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section className="py-20" style={{ backgroundColor: '#111827' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
              How it{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                works
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-orange-600 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                <img src="/group.svg" alt="Join" className="w-8 h-8" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Join the program</h3>
              <p className="text-gray-300 leading-relaxed">
                Create your affiliate account for Best UGC and get your affiliate link.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-orange-600 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                <img src="/link.svg" alt="Share" className="w-8 h-8" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Share your link</h3>
              <p className="text-gray-300 leading-relaxed">
                Share your affiliate link with your friends, followers, or customers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-orange-600 rounded-[20px] flex items-center justify-center mx-auto mb-6">
                <img src="/credits.svg" alt="Earn" className="w-8 h-8" style={{ filter: 'brightness(0) saturate(100%) invert(100%)' }} />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Get paid for life</h3>
              <p className="text-gray-300 leading-relaxed">
                You'll earn 10% recurring commission for every new customer you refer, for life.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="#signup" className="btn-primary px-8 py-4">
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="bg-black py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
              How much you can{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                actually make?
              </span>
            </h2>
            <p className="text-gray-300">Interactive calculator based on 10% commission</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Sliders */}
            <div className="space-y-8">
              {/* Basic Plan Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#e85a12' }}></div>
                    <label className="text-white font-semibold">Basic</label>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#e85a12' }}>{basicReferrals}</div>
                    <div className="text-gray-400 text-sm">Basic ${earnings.basic}/mo</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={basicReferrals}
                  onChange={(e) => setBasicReferrals(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-[20px] appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #e85a12 0%, #e85a12 ${(basicReferrals / 50) * 100}%, #374151 ${(basicReferrals / 50) * 100}%, #374151 100%)`
                  }}
                />
              </div>

              {/* Pro Plan Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#e85a12' }}></div>
                    <label className="text-white font-semibold">Pro</label>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#e85a12' }}>{proReferrals}</div>
                    <div className="text-gray-400 text-sm">Pro ${earnings.pro}/mo</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={proReferrals}
                  onChange={(e) => setProReferrals(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-[20px] appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #e85a12 0%, #e85a12 ${(proReferrals / 30) * 100}%, #374151 ${(proReferrals / 30) * 100}%, #374151 100%)`
                  }}
                />
              </div>

              {/* Premium Plan Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#e85a12' }}></div>
                    <label className="text-white font-semibold">Premium</label>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: '#e85a12' }}>{premiumReferrals}</div>
                    <div className="text-gray-400 text-sm">Premium ${earnings.premium}/mo</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={premiumReferrals}
                  onChange={(e) => setPremiumReferrals(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-700 rounded-[20px] appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #e85a12 0%, #e85a12 ${(premiumReferrals / 20) * 100}%, #374151 ${(premiumReferrals / 20) * 100}%, #374151 100%)`
                  }}
                />
              </div>
            </div>

            {/* Right Side - Total Earnings */}
            <div className="text-center">
              <div className="rounded-[20px] border border-gray-700 p-12 mb-8" style={{ backgroundColor: '#111827' }}>
                <div className="text-7xl font-bold mb-2" style={{ color: '#e85a12' }}>
                  ${earnings.total}
                </div>
                <div className="text-gray-400 text-lg">/month recurring</div>
              </div>
              
              <a href="#signup" className="btn-primary px-8 py-4">
                Start Earning ${earnings.total}/month
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Hidden for now */}
      {false && (
        <section className="py-20" style={{ backgroundColor: '#111827' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
                What they're{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                  saying
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="rounded-[20px] border border-gray-700 p-6 bg-black">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="text-white font-semibold">{testimonial.name}</div>
                      <div className="text-gray-400 text-sm">{testimonial.title}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-black py-20" id="signup">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold text-white mb-6">
            Try Best UGC Now
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Start creating UGC today and see why businesses love our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/dashboard"
              className="btn-secondary"
            >
              Create an account
            </a>
            <div className="text-white text-sm">
              Start creating UGC today
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
