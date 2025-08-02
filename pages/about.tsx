// pages/about.tsx

const features = [
  { 
    name: 'AI Script Generation', 
    description: 'Our advanced AI analyzes your product and generates multiple high-converting scripts tailored to your specific audience and market.',
    icon: '🎬',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    name: 'Diverse AI Avatars', 
    description: 'Choose from a library of lifelike avatars representing different demographics, ages, and personalities to match your brand.',
    icon: '👥',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    name: 'Dynamic Video Templates', 
    description: 'Select from professionally designed templates proven to grab attention, drive engagement, and maximize conversions.',
    icon: '🎯',
    color: 'from-purple-500 to-purple-600'
  },
  { 
    name: 'Automated Rendering', 
    description: 'Complete video production including voiceover generation, lip-sync technology, and professional editing—all automated.',
    icon: '⚡',
    color: 'from-green-500 to-green-600'
  },
];

const steps = [
  {
    step: '01',
    title: 'Paste Your Product URL',
    description: 'Simply enter any product page link. Our AI instantly scrapes the content, extracts high-quality images and videos, and understands your product details.',
    icon: '🔗',
    details: [
      'Automatic content extraction',
      'Image and video optimization',
      'Product detail analysis',
      'Brand recognition'
    ]
  },
  {
    step: '02',
    title: 'AI Creates Everything',
    description: 'Our advanced AI generates multiple script variations, suggests the perfect avatar, and creates a customized video template optimized for your platform.',
    icon: '🤖',
    details: [
      'Multiple script variations',
      'Avatar recommendation',
      'Platform optimization',
      'Audience targeting'
    ]
  },
  {
    step: '03',
    title: 'Download & Launch',
    description: 'Receive your professional video ad in minutes. Test multiple variations, scale what works, and dominate your market with authentic-looking UGC.',
    icon: '🚀',
    details: [
      'Professional quality output',
      'Multiple format options',
      'A/B testing ready',
      'Instant delivery'
    ]
  }
];

const stats = [
  { number: '200+', label: 'Videos Created', icon: '🎬' },
  { number: '90%', label: 'Time Saved', icon: '⏱️' },
  { number: '340%', label: 'Target ROAS Boost', icon: '📈' }
];

export default function AboutPage() {
  return (
    <div className="bg-black text-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30 mb-8">
              <span className="text-orange-400 text-sm font-medium">✨ How Best UGC Works</span>
            </div>
            
            <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
              Transform Your Products into{' '}<br />
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                High-Converting Video Ads
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Stop waiting weeks for UGC creators. Our AI creates authentic-looking user-generated content 
              that drives real results, scales instantly, and costs a fraction of traditional video production.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <section className="bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works - Detailed Steps */}
        <section className="bg-black py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                From Product Link to Viral Ad in{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  3 Simple Steps
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our AI handles everything from content analysis to final video production. 
                No technical skills required—just results.
              </p>
            </div>

            <div className="space-y-20">
              {steps.map((step, index) => (
                <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-2xl">
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-orange-500 text-sm font-bold mb-1">STEP {step.step}</div>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-lg text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-2">
                          <span className="text-green-400 text-sm">✓</span>
                          <span className="text-gray-300 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visual */}
                  <div className="flex-1 max-w-md">
                    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-orange-500/50 transition-all duration-300">
                      <div className="text-6xl text-center mb-4">{step.icon}</div>
                      <div className="text-center">
                        <div className="w-full h-4 bg-gray-800 rounded-full mb-3">
                          <div 
                            className="h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000"
                            style={{ width: `${(index + 1) * 33.33}%` }}
                          ></div>
                        </div>
                        <p className="text-gray-400 text-sm">Step {index + 1} of 3</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-gray-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                Powered by{' '}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Cutting-Edge AI
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Professional features that rival expensive production teams, all automated and optimized for maximum conversion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <div className="bg-black border border-gray-800 rounded-xl p-8 h-full hover:border-orange-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                    <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center text-2xl mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{feature.name}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-black py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-extrabold text-white mb-6">
                  Why Choose{' '}
                  <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    Best UGC?
                  </span>
                </h2>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">💰</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">90% Cost Reduction</h3>
                      <p className="text-gray-300">Replace expensive UGC creators and production teams. Create unlimited variations for the cost of a single traditional video.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">⚡</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">10x Faster Production</h3>
                      <p className="text-gray-300">From weeks to minutes. Test multiple creative variations instantly and scale what works without delays.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Proven Conversion Rates</h3>
                      <p className="text-gray-300">Our AI uses proven conversion patterns to create content optimized for maximum ROI on social media platforms.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm">🔄</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Unlimited Iterations</h3>
                      <p className="text-gray-300">Test different hooks, avatars, and formats without additional costs. Find your winning creative faster.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">📊</div>
                    <h3 className="text-xl font-bold text-white">Average Results</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Cost Reduction</span>
                      <span className="text-green-400 font-bold">-90%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Time to Market</span>
                      <span className="text-green-400 font-bold">-95%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">ROAS Improvement</span>
                      <span className="text-green-400 font-bold">+340%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Creative Variations</span>
                      <span className="text-orange-400 font-bold">Unlimited</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-orange-500 to-orange-600 py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-white mb-6">
              Ready to Transform Your Marketing?
            </h2>
            <p className="text-xl text-orange-100 mb-8 leading-relaxed">
              Join smart businesses using AI to create high-ROI video ads optimized for social media conversions. 
              Start free and see the difference authentic-looking UGC can make.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/dashboard"
                className="px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Start Creating Videos - Free
              </a>
              <div className="text-orange-100 text-sm">
                ✨ No credit card required • 20 free credits • 2 minutes setup
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
