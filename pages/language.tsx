// pages/language.tsx

const languages = [
  { name: 'English', code: 'en', flag: 'us' },
  { name: 'Spanish', code: 'es', flag: 'es' },
  { name: 'French', code: 'fr', flag: 'fr' },
  { name: 'German', code: 'de', flag: 'de' },
  { name: 'Italian', code: 'it', flag: 'it' },
  { name: 'Portuguese', code: 'pt', flag: 'pt' },
  { name: 'Dutch', code: 'nl', flag: 'nl' },
  { name: 'Polish', code: 'pl', flag: 'pl' },
  { name: 'Russian', code: 'ru', flag: 'ru' },
  { name: 'Japanese', code: 'ja', flag: 'jp' },
  { name: 'Korean', code: 'ko', flag: 'kr' },
  { name: 'Chinese', code: 'zh', flag: 'cn' },
  { name: 'Arabic', code: 'ar', flag: 'sa' },
  { name: 'Hindi', code: 'hi', flag: 'in' },
  { name: 'Swedish', code: 'sv', flag: 'se' },
  { name: 'Norwegian', code: 'no', flag: 'no' },
  { name: 'Danish', code: 'da', flag: 'dk' },
  { name: 'Finnish', code: 'fi', flag: 'fi' },
  { name: 'Turkish', code: 'tr', flag: 'tr' },
  { name: 'Greek', code: 'el', flag: 'gr' },
  { name: 'Hebrew', code: 'he', flag: 'il' },
  { name: 'Czech', code: 'cs', flag: 'cz' },
  { name: 'Hungarian', code: 'hu', flag: 'hu' },
  { name: 'Romanian', code: 'ro', flag: 'ro' },
  { name: 'Bulgarian', code: 'bg', flag: 'bg' },
  { name: 'Croatian', code: 'hr', flag: 'hr' },
  { name: 'Slovak', code: 'sk', flag: 'sk' },
  { name: 'Ukrainian', code: 'uk', flag: 'ua' },
  { name: 'Indonesian', code: 'id', flag: 'id' },
  { name: 'Malay', code: 'ms', flag: 'my' },
  { name: 'Thai', code: 'th', flag: 'th' },
  { name: 'Vietnamese', code: 'vi', flag: 'vn' },
  { name: 'Filipino', code: 'fil', flag: 'ph' },
  { name: 'Bengali', code: 'bn', flag: 'bd' },
  { name: 'Tamil', code: 'ta', flag: 'in' }
];

const features = [
  {
    title: 'Native Voice Generation',
    description: 'AI-powered text-to-speech that sounds natural in every language with proper pronunciation and intonation.',
    icon: 'ai-start'
  },
  {
    title: 'Cultural Adaptation', 
    description: 'Scripts are automatically adapted to cultural contexts and local market preferences for maximum impact.',
    icon: 'star'
  },
  {
    title: 'Real-time Translation',
    description: 'Instantly translate your product descriptions and scripts while maintaining marketing effectiveness.',
    icon: 'success'
  }
];

export default function LanguagePage() {
  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-[20px] mb-8" style={{ backgroundColor: '#111827' }}>
            <span className="text-orange-400 text-sm font-normal">35+ Languages Supported</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-semibold text-white mb-6 leading-tight">
            Create Videos in{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
              Any Language
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-12">
            Reach global audiences with native-quality video content. Our AI creates authentic UGC videos 
            in 35+ languages with proper pronunciation, cultural context, and local market appeal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/dashboard" className="btn-primary px-8 py-4 w-48">
              Start Creating
            </a>
            <a href="#languages" className="btn-secondary px-8 py-4 w-48">
              View Languages
            </a>
          </div>
        </div>
      </div>

      {/* Languages Grid */}
      <section className="bg-black py-20" id="languages" style={{ backgroundColor: '#111827' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-4">
              Supported{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #e85a12 0%, #e85a12 100%)' }}>
                Languages
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Create videos in any of these languages with native-quality AI voices and cultural adaptation.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {languages.map((language, index) => (
              <div 
                key={index} 
                className="rounded-[20px] border border-gray-700 p-4 hover:border-orange-500/50 transition-all duration-300 hover:scale-105 bg-black group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={`/assets/flags-new/${language.flag}.png`} 
                    alt={language.name}
                    className="w-8 h-6 rounded object-cover"
                  />
                  <div>
                    <div className="text-white font-medium text-sm group-hover:text-orange-400 transition-colors">
                      {language.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {language.code.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">35+</div>
              <div className="text-gray-400">Languages Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">150+</div>
              <div className="text-gray-400">AI Voices Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">99%</div>
              <div className="text-gray-400">Native Quality Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-semibold text-white mb-6">
            Ready to Go Global?
          </h2>
          <p className="text-lg text-white mb-8 leading-relaxed">
            Create authentic video content in any language and expand your reach to global markets 
            with native-quality AI voices and cultural adaptation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/dashboard"
              className="btn-secondary"
            >
              Start Creating Global Content
            </a>
            <div className="text-white text-sm">
              No credit card required • 20 free credits • All languages included
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}