import { useRouter } from 'next/router'
import { useState, useEffect, useCallback } from 'react'
import { useAdCreation } from '../../components/AdCreationContext'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import Spinner from '../../components/Spinner'

const formatOptions = [
  { label: '16:9', value: '16:9', disabled: true, comingSoon: true },
  { label: '9:16', value: '9:16', disabled: false },
  { label: '4:5', value: '4:5', disabled: false },
  { label: '1:1', value: '1:1', disabled: true, comingSoon: true },
]
const durationOptions = [15, 30, 60]
const languageOptions = [
  { label: 'English', value: 'en', flag: '/assets/flags-new/us.png' },
  { label: 'Norwegian', value: 'no', flag: '/assets/flags-new/no.png' },
  { label: 'Danish', value: 'da', flag: '/assets/flags-new/dk.png' },
  { label: 'Swedish', value: 'sv', flag: '/assets/flags-new/se.png' },
  { label: 'Dutch', value: 'nl', flag: '/assets/flags-new/nl.png' },
]

// Custom SVG components for aspect ratios
const AspectRatioIcon = ({ ratio }: { ratio: string }) => {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  switch (ratio) {
    case '16:9':
      // Horizontal rectangle
      return (
        <svg className="w-10 h-6" viewBox="0 0 40 24" {...commonProps}>
          <rect x="1" y="1" width="38" height="22" rx="5" ry="5"/>
        </svg>
      )
    case '9:16':
      // Vertical rectangle  
      return (
        <svg className="w-6 h-10" viewBox="0 0 24 40" {...commonProps}>
          <rect x="1" y="1" width="22" height="38" rx="5" ry="5"/>
        </svg>
      )
    case '4:5':
      // Square-ish rectangle (slightly taller than wide)
      return (
        <svg className="w-7 h-8" viewBox="0 0 28 32" {...commonProps}>
          <rect x="1" y="1" width="26" height="30" rx="5" ry="5"/>
        </svg>
      )
    case '1:1':
      // Perfect square
      return (
        <svg className="w-8 h-8" viewBox="0 0 32 32" {...commonProps}>
          <rect x="1" y="1" width="30" height="30" rx="5" ry="5"/>
        </svg>
      )
    default:
      return null
  }
}

export default function FormatAd() {
  const router = useRouter()
  const { data: session } = useSession()
  const { adData, setAdData } = useAdCreation()
  const [selectedFormats, setSelectedFormats] = useState<string[]>(
    adData.enableDualFormat && adData.format ? 
      adData.format === '9:16' ? ['9:16', '4:5'] : [adData.format] :
      [adData.format || '9:16']
  )
  const [duration, setDuration] = useState(adData.duration || 15)
  const [language, setLanguage] = useState(adData.language || 'no')
  const [audience, setAudience] = useState(adData.audience || '')
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [formatSelectionOrder, setFormatSelectionOrder] = useState<string[]>([adData.format || '9:16'])

  const [aiAudienceSuggestions, setAiAudienceSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)

  const handleFormatToggle = (formatValue: string) => {
    if (formatValue === '16:9') return // Disabled format
    
    setSelectedFormats(prev => {
      if (prev.includes(formatValue)) {
        // Remove format if already selected, but ensure at least one format remains
        const newFormats = prev.filter(f => f !== formatValue)
        if (newFormats.length > 0) {
          setFormatSelectionOrder(current => current.filter(f => newFormats.includes(f)))
          return newFormats
        }
        return prev
      } else {
        // Check if adding this format would require dual format (15 credits)
        const wouldBeDualFormat = prev.length >= 1
        if (wouldBeDualFormat && (userCredits === null || userCredits < 15)) {
          // Insufficient credits for dual format - replace oldest selected format
          const oldestFormat = formatSelectionOrder[0]
          const newFormats = prev.filter(f => f !== oldestFormat).concat(formatValue)
          setFormatSelectionOrder([formatValue])
          return newFormats
        } else {
          // Add format
          setFormatSelectionOrder(current => [...current, formatValue])
          return [...prev, formatValue]
        }
      }
    })
  }

  const fetchUserCredits = useCallback(async () => {
    if (session?.user?.id) {
      try {
        const response = await axios.get('/api/user/credits')
        setUserCredits(response.data.credits || 0)
      } catch (error) {
        console.error('Failed to fetch user credits:', error)
      }
    }
  }, [session?.user?.id])

  const fetchAudienceSuggestions = useCallback(async () => {
    if (adData.summary) {
      setSuggestionsLoading(true)
      setSuggestionsError(null)
      try {
        const response = await axios.post('/api/ai/generate-audience-suggestions', {
          productDescription: adData.summary,
          isAiGenerated: true,
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
    const enableDualFormat = selectedFormats.length > 1
    const primaryFormat = selectedFormats.includes('9:16') ? '9:16' : selectedFormats[0]
    const previewFormat: '9:16' | '4:5' = (primaryFormat === '4:5') ? '4:5' : '9:16'
    
    setAdData({ 
      format: primaryFormat, 
      duration, 
      language, 
      audience,
      enableDualFormat,
      currentPreviewFormat: previewFormat
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormats, duration, language, audience])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserCredits()
    }
    fetchAudienceSuggestions()
  }, [session?.user?.id])

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
          <div className="flex flex-wrap gap-3 mb-4">
            {formatOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-6 py-4 rounded-xl font-normal transition-all duration-200 flex flex-col items-center gap-3 relative min-w-[120px] ${
                  selectedFormats.includes(opt.value) 
                    ? 'bg-gray-900 text-white border border-orange-500' 
                    : opt.disabled 
                      ? 'bg-gray-900 text-gray-500 border border-gray-700 cursor-not-allowed opacity-50'
                      : 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500'
                }`}
                onClick={() => handleFormatToggle(opt.value)}
                type="button"
                disabled={opt.disabled}
              >
                
                {/* Aspect Ratio Icon */}
                <AspectRatioIcon ratio={opt.value} />
                
                {/* Aspect Ratio Label */}
                <span className="text-sm font-semibold">{opt.label}</span>
                
                {opt.comingSoon && (
                  <span className="absolute -top-2 -left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Multiple Format Warning */}
          {selectedFormats.length > 1 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-amber-300">
                  <div className="font-medium text-sm mb-1">Multiple Format Generation - 15 Credits</div>
                  <div className="text-xs space-y-1">
                    <div>• Rendering will take approximately {selectedFormats.length}x longer (up to {selectedFormats.length * 5} minutes)</div>
                    <div>• Only one TTS audio and lipsync processing will be performed</div>
                    <div>• Both videos will appear in your creations once complete</div>
                    <div>• <strong>Cost: 15 credits</strong> (vs 10 credits for single format)</div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* No Credits Warning */}
          {userCredits !== null && userCredits < 10 && (
            <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-red-300">
                  <div className="font-medium text-sm mb-1">Insufficient Credits</div>
                  <div className="text-xs space-y-1">
                    <div>• You have {userCredits || 0} credits, but need at least 10 credits to create a video</div>
                    <div>• Please purchase more credits to continue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Duration</label>
          <div className="flex flex-wrap gap-3">
            {durationOptions.map(opt => (
              <button
                key={opt}
                className={`px-6 py-3 rounded-xl font-normal transition-all duration-200 ${
                  duration === opt 
                    ? 'bg-gray-900 text-white border border-orange-500' 
                    : 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500'
                }`}
                onClick={() => setDuration(opt)}
                type="button"
              >
                {opt === 15 ? '2 scenes' : opt === 30 ? '4 scenes' : '8 scenes'}
              </button>
            ))}
          </div>
          
          {/* Asset count warning for duration */}
          {(() => {
            // Check if asset data is loaded (not just empty arrays from initialization)
            const hasAssetData = adData.selectedImages !== undefined || 
                                 adData.selectedVideos !== undefined || 
                                 adData.selectedBRoll !== undefined;
            
            // Get total number of background assets
            const totalImages = (adData.selectedImages || []).length;
            const totalVideos = (adData.selectedVideos || []).length;
            const totalBRoll = (adData.selectedBRoll || []).length;
            const totalAssets = totalImages + totalVideos + totalBRoll;
            
            // Calculate required scenes for current duration
            // 15s = 2 scenes, 30s = 4 scenes, 60s = 8 scenes
            const requiredScenes = duration === 15 ? 2 : duration === 30 ? 4 : 8;
            const hasEnoughAssets = totalAssets >= requiredScenes;
            
            // Only show warning if data is loaded and user has assets but not enough
            if (hasAssetData && !hasEnoughAssets && totalAssets > 0) {
              return (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-amber-300">
                      <div className="font-medium text-sm mb-1">Insufficient Background Assets for {duration}s Duration</div>
                      <div className="text-xs space-y-1">
                        <div>• You have {totalAssets} background assets, but need {requiredScenes} for a {duration}-second video</div>
                        <div>• {duration === 15 ? '15-second videos use 2 scenes' : duration === 30 ? '30-second videos use 4 scenes' : '60-second videos use 8 scenes'}</div>
                        <div>• Go back to asset selection to add more images or videos</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            
            return null;
          })()}
        </div>

        {/* Language */}
        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Language</label>
          <div className="flex flex-wrap gap-3">
            {languageOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-6 py-3 rounded-xl font-normal transition-all duration-200 flex items-center gap-2 ${
                  language === opt.value 
                    ? 'bg-gray-900 text-white border border-orange-500' 
                    : 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500'
                }`}
                onClick={() => setLanguage(opt.value)}
                type="button"
              >
                <img src={opt.flag} alt={`${opt.label} flag`} className="w-5 h-4 object-cover rounded-sm" />
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
            maxLength={300}
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
                    className="px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 hover:border-orange-500 transition-colors duration-200"
                    style={{ backgroundColor: '#111827' }}
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

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button 
            className="btn-secondary"
            onClick={() => router.push('/ad/create')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Asset Selection
          </button>
          <button 
            className={`btn-primary ${(!audience.trim() || (userCredits !== null && userCredits < 10) || (() => {
              const hasAssetData = adData.selectedImages !== undefined || adData.selectedVideos !== undefined || adData.selectedBRoll !== undefined;
              const totalAssets = (adData.selectedImages || []).length + (adData.selectedVideos || []).length + (adData.selectedBRoll || []).length;
              const requiredScenes = duration === 15 ? 2 : duration === 30 ? 4 : 8;
              return hasAssetData && totalAssets < requiredScenes && totalAssets > 0;
            })()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => router.push('/ad/script')}
            disabled={!audience.trim() || (userCredits !== null && userCredits < 10) || (() => {
              const hasAssetData = adData.selectedImages !== undefined || adData.selectedVideos !== undefined || adData.selectedBRoll !== undefined;
              const totalAssets = (adData.selectedImages || []).length + (adData.selectedVideos || []).length + (adData.selectedBRoll || []).length;
              const requiredScenes = duration === 15 ? 2 : duration === 30 ? 4 : 8;
              return hasAssetData && totalAssets < requiredScenes && totalAssets > 0;
            })()}
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