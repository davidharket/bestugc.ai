import { useRouter } from 'next/router'
import { useState, useEffect, useCallback } from 'react'
import { useAdCreation } from '../../components/AdCreationContext'
import axios from 'axios'
import Spinner from '../../components/Spinner'

const formatOptions = [
  { label: 'Landscape (16:9)', value: '16:9' },
  { label: 'Portrait (9:16)', value: '9:16' },
]
const durationOptions = [15, 30, 60]
const languageOptions = [
  { label: 'Norwegian', value: 'no' },
  { label: 'Danish', value: 'da' },
  { label: 'Swedish', value: 'sv' },
  { label: 'English', value: 'en' },
]

export default function FormatAd() {
  const router = useRouter()
  const { adData, setAdData } = useAdCreation()
  const [format, setFormat] = useState(adData.format || '16:9')
  const [duration, setDuration] = useState(adData.duration || 15)
  const [language, setLanguage] = useState(adData.language || 'en')
  const [audience, setAudience] = useState(adData.audience || '')

  const [aiAudienceSuggestions, setAiAudienceSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)

  const fetchAudienceSuggestions = useCallback(async () => {
    if (adData.summary) {
      setSuggestionsLoading(true)
      setSuggestionsError(null)
      try {
        const response = await axios.post('/api/ai/generate-audience-suggestions', {
          productDescription: adData.summary,
        })
        setAiAudienceSuggestions(response.data.suggestions || [])
      } catch (err: any) {
        setSuggestionsError(err.response?.data?.error || 'Failed to load AI audience suggestions.')
        setAiAudienceSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }
  }, [adData.summary])

  useEffect(() => {
    setAdData({ format, duration, language, audience })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, duration, language, audience])

  useEffect(() => {
    fetchAudienceSuggestions()
  }, [fetchAudienceSuggestions])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Format Video - Step 2</h1>
          <p className="text-gray-400">Choose your video format, duration, and target audience</p>
        </div>

        {/* Video Format */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Video format</label>
          <div className="flex flex-wrap gap-3">
            {formatOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  format === opt.value 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                }`}
                onClick={() => setFormat(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Duration</label>
          <div className="flex flex-wrap gap-3">
            {durationOptions.map(opt => (
              <button
                key={opt}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  duration === opt 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                }`}
                onClick={() => setDuration(opt)}
                type="button"
              >
                {opt} sec
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Language</label>
          <div className="flex flex-wrap gap-3">
            {languageOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  language === opt.value 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-orange-500/50'
                }`}
                onClick={() => setLanguage(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div className="card mb-8">
          <label htmlFor="audienceInput" className="block text-xl font-semibold text-white mb-4">
            Target audience
          </label>
          
          <input
            id="audienceInput"
            type="text"
            className="input w-full mb-4"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="Describe your target audience or select a suggestion"
          />
          
          {/* Loading State */}
          {suggestionsLoading && (
            <div className="flex items-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
              <span className="text-orange-400 text-sm">Loading AI suggestions...</span>
            </div>
          )}
          
          {/* Error State */}
          {suggestionsError && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
              <div className="flex items-center gap-2 text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Error: {suggestionsError}</span>
                <button 
                  onClick={fetchAudienceSuggestions} 
                  className="ml-3 px-3 py-1 text-sm bg-red-800 text-red-200 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          
          {/* AI Suggestions */}
          {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length > 0 && (
            <div>
              <label className="block text-gray-300 font-medium mb-3">AI suggestions</label>
              <div className="flex flex-wrap gap-2">
                {aiAudienceSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-orange-500/50 hover:text-orange-400 transition-all duration-200"
                    type="button"
                    onClick={() => setAudience(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* No Suggestions States */}
          {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length === 0 && !adData.summary && (
            <p className="text-gray-500 text-sm">Provide a product summary in the previous step for AI audience suggestions.</p>
          )}
          {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length === 0 && adData.summary && (
            <p className="text-gray-500 text-sm">No AI suggestions available at the moment. Try a different product description or retry.</p>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button 
            className={`btn-primary ${!audience.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => router.push('/ad/script')}
            disabled={!audience.trim()}
          >
            Continue to Script Generation
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 