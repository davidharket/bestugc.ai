import { useRouter } from 'next/router'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import axios from 'axios'
import BarLoader from '../../components/BarLoader'
import SimpleLoader from '../../components/SimpleLoader'
import { imageTemplates, ImageTemplate } from '../../lib/image-templates'

const formatOptions = [
  { label: '21:9', value: '21:9', disabled: false },
  { label: '16:9', value: '16:9', disabled: false },
  { label: '4:3', value: '4:3', disabled: false },
  { label: '1:1', value: '1:1', disabled: false },
  { label: '3:4', value: '3:4', disabled: false },
  { label: '9:16', value: '9:16', disabled: false },
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
    case '21:9':
      return (
        <svg className="w-12 h-5" viewBox="0 0 48 20" {...commonProps}>
          <rect x="1" y="1" width="46" height="18" rx="4" ry="4"/>
        </svg>
      )
    case '16:9':
      return (
        <svg className="w-10 h-6" viewBox="0 0 40 24" {...commonProps}>
          <rect x="1" y="1" width="38" height="22" rx="5" ry="5"/>
        </svg>
      )
    case '4:3':
      return (
        <svg className="w-8 h-6" viewBox="0 0 32 24" {...commonProps}>
          <rect x="1" y="1" width="30" height="22" rx="4" ry="4"/>
        </svg>
      )
    case '1:1':
      return (
        <svg className="w-8 h-8" viewBox="0 0 32 32" {...commonProps}>
          <rect x="1" y="1" width="30" height="30" rx="5" ry="5"/>
        </svg>
      )
    case '3:4':
      return (
        <svg className="w-6 h-8" viewBox="0 0 24 32" {...commonProps}>
          <rect x="1" y="1" width="22" height="30" rx="4" ry="4"/>
        </svg>
      )
    case '9:16':
      return (
        <svg className="w-6 h-10" viewBox="0 0 24 40" {...commonProps}>
          <rect x="1" y="1" width="22" height="38" rx="5" ry="5"/>
        </svg>
      )
    default:
      return null
  }
}

const PremiumFeatureBlock = () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8 bg-gray-900 border border-orange-500/30 rounded-[20px]">
        <img src="/lock-feature.svg" alt="Premium Feature" className="w-16 h-16 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-3">Premium Feature</h1>
        <p className="text-gray-400 mb-8">
          The AI Image Generation pipeline is an exclusive feature for our Pro and Premium subscribers. Upgrade your plan to create stunning product images.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/subscription" className="btn-primary">
            Upgrade to Pro
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

const TEMPLATES_PER_PAGE = 20;

export default function ImageFormat() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [selectedFormat, setSelectedFormat] = useState<string>('16:9')
  const [selectedTemplate, setSelectedTemplate] = useState<ImageTemplate | null>(null)
  const [imageFilter, setImageFilter] = useState<'all' | 'product-focus' | 'avatar-holding'>('all')
  const [sceneDescription, setSceneDescription] = useState('')
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [enhancedDescription, setEnhancedDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string | null, status?: string, taskId?: string}>>([])
  const [selectedImageId, setSelectedImageId] = useState('')
  const [fadingImages, setFadingImages] = useState<Set<string>>(new Set())
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number | null>(null)

  // Infinite scroll states
  const [displayedTemplates, setDisplayedTemplates] = useState<ImageTemplate[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreTemplates, setHasMoreTemplates] = useState(true)
  const initializedRef = useRef(false)
  
  const hasPremiumAccess = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM'

  // Initialize templates on load - with persistence check
  useEffect(() => {
    if (initializedRef.current || displayedTemplates.length > 0) return
    initializedRef.current = true

    const savedState = sessionStorage.getItem('imageTemplatesState')
    if (savedState) {
      try {
        const { displayedCount, currentPageNumber } = JSON.parse(savedState)
        if (displayedCount > 0 && displayedCount <= imageTemplates.length) {
          console.log('Restoring templates state:', { displayedCount, currentPageNumber })
          const restoredTemplates = imageTemplates.slice(0, displayedCount)
          setDisplayedTemplates(restoredTemplates)
          setCurrentPage(currentPageNumber)
          setHasMoreTemplates(displayedCount < imageTemplates.length)
          return
        }
      } catch (e) {
        console.warn('Failed to restore templates state:', e)
      }
    }

    console.log('Loading initial templates')
    loadInitialTemplates()
  }, []) 

  useEffect(() => {
    if (displayedTemplates.length > 0) {
      sessionStorage.setItem('imageTemplatesState', JSON.stringify({
        displayedCount: displayedTemplates.length,
        currentPageNumber: currentPage
      }))
    }
  }, [displayedTemplates.length, currentPage])

  // Filter templates based on selected filter
  const getFilteredTemplates = useCallback(() => {
    if (imageFilter === 'all') return imageTemplates
    
    return imageTemplates.filter(template => {
      const filename = template.filename.toLowerCase()
      const description = template.description.toLowerCase()
      
      if (imageFilter === 'avatar-holding') {
        // Exclude specific product-only images
        const excludedImages = [
          'acandeloro_A_photo_of_a_luxurious_amber-colored_hand_cream_bott_97f6bf57-bb39-4631-9eb4-b9d0373a3bf9.png',
          'chars_62968_a_tube_of_hand_cream_placed_on_a_rustic_wooden_tabl_fa105895-7f15-488d-a5fc-2e265da84c2b.png',
          'matthewsnyman_3_floating_tall_drinks_in_cans_above_a_forest_gla_c87d5191-448c-48d7-af17-9a16a3e4e98f.png'
        ]
        
        // Include specific avatar holding images
        const includedImages = [
          'mariremer_58706_A_mockup_of_an_all-white_care_bottle_with_no_la_265817dd-ed31-4465-90c9-10f7a0d7d0b9.png',
          'ctdcmn1710_a_sleek_black_pump_bottle_of_mens_cleansing_mousse_l_586c2994-bb1f-4434-a563-a1ad120f6e19.png',
          'joshvial9689_athletic_lower_body_only_legs_crossed_behind_formi_7da94935-847b-45e9-9849-84fb8af008f9.png',
          'aiobe_1111_nathan_close_up_on_poster_mockup_of_a_hipster_guy_ho_b86a6a1c-834e-46f3-8bdd-b394c1e95c5a.png',
          'midlabel_Product_photography_white_body_lotion_in_the_middle_of_ec9622d8-3d94-4401-aead-39480f655a33.png'
        ]
        
        if (excludedImages.includes(template.filename)) {
          return false
        }
        
        if (includedImages.includes(template.filename)) {
          return true
        }
        
        return (
          filename.includes('holding') || 
          filename.includes('hand') ||
          filename.includes('woman') ||
          filename.includes('man') ||
          filename.includes('person') ||
          filename.includes('model') ||
          filename.includes('upper body') ||
          filename.includes('portrait') ||
          description.includes('person showcasing') ||
          description.includes('hand holding') ||
          description.includes('woman') ||
          description.includes('man') ||
          description.includes('model')
        )
      } else if (imageFilter === 'product-focus') {
        return !(
          filename.includes('holding') || 
          filename.includes('hand') ||
          filename.includes('woman') ||
          filename.includes('man') ||
          filename.includes('person') ||
          filename.includes('model') ||
          filename.includes('upper body') ||
          filename.includes('portrait') ||
          description.includes('person showcasing') ||
          description.includes('hand holding') ||
          description.includes('woman') ||
          description.includes('man') ||
          description.includes('model')
        )
      }
      
      return true
    })
  }, [imageFilter])

  const loadInitialTemplates = useCallback(() => {
    const filteredTemplates = getFilteredTemplates()
    const initialBatch = filteredTemplates.slice(0, TEMPLATES_PER_PAGE)
    setDisplayedTemplates(initialBatch)
    setCurrentPage(1)
    setHasMoreTemplates(filteredTemplates.length > TEMPLATES_PER_PAGE)
  }, [getFilteredTemplates])

  const loadMoreTemplates = useCallback(() => {
    if (isLoadingMore || !hasMoreTemplates) return

    setIsLoadingMore(true)

    setTimeout(() => {
      const filteredTemplates = getFilteredTemplates()
      const startIndex = currentPage * TEMPLATES_PER_PAGE
      const endIndex = startIndex + TEMPLATES_PER_PAGE
      const newTemplates = filteredTemplates.slice(startIndex, endIndex)

      if (newTemplates.length === 0) {
        setHasMoreTemplates(false)
      } else {
        setDisplayedTemplates(prev => [...prev, ...newTemplates])
        setCurrentPage(prev => prev + 1)
        setHasMoreTemplates(endIndex < filteredTemplates.length)
      }

      setIsLoadingMore(false)
    }, 300)
  }, [currentPage, isLoadingMore, hasMoreTemplates, getFilteredTemplates])

  // Reset templates when filter changes
  useEffect(() => {
    loadInitialTemplates()
  }, [imageFilter, loadInitialTemplates])


  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/images/format'))
      return
    }

    if (session) {
      fetchUserCredits()
    }
  }, [status, session, router])

  const fetchUserCredits = async () => {
    if (session?.user?.id) {
      try {
        const response = await axios.get('/api/user/credits')
        setUserCredits(response.data.credits || 0)
      } catch (error) {
        console.error('Failed to fetch user credits:', error)
      }
    }
  }

  const templatesToShow = displayedTemplates

  useEffect(() => {
    if (aiEnhanced && sceneDescription.trim() && userCredits !== null && userCredits >= 5) {
      const enhanceDescription = async () => {
        try {
          const description = selectedTemplate
            ? `Replace the existing product in this template with the uploaded product: ${sceneDescription}`
            : sceneDescription

          const response = await axios.post('/api/ai/enhance-scene-description', {
            description,
            templateImage: selectedTemplate ? `/image-inspo/${selectedTemplate.filename}` : undefined,
            imageFilter: imageFilter
          })

          const enhanced = response.data.enhancedDescription
          if (enhanced && enhanced.length <= 1000) {
            setEnhancedDescription(enhanced)
            setUserCredits(prev => prev !== null ? prev - 5 : null)
          }
        } catch (error: any) {
          console.error('Error enhancing description:', error)
        }
      }

      const timeoutId = setTimeout(enhanceDescription, 1000)
      return () => clearTimeout(timeoutId)
    } else if (!aiEnhanced) {
      setEnhancedDescription('')
    }
  }, [aiEnhanced, sceneDescription, selectedTemplate, userCredits])

  const handleFormatSelect = (formatValue: string) => {
    setSelectedFormat(formatValue)
  }

  const handleTemplateSelect = (template: ImageTemplate) => {
    const templateImage = {
      id: `template-${Date.now()}`,
      url: `/image-inspo/${template.filename}`,
      status: 'COMPLETED'
    }

    sessionStorage.setItem('selectedSceneImage', JSON.stringify(templateImage))
    sessionStorage.setItem('sceneDescription', `Use this template style for the product placement: ${template.description}`)
    sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
    sessionStorage.setItem('imageFormat', '16:9') // Default format
    sessionStorage.setItem('aiEnhanced', 'false')
    sessionStorage.setItem('enhancedDescription', '')
    sessionStorage.removeItem('imageTemplatesState')

    router.push('/images/product')
  }

  const handleImageLoad = (imageId: string) => {
    setFadingImages(prev => {
      const newSet = new Set(prev)
      newSet.add(imageId)
      return newSet
    })
  }

  const handleParticleFadeComplete = (imageId: string) => {
    setFadingImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  const generateSceneImages = async () => {
    if (!sceneDescription.trim() || userCredits === null || userCredits < 5 || sceneDescription.length > 1000) {
      return
    }

    setIsGenerating(true)
    try {
      // First, deduct credits
      try {
        const creditResponse = await axios.post('/api/user/deduct-credits', {
          credits: 5,
          reason: 'Product image generation with template'
        })

        if (!creditResponse.data.success) {
          setIsGenerating(false)
          return
        }

        setUserCredits(prev => prev !== null ? prev - 5 : null)
      } catch (error: any) {
        console.error('Error deducting credits:', error)
        setIsGenerating(false)
        return
      }

      const descriptionToSend = aiEnhanced && enhancedDescription ? enhancedDescription : sceneDescription

      const requestData = {
        description: descriptionToSend,
        aspectRatio: selectedFormat,
        count: 4,
        templateImage: selectedTemplate ? `/image-inspo/${selectedTemplate.filename}` : undefined
      }

      const response = await axios.post('/api/runway/generate-scene-images', requestData)

      if (response.data.images) {
        setGeneratedImages(response.data.images)

        if (response.data.status === 'PROCESSING') {
          pollImageStatus(response.data.images.map((img: any) => img.taskId))
        } else {
          setIsGenerating(false)
        }
      }
    } catch (error: any) {
      console.error('Error generating images:', error)
      setIsGenerating(false)
    }
  }

  const pollImageStatus = async (taskIds: string[]) => {
    let attempts = 0
    const maxAttempts = 60

    const poll = async () => {
      attempts++

      try {
        const response = await axios.post('/api/runway/check-image-status', {
          taskIds
        })

        setGeneratedImages(prevImages => {
          const newImages = response.data.images
          const hasChanged = newImages.some((newImg: any, index: number) => {
            const prevImg = prevImages[index]
            return !prevImg || prevImg.url !== newImg.url || prevImg.status !== newImg.status
          })

          return hasChanged ? newImages : prevImages
        })

        if (response.data.status === 'COMPLETED' || response.data.status === 'FAILED' || attempts >= maxAttempts) {
          setIsGenerating(false)
          return
        } else {
          setTimeout(poll, 5000)
        }
      } catch (error: any) {
        console.error('Error checking status:', error)
        if (attempts >= maxAttempts) {
          setIsGenerating(false)
        } else {
          setTimeout(poll, 5000)
        }
      }
    }

    poll()
  }

  const handleContinue = () => {
    if (!selectedImageId) {
      return
    }

    const selectedImage = generatedImages.find(img => img.id === selectedImageId)
    if (selectedImage) {
      sessionStorage.removeItem('imageTemplatesState')
      sessionStorage.setItem('selectedSceneImage', JSON.stringify(selectedImage))
      sessionStorage.setItem('sceneDescription', sceneDescription)
      sessionStorage.setItem('enhancedDescription', enhancedDescription || '')
      sessionStorage.setItem('aiEnhanced', aiEnhanced.toString())
      sessionStorage.setItem('imageFormat', selectedFormat)
      sessionStorage.setItem('selectedTemplate', selectedTemplate ? JSON.stringify(selectedTemplate) : '')
      router.push('/images/product')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    )
  }
  
  if (status === 'authenticated' && !hasPremiumAccess) {
    return <PremiumFeatureBlock />;
  }

  const canGenerate = userCredits !== null && userCredits >= 5

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose a template</h1>
          <p className="text-gray-400">Choose a template, select format, and describe your scene</p>
        </div>

        {/* Image Type Filter */}
        <div className="bg-gray-900 border border-gray-800 rounded-[20px] p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filter Templates</h2>
          <div>
            <label className="block text-gray-300 font-normal mb-3">Image Type</label>
            <div className="flex gap-2 flex-wrap">
              <button
                className={`px-4 py-2 rounded-xl text-sm font-normal border transition-colors ${
                  imageFilter === 'product-focus'
                    ? 'border-orange-500 text-orange-500'
                    : 'hover:border-orange-500'
                }`}
                style={{ backgroundColor: '#111827' }}
                onClick={() => setImageFilter(imageFilter === 'product-focus' ? 'all' : 'product-focus')}
                type="button"
              >
                Product Focus
              </button>
              <button
                className={`px-4 py-2 rounded-xl text-sm font-normal border transition-colors ${
                  imageFilter === 'avatar-holding'
                    ? 'border-orange-500 text-orange-500'
                    : 'hover:border-orange-500'
                }`}
                style={{ backgroundColor: '#111827' }}
                onClick={() => setImageFilter(imageFilter === 'avatar-holding' ? 'all' : 'avatar-holding')}
                type="button"
              >
                Avatar Holding
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {templatesToShow.map((template) => (
              <div key={template.filename} className="break-inside-avoid">
                <div
                  className={`relative group rounded-[15px] overflow-hidden transition-all duration-200 ${
                    selectedTemplate?.filename === template.filename
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25'
                      : 'border border-gray-700 hover:border-orange-500/50'
                  }`}
                >
                  <img
                    src={`/image-inspo/${template.filename}`}
                    alt={template.description}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="btn-secondary px-4 py-2 text-sm font-normal transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                  {selectedTemplate?.filename === template.filename && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center py-8">
            {hasMoreTemplates ? (
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={loadMoreTemplates}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <BarLoader size="xs" />
                    Loading More...
                  </>
                ) : (
                  <>
                    Load More Templates
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            ) : templatesToShow.length > 0 ? (
              <div className="text-gray-500 text-sm">
                All {imageFilter === 'all' ? 'templates' : imageFilter === 'product-focus' ? 'product focus templates' : 'avatar holding templates'} loaded ({templatesToShow.length} total)
              </div>
            ) : imageFilter !== 'all' ? (
              <div className="text-gray-500 text-sm">
                No {imageFilter === 'product-focus' ? 'product focus' : 'avatar holding'} templates found
              </div>
            ) : null}
          </div>

          {selectedTemplate && (
            <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[15px]">
              <div className="flex items-start gap-3">
                <div className="bg-orange-500 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-orange-400 font-medium text-sm">Template Selected</p>
                  <p className="text-gray-300 text-sm">{selectedTemplate.description}</p>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-orange-400 hover:text-orange-300 text-sm mt-1 transition-colors"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Image format</label>
          <div className="flex flex-wrap gap-3 mb-4">
            {formatOptions.map(opt => (
              <button
                key={opt.value}
                className={`px-6 py-4 rounded-xl font-normal transition-all duration-200 flex flex-col items-center gap-3 relative min-w-[120px] ${
                  selectedFormat === opt.value
                    ? 'bg-gray-900 text-white border border-orange-500'
                    : opt.disabled
                      ? 'bg-gray-900 text-gray-500 border border-gray-700 cursor-not-allowed opacity-50'
                      : 'bg-gray-900 text-gray-300 border border-gray-700 hover:border-orange-500'
                }`}
                onClick={() => handleFormatSelect(opt.value)}
                type="button"
                disabled={opt.disabled}
              >
                <AspectRatioIcon ratio={opt.value} />
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-8">
          <label className="block text-xl font-semibold text-white mb-4">Scene Description</label>
          <textarea
            className="input w-full min-h-[120px] mb-4"
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            placeholder={selectedTemplate
              ? "Describe how you want your product integrated into this template scene"
              : "Describe the scene for your product, e.g., 'A modern minimalist kitchen with marble countertops and soft natural lighting'"
            }
            maxLength={1000}
          />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{sceneDescription.length}/1000 characters</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aiEnhanced"
                  checked={aiEnhanced}
                  onChange={(e) => setAiEnhanced(e.target.checked)}
                  className="sr-only"
                />
                <label htmlFor="aiEnhanced" className="flex items-center cursor-pointer">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                    aiEnhanced
                      ? 'bg-orange-500 border-orange-500'
                      : 'bg-transparent border-gray-600 hover:border-orange-500'
                  }`}>
                    {aiEnhanced && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 text-white">AI-Enhanced</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              className={`btn-primary ${
                !canGenerate || !sceneDescription.trim() || isGenerating
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={generateSceneImages}
              disabled={!canGenerate || !sceneDescription.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <BarLoader size="xs" />
                  Generating Images...
                </>
              ) : (
                <>
                  Generate Images
                  <img src="/ai-star.svg" alt="AI" className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-[10px]">
              <img src="/credits.svg" style={{ width: 'auto', height: '15px' }} alt="Credits" />
              <span className="text-white text-sm font-medium">Costs 5 credits</span>
            </div>
          </div>

          {userCredits !== null && userCredits < 5 && (
            <div className="mt-4 bg-red-600/20 border border-red-600/40 rounded-[15px] p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-red-300">
                  <div className="font-medium text-sm mb-1">Insufficient Credits</div>
                  <div className="text-xs space-y-1">
                    <div>You have {userCredits || 0} credits, but need 5 credits to generate images</div>
                    <div>Please purchase more credits to continue</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {generatedImages.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Choose Your Image</h3>
            <div className="grid grid-cols-2 gap-4">
              {generatedImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative rounded-[15px] overflow-hidden group transition-all duration-200 ${
                    selectedImageId === image.id
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25'
                      : 'border border-gray-700 hover:border-orange-500/50'
                  } ${image.url ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => image.url && setSelectedImageId(image.id)}
                >
                  <div className="w-full bg-gray-800 relative overflow-hidden" style={{ aspectRatio: selectedFormat.replace(':', '/') }}>
                    {(!image.url || fadingImages.has(image.id)) && (
                      <div className="absolute inset-0 z-30">
                        <SimpleLoader
                          width={40}
                          fadeOut={fadingImages.has(image.id)}
                          onFadeComplete={() => handleParticleFadeComplete(image.id)}
                        />
                      </div>
                    )}
                    {image.url && (
                      <>
                        <img
                          src={image.url}
                          alt={`Generated ${image.id}`}
                          className="w-full h-full object-cover absolute inset-0 z-10"
                          onLoad={() => handleImageLoad(image.id)}
                        />
                        <button
                          className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors z-20 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullscreenImage(image.url!)
                          }}
                          title="View fullscreen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {selectedImageId === image.id && image.url && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            className="btn-secondary"
            onClick={() => {
              sessionStorage.removeItem('imageTemplatesState')
              router.push('/dashboard')
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <button
            className={`btn-primary ${
              !selectedImageId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleContinue}
            disabled={!selectedImageId}
          >
            Complete & View Gallery
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={fullscreenImage}
              alt="Fullscreen view"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-[20px]"
            />
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setFullscreenImage(null)
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
