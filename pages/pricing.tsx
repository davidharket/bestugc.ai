// pages/pricing.tsx
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

interface PricingTierProps {
  title: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  credits: number;
  onClick: () => void;
}

const PricingTier = ({ title, price, originalPrice, description, features, ctaText, isPopular, credits, onClick }: PricingTierProps) => (
  <div className={`relative border-2 rounded-[20px] p-8 transition-all duration-300 hover:scale-105 ${
    isPopular 
      ? 'border-gray-700 shadow-lg shadow-orange-500/25' 
      : 'border-gray-700 hover:border-orange-500/50'
  }`} style={{ backgroundColor: isPopular ? 'rgba(232, 90, 18, 0.05)' : '#111827' }}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </span>
      </div>
    )}
    
    <div className="text-center">
      
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      
      <div className="mb-6">
        {originalPrice && (
          <div className="text-gray-500 line-through text-lg mb-1">{originalPrice}</div>
        )}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-gray-400 text-lg">/mo</span>
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium mt-3" style={{ backgroundColor: isPopular ? '#e85a12' : '#374151' }}>
          {credits} Credits Included
        </div>
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <img src="/success.svg" alt="Included" className="w-4 h-4" />
          </div>
          <span className="text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
    
    <button 
      onClick={onClick}
      className={`w-full py-4 px-6 rounded-[20px] text-lg transition-all duration-300 transform hover:scale-105 ${
        isPopular 
          ? 'btn-primary' 
          : 'btn-secondary'
      }`} style={{ fontWeight: '400' }}>
        {ctaText}
      </button>
  </div>
);

const faqData = [
  {
    question: "How do credits work?",
    answer: "Each video ad creation costs 10 credits. Credits never expire and can be used anytime. You can also purchase additional credit packs if needed."
  },
  {
    question: "Can I change or cancel my plan?",
    answer: "Yes! You can upgrade, downgrade, or cancel your subscription anytime. Changes take effect at your next billing cycle."
  },
  {
    question: "What's included in the free trial?",
    answer: "New users get 20 free credits (2 video ads) to test our platform. No credit card required for the trial."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund."
  },
  {
    question: "What video formats do you support?",
    answer: "We support all major social media formats including 9:16 (TikTok, Instagram Stories), 16:9 (YouTube, Facebook), and 1:1 (Instagram feed)."
  },
  {
    question: "How realistic are the AI avatars?",
    answer: "Our AI avatars are extremely realistic. Most viewers cannot distinguish them from real people. We use advanced deepfake technology with ethical guidelines."
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handlePlanClick = (planTitle: string) => {
    if (!session) {
      signIn('google', { callbackUrl: '/subscription' });
    } else {
      router.push('/subscription');
    }
  };

  const monthlyTiers = [
    {
      title: 'Basic',
      price: '499kr',
      description: 'Perfect for testing and small businesses getting started with AI video ads.',
      features: [
        '100 Credits per month',
        'All Standard Avatars',
        'Multiple Video Templates',
        'HD Video Quality (1080p)',
        'All Platform Formats',
        'Email Support',
        'Commercial License'
      ],
      ctaText: 'Start Basic Plan',
      credits: 100
    },
    {
      title: 'Pro',
      price: '999kr',
      description: 'For growing businesses that need more scale and advanced features.',
      features: [
        '250 Credits per month',
        'Premium Avatars',
        'Advanced Templates',
        '4K Video Quality',
        'Custom Branding Options',
        'No Watermark',
        'Priority Support',
        'API Access (Beta)'
      ],
      ctaText: 'Choose Pro Plan',
      isPopular: true,
      credits: 250
    },
    {
      title: 'Premium',
      price: '1499kr',
      description: 'The ultimate package for agencies and high-volume content creators.',
      features: [
        '400 Credits per month',
        'All Premium Features',
        'White-label Solutions',
        'Custom Avatar Creation',
        'Dedicated Account Manager',
        '24/7 Priority Support',
        'Advanced Analytics',
        'Custom Integrations'
      ],
      ctaText: 'Choose Premium',
      credits: 400
    },
  ];

  const currentTiers = monthlyTiers;

  return (
    <div className="bg-black text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-[20px] mb-8" style={{ backgroundColor: '#111827' }}>
              <span className="text-orange-400 text-sm font-normal">Simple, Transparent Pricing</span>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Choose the Perfect Plan for{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                Your Business
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Start free with 20 credits, then choose a plan that scales with your business. 
              No hidden fees, no long-term contracts, cancel anytime.
            </p>

          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentTiers.map(tier => (
              <PricingTier 
                key={tier.title} 
                {...tier} 
                onClick={() => handlePlanClick(tier.title)}
              />
            ))}
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 rounded-[20px] border border-gray-700 px-6 py-3" style={{ backgroundColor: '#111827' }}>
              <img src="/shield.svg" alt="" className="w-5 h-5" />
              <span className="text-gray-300">14-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <section className="bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-white mb-4">
                Compare All{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                  Features
                </span>
              </h2>
              <p className="text-gray-400">See what's included in each plan</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-4 text-white font-semibold">Features</th>
                    <th className="pb-4 text-center text-white font-semibold">Basic</th>
                    <th className="pb-4 text-center text-white font-semibold">Pro</th>
                    <th className="pb-4 text-center text-white font-semibold">Premium</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {[
                    ['Monthly Credits', '100', '250', '400'],
                    ['Video Quality', 'HD (1080p)', '4K', '4K'],
                    ['Avatar Library', 'Standard', 'Premium', 'All + Custom'],
                    ['Custom Branding', <img key="basic-branding" src="/fail.svg" alt="Not included" className="w-4 h-4 mx-auto" />, <img key="pro-branding" src="/success.svg" alt="Included" className="w-4 h-4 mx-auto" />, <img key="premium-branding" src="/success.svg" alt="Included" className="w-4 h-4 mx-auto" />],
                    ['API Access', <img key="basic-api" src="/fail.svg" alt="Not included" className="w-4 h-4 mx-auto" />, 'Beta', 'Full'],
                    ['Support', 'Email', 'Priority', '24/7 Dedicated'],
                    ['White-label', <img key="basic-white" src="/fail.svg" alt="Not included" className="w-4 h-4 mx-auto" />, <img key="pro-white" src="/fail.svg" alt="Not included" className="w-4 h-4 mx-auto" />, <img key="premium-white" src="/success.svg" alt="Included" className="w-4 h-4 mx-auto" />]
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-4 font-medium">{row[0]}</td>
                      <td className="py-4 text-center">{row[1]}</td>
                      <td className="py-4 text-center">{row[2]}</td>
                      <td className="py-4 text-center">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-black py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-white mb-4">
                Frequently Asked{' '}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                  Questions
                </span>
              </h2>
              <p className="text-gray-400">Everything you need to know about our pricing</p>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="rounded-[20px] border border-gray-700 overflow-hidden" style={{ backgroundColor: '#111827' }}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-700 transition-all duration-300 rounded-[20px]"
                  >
                    <span className="text-white font-normal">{faq.question}</span>
                    <span className={`text-lg transform transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''}`} style={{ color: '#e85a12' }}>
                      +
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-6">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-semibold text-white mb-6">
              Ready to Start Creating?
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Join smart businesses maximizing their ad spend ROI with AI-optimized video ads for social media. 
              Start with 20 free credits—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/dashboard"
                className="btn-secondary"
              >
                Start Free Trial
              </a>
              <div className="text-gray-300 text-sm">
                20 free credits • No credit card • 2 minutes setup
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}