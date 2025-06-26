import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAdCreation, AdCreationData } from '../../components/AdCreationContext'

interface ScrapeResult {
  text: string
  images: string[]
  videos: string[]
  productName?: string
  rawProductName?: string
}

export default function CreateAd() {
  const router = useRouter()
  const { adData, setAdData } = useAdCreation()
  const [productUrl, setProductUrl] = useState<string | null>(adData.productUrl || null)
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>(adData.summary || '')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // Asset selection and upload
  const [selectedImages, setSelectedImages] = useState<string[]>(adData.selectedImages || [])
  const [selectedVideos, setSelectedVideos] = useState<string[]>(adData.selectedVideos || [])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Product/brand info
  const [brandName, setBrandName] = useState(adData.brandName || '')

  // Promo info
  const [showPromo, setShowPromo] = useState(adData.showPromo || false)
  const [originalPrice, setOriginalPrice] = useState(adData.originalPrice || '')
  const [promoPrice, setPromoPrice] = useState(adData.promoPrice || '')
  const [promoDetails, setPromoDetails] = useState(adData.promoDetails || '')
  const [promoSuggestions, setPromoSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (router.isReady) {
      const urlFromQuery = router.query.productUrl as string | undefined
      const initialUrl = urlFromQuery || adData.productUrl || null
      setProductUrl(initialUrl)
      if (urlFromQuery) {
        setAdData({ productUrl: urlFromQuery })
      } else if (adData.productUrl && !initialUrl) {
        setAdData({ productUrl: undefined })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.productUrl])

  useEffect(() => {
    const fetchScrape = async () => {
      if (productUrl) {
        setLoading(true)
        setError(null)
        setScrapeResult(null)
        setSummary('')
        setSummaryError(null)
        setSelectedImages([])
        setSelectedVideos([])
        setUploadedImages([])
        setUploadedVideos([])
        // Reset brand name when starting a new scrape
        setBrandName('')
        try {
          const res = await axios.post('/api/scrape', { url: productUrl })
          setScrapeResult(res.data)
          
          // Auto-fill brand name with AI-generated product name
          if (res.data.productName && res.data.productName.trim()) {
            setBrandName(res.data.productName.trim())
          }
          
          if (res.data.images) setSelectedImages(prev => Array.from(new Set([...prev, ...res.data.images])))
          if (res.data.videos) setSelectedVideos(prev => Array.from(new Set([...prev, ...res.data.videos])))
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to scrape product page')
        } finally {
          setLoading(false)
        }
      }
    }

    if (productUrl && (productUrl !== adData.productUrl || !adData.summary)) {
      fetchScrape()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUrl, adData.productUrl, adData.summary])

  useEffect(() => {
    const fetchSummary = async () => {
      if (scrapeResult && scrapeResult.text && !error) {
        setSummaryLoading(true)
        setSummaryError(null)
        try {
          const res = await axios.post('/api/summarize', { text: scrapeResult.text })
          setSummary(res.data.summary)
          setAdData({ summary: res.data.summary, productUrl: productUrl || undefined })
        } catch (err: any) {
          setSummaryError(err.response?.data?.error || 'Failed to summarize product')
          setSummary('')
        } finally {
          setSummaryLoading(false)
        }
      }
    }
    if (scrapeResult && !error) {
      fetchSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrapeResult, error, productUrl])

  useEffect(() => {
    if (scrapeResult) {
      if (scrapeResult.images) setSelectedImages(Array.from(new Set(scrapeResult.images)))
      if (scrapeResult.videos) setSelectedVideos(Array.from(new Set(scrapeResult.videos)))
    }
  }, [scrapeResult])

  useEffect(() => {
    const dataToSet: Partial<AdCreationData> = {
      productUrl: productUrl || undefined,
      summary: summary || undefined,
      selectedImages,
      selectedVideos,
      brandName: brandName || undefined,
      showPromo: Boolean(showPromo),
      originalPrice: originalPrice || undefined,
      promoPrice: promoPrice || undefined,
      promoDetails: promoDetails || undefined,
    }
    setAdData(dataToSet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUrl, summary, selectedImages, selectedVideos, brandName, showPromo, originalPrice, promoPrice, promoDetails])

  const handleImageSelect = (src: string) => {
    setSelectedImages(prev => prev.includes(src) ? prev.filter(i => i !== src) : [...prev, src])
  }
  const handleVideoSelect = (src: string) => {
    setSelectedVideos(prev => prev.includes(src) ? prev.filter(i => i !== src) : [...prev, src])
  }
  const handleSelectAllImages = () => {
    setSelectedImages(Array.from(new Set([...(scrapeResult?.images || []), ...uploadedImages])))
  }
  const handleDeselectAllImages = () => {
    setSelectedImages([])
  }
  const handleSelectAllVideos = () => {
    setSelectedVideos(Array.from(new Set([...(scrapeResult?.videos || []), ...uploadedVideos])))
  }
  const handleDeselectAllVideos = () => {
    setSelectedVideos([])
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedImages(prev => Array.from(new Set([...prev, ...urls])))
      setSelectedImages(prev => Array.from(new Set([...prev, ...urls])))
    }
  }
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedVideos(prev => Array.from(new Set([...prev, ...urls])))
      setSelectedVideos(prev => Array.from(new Set([...prev, ...urls])))
    }
  }

  useEffect(() => {
    if (showPromo) {
      const suggestions = [
        'Free shipping',
        'New users: 15% off',
        'Double rewards today only',
        'App orders: 20% off',
        'Bundle offers: Free shipping',
      ]
      if (originalPrice && promoPrice) {
        suggestions.unshift(`Now only ${promoPrice} (was ${originalPrice})`)
      }
      setPromoSuggestions(suggestions)
    } else {
      setPromoSuggestions([])
    }
  }, [showPromo, originalPrice, promoPrice])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Ad - Step 1</h1>
          <p className="text-gray-400">Set up your product information and assets</p>
        </div>

        {/* Product URL Status */}
        {productUrl ? (
          <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Product URL:</span>
              <span className="font-mono text-orange-400 break-all">{productUrl}</span>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
                <span className="text-orange-400 text-sm">Scraping page...</span>
              </div>
            )}
            {!loading && !error && scrapeResult && !summaryLoading && summary && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-400 text-sm">✓ Content processed successfully</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
            <span className="text-gray-400 text-sm">No product URL provided. You can start by describing your product below.</span>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
            <div className="text-red-400">
              <strong>Error scraping:</strong> {error}
            </div>
          </div>
        )}

        {/* AI Product Summary */}
        {(productUrl && !error || !productUrl) && (
          <div className="card mb-8">
            <label htmlFor="aiSummaryTextarea" className="block text-xl font-semibold text-white mb-4">
              AI Product Summary
            </label>
            
            {summaryLoading && (
              <div className="flex items-center gap-2 mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-orange-500"></div>
                <span className="text-orange-400 text-sm">Generating summary...</span>
              </div>
            )}
            
            {summaryError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <span className="text-red-400 text-sm">Failed to generate summary: {summaryError}</span>
              </div>
            )}
            
            <textarea 
              id="aiSummaryTextarea"
              className="input w-full"
              rows={summary ? Math.max(4, summary.split('\n').length) : 4} 
              value={summary} 
              onChange={e => {setSummary(e.target.value); setAdData({ summary: e.target.value });}} 
              maxLength={1000} 
              placeholder={productUrl ? (loading ? "Processing URL..." : (scrapeResult ? "Summary will appear here..." : "Enter product URL above to generate summary, or describe your product here.")) : "Describe your product or service here..."}
              disabled={summaryLoading || !!(productUrl && loading)}
            />
            <p className="text-gray-500 text-sm mt-2">Max 1000 characters. This will be used to generate ad scripts.</p>
          </div>
        )}

        {/* Product Details */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">Brand / Product name</label>
              <input 
                type="text" 
                className="input w-full" 
                value={brandName} 
                onChange={e => setBrandName(e.target.value)} 
                placeholder="e.g. AeroFlow hårføner – Blå" 
              />
            </div>
            

            
            <div>
              <label className="block text-gray-300 font-medium mb-2">Product description</label>
              <textarea 
                className="input w-full" 
                rows={4} 
                value={summary} 
                onChange={e => {
                  setSummary(e.target.value);
                  setAdData({ summary: e.target.value });
                }} 
                maxLength={1000} 
                placeholder="Describe your product"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500 text-sm">This description will be used to generate your ad script</span>
                <span className="text-gray-500 text-sm">{summary.length}/1000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assets */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Media Assets</h2>
          <p className="text-gray-400 text-sm mb-6">
            Select the assets you want to use. Higher-quality clips and images result in better results.
          </p>
          
          {/* Asset Control Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              className="btn-secondary text-sm" 
              onClick={handleSelectAllImages}
            >
              Select all images
            </button>
            <button 
              className="btn-secondary text-sm" 
              onClick={handleDeselectAllImages}
            >
              Deselect all images
            </button>
            <button 
              className="btn-secondary text-sm" 
              onClick={handleSelectAllVideos}
            >
              Select all videos
            </button>
            <button 
              className="btn-secondary text-sm" 
              onClick={handleDeselectAllVideos}
            >
              Deselect all videos
            </button>
          </div>
          
          {/* Images */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Images</h3>
            <div className="flex flex-wrap gap-3">
              {[...(scrapeResult?.images || []), ...uploadedImages].map((src, i) => (
                <div 
                  key={i} 
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedImages.includes(src) 
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25' 
                      : 'border border-gray-700 hover:border-orange-500/50'
                  }`}
                  onClick={() => handleImageSelect(src)}
                >
                  <img src={src} alt={`Asset ${i+1}`} className="w-24 h-24 object-cover" />
                  {selectedImages.includes(src) && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              <button 
                className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors" 
                onClick={() => imageInputRef.current?.click()}
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Upload</span>
                <input type="file" accept="image/*" multiple hidden ref={imageInputRef} onChange={handleImageUpload} />
              </button>
            </div>
          </div>
          
          {/* Videos */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Videos</h3>
            <div className="flex flex-wrap gap-3">
              {[...(scrapeResult?.videos || []), ...uploadedVideos].map((src, i) => (
                <div 
                  key={i} 
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                    selectedVideos.includes(src) 
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25' 
                      : 'border border-gray-700 hover:border-orange-500/50'
                  }`}
                  onClick={() => handleVideoSelect(src)}
                >
                  <video src={src} className="w-32 h-20 object-cover" />
                  {selectedVideos.includes(src) && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              <button 
                className="w-32 h-20 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors" 
                onClick={() => videoInputRef.current?.click()}
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Upload</span>
                <input type="file" accept="video/*" multiple hidden ref={videoInputRef} onChange={handleVideoUpload} />
              </button>
            </div>
          </div>
        </div>

        {/* Promotional Information */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <input 
              type="checkbox" 
              id="showPromo"
              checked={showPromo} 
              onChange={e => setShowPromo(e.target.checked)}
              className="w-4 h-4 text-orange-500 bg-gray-800 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
            />
            <label htmlFor="showPromo" className="text-lg font-medium text-white cursor-pointer">
              Add promotional information
            </label>
          </div>
          
          {showPromo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Original price</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={originalPrice} 
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="e.g. $99.99"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Promo price</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={promoPrice} 
                    onChange={e => setPromoPrice(e.target.value)}
                    placeholder="e.g. $79.99"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 font-medium mb-2">Promotion details</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={promoDetails} 
                  onChange={e => setPromoDetails(e.target.value)}
                  placeholder="e.g. Limited time offer - 20% off"
                />
              </div>
              
              {/* Promo Suggestions */}
              {promoSuggestions.length > 0 && (
                <div>
                  <label className="block text-gray-300 font-medium mb-2">Quick suggestions</label>
                  <div className="flex flex-wrap gap-2">
                    {promoSuggestions.map((suggestion, i) => (
                      <button 
                        key={i} 
                        className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-orange-500/50 hover:text-orange-400 transition-all duration-200" 
                        type="button" 
                        onClick={() => setPromoDetails(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <button 
            className="btn-primary"
            onClick={() => router.push('/ad/format')}
          >
            Continue to Format Selection
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 