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
  color: string;
  onClick: () => void;
}

const PricingTier = ({ title, price, originalPrice, description, features, ctaText, isPopular, credits, color, onClick }: PricingTierProps) => (
  <div className={`relative border-2 rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
    isPopular 
      ? 'border-orange-500 bg-gradient-to-b from-orange-500/10 to-orange-600/5 shadow-lg shadow-orange-500/25' 
      : 'border-gray-800 bg-gray-900 hover:border-orange-500/50'
  }`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
          Most Popular
        </span>
      </div>
    )}
    
    <div className="text-center">
      <div className={`w-16 h-16 bg-gradient-to-r ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <span className="text-white text-2xl">
          {title === 'Basic' ? '🚀' : title === 'Pro' ? '⭐' : '👑'}
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      
      <div className="mb-6">
        {originalPrice && (
          <div className="text-gray-500 line-through text-lg mb-1">{originalPrice}</div>
        )}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold text-white">{price}</span>
          <span className="text-gray-400 text-lg">/mo</span>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${color} text-white text-sm font-medium mt-3`}>
          {credits} Credits Included
        </div>
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
    
    <button 
      onClick={onClick}
      className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
        isPopular 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl' 
          : 'bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-700 hover:border-orange-500'
      }`}>
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
  const [selectedTab, setSelectedTab] = useState<'monthly' | 'yearly'>('monthly');
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
      credits: 100,
      color: 'from-blue-500 to-blue-600'
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
      credits: 250,
      color: 'from-orange-500 to-orange-600'
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
      credits: 400,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  const yearlyTiers = monthlyTiers.map(tier => ({
    ...tier,
    price: `${Math.floor(parseInt(tier.price.replace('kr', '')) * 10)}kr`,
    originalPrice: `${parseInt(tier.price.replace('kr', '')) * 12}kr`
  }));

  const currentTiers = selectedTab === 'monthly' ? monthlyTiers : yearlyTiers;

  return (
    <div className="bg-black text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 mb-8">
              <span className="text-orange-400 text-sm font-medium">💎 Simple, Transparent Pricing</span>
            </div>
            
            <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
              Choose the Perfect Plan for{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Your Business
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Start free with 20 credits, then choose a plan that scales with your business. 
              No hidden fees, no long-term contracts, cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 mb-12">
              <button
                onClick={() => setSelectedTab('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedTab === 'monthly'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedTab('yearly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedTab === 'yearly'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Yearly</span>
                <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">2 months free</span>
              </button>
            </div>
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
            <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-6 py-3">
              <span className="text-green-400 text-lg">🛡️</span>
              <span className="text-gray-300">14-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* Feature Comparison */}
        <section className="bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Compare All{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
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
                    ['Custom Branding', '❌', '✅', '✅'],
                    ['API Access', '❌', 'Beta', 'Full'],
                    ['Support', 'Email', 'Priority', '24/7 Dedicated'],
                    ['White-label', '❌', '❌', '✅']
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
              <h2 className="text-3xl font-bold text-white mb-4">
                Frequently Asked{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
              <p className="text-gray-400">Everything you need to know about our pricing</p>
            </div>

            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800 transition-colors"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="text-white font-medium">{faq.question}</span>
                    <span className={`text-orange-400 transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-white mb-6">
              Ready to Start Creating?
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              Join smart businesses maximizing their ad spend ROI with AI-optimized video ads for social media. 
              Start with 20 free credits—no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/dashboard"
                className="px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Start Free Trial
              </a>
              <div className="text-orange-100 text-sm">
                ✨ 20 free credits • No credit card • 2 minutes setup
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}