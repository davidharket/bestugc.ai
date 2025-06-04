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
    <div className="min-h-screen bg-white p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Format Video - Step 2</h1>
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">Video format</label>
        <div className="flex flex-wrap gap-3 mb-2">
          {formatOptions.map(opt => (
            <button
              key={opt.value}
              className={`px-4 py-2 border rounded-[10px] shadow-sm transition-colors ${format === opt.value ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => setFormat(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">Duration</label>
        <div className="flex flex-wrap gap-3 mb-2">
          {durationOptions.map(opt => (
            <button
              key={opt}
              className={`px-4 py-2 border rounded-[10px] shadow-sm transition-colors ${duration === opt ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => setDuration(opt)}
              type="button"
            >
              {opt} sec
            </button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">Language</label>
        <div className="flex flex-wrap gap-3 mb-2">
          {languageOptions.map(opt => (
            <button
              key={opt.value}
              className={`px-4 py-2 border rounded-[10px] shadow-sm transition-colors ${language === opt.value ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-white hover:bg-gray-50'}`}
              onClick={() => setLanguage(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <label htmlFor="audienceInput" className="block font-medium text-gray-700 mb-2">Target audience</label>
        <input
          id="audienceInput"
          type="text"
          className="border border-gray-300 rounded-[10px] shadow-sm px-3 py-2 w-full mb-3 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          value={audience}
          onChange={e => setAudience(e.target.value)}
          placeholder="Describe your target audience or select a suggestion"
        />
        {suggestionsLoading && (
          <div className="flex items-center text-sm text-gray-500">
            <Spinner size="w-4 h-4 mr-2" />
            Loading AI suggestions...
          </div>
        )}
        {suggestionsError && (
          <div className="text-sm text-red-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Error: {suggestionsError}</span>
            <button 
              onClick={fetchAudienceSuggestions} 
              className="ml-3 px-2 py-0.5 text-xs bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aiAudienceSuggestions.map((s, i) => (
              <button
                key={i}
                className="px-3 py-1.5 border rounded-[20px] text-xs bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 transition-colors shadow-sm"
                type="button"
                onClick={() => setAudience(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length === 0 && !adData.summary && (
          <p className="text-sm text-gray-400">Provide a product summary in the previous step for AI audience suggestions.</p>
        )}
        {!suggestionsLoading && !suggestionsError && aiAudienceSuggestions.length === 0 && adData.summary && (
          <p className="text-sm text-gray-400">No AI suggestions available at the moment. Try a different product description or retry.</p>
        )}
      </div>
      <button 
        className="w-full mt-8 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-[20px] shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60"
        onClick={() => router.push('/ad/script')}
        disabled={!audience.trim()}
      >
        Next
      </button>
    </div>
  )
} 