import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAdCreation } from '../../components/AdCreationContext'

interface ScrapeResult {
  text: string
  images: string[]
  videos: string[]
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
  const [logoUrl, setLogoUrl] = useState(adData.logoUrl || '')

  // Promo info
  const [showPromo, setShowPromo] = useState(adData.showPromo || false)
  const [originalPrice, setOriginalPrice] = useState(adData.originalPrice || '')
  const [promoPrice, setPromoPrice] = useState(adData.promoPrice || '')
  const [promoDetails, setPromoDetails] = useState(adData.promoDetails || '')
  const [promoSuggestions, setPromoSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (router.isReady) {
      const url = (router.query.productUrl as string | undefined) || adData.productUrl || undefined
      setProductUrl(url || null)
      setAdData({ productUrl: url })
    }
    // eslint-disable-next-line
  }, [router.isReady, router.query])

  useEffect(() => {
    const fetchScrape = async () => {
      if (productUrl) {
        setLoading(true)
        setError(null)
        setScrapeResult(null)
        setSummary('')
        setSummaryError(null)
        try {
          const res = await axios.post('/api/scrape', { url: productUrl })
          setScrapeResult(res.data)
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to scrape product page')
        } finally {
          setLoading(false)
        }
      }
    }
    if (productUrl && !adData.summary) fetchScrape()
    // eslint-disable-next-line
  }, [productUrl])

  useEffect(() => {
    const fetchSummary = async () => {
      if (scrapeResult && scrapeResult.text) {
        setSummaryLoading(true)
        setSummaryError(null)
        setSummary('')
        try {
          const res = await axios.post('/api/summarize', { text: scrapeResult.text })
          setSummary(res.data.summary)
          setAdData({ summary: res.data.summary })
        } catch (err: any) {
          setSummaryError(err.response?.data?.error || 'Failed to summarize product')
        } finally {
          setSummaryLoading(false)
        }
      }
    }
    if (scrapeResult && !adData.summary) fetchSummary()
    // eslint-disable-next-line
  }, [scrapeResult])

  // Asset selection logic
  useEffect(() => {
    if (scrapeResult) {
      setSelectedImages(scrapeResult.images)
      setSelectedVideos(scrapeResult.videos)
    }
  }, [scrapeResult])

  useEffect(() => {
    setAdData({
      selectedImages,
      selectedVideos,
      brandName,
      logoUrl,
      summary,
      showPromo,
      originalPrice,
      promoPrice,
      promoDetails,
    })
    // eslint-disable-next-line
  }, [selectedImages, selectedVideos, brandName, logoUrl, summary, showPromo, originalPrice, promoPrice, promoDetails])

  const handleImageSelect = (src: string) => {
    setSelectedImages(prev => prev.includes(src) ? prev.filter(i => i !== src) : [...prev, src])
  }
  const handleVideoSelect = (src: string) => {
    setSelectedVideos(prev => prev.includes(src) ? prev.filter(i => i !== src) : [...prev, src])
  }
  const handleSelectAllImages = () => {
    setSelectedImages([...(scrapeResult?.images || []), ...uploadedImages])
  }
  const handleDeselectAllImages = () => {
    setSelectedImages([])
  }
  const handleSelectAllVideos = () => {
    setSelectedVideos([...(scrapeResult?.videos || []), ...uploadedVideos])
  }
  const handleDeselectAllVideos = () => {
    setSelectedVideos([])
  }

  // Upload handlers (simulate upload by creating object URLs)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedImages(prev => [...prev, ...urls])
      setSelectedImages(prev => [...prev, ...urls])
    }
  }
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedVideos(prev => [...prev, ...urls])
      setSelectedVideos(prev => [...prev, ...urls])
    }
  }

  // Promo suggestions logic
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
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Create Ad - Step 1</h1>
      {productUrl ? (
        <div className="mb-4 text-green-700">Product URL detected: <span className="font-mono">{productUrl}</span><br/>The page will be scraped and summarized.</div>
      ) : (
        <div className="mb-4 text-gray-500">No product URL provided. Start from scratch.</div>
      )}
      {loading && <div className="mb-4 text-blue-600">Scraping product page...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {scrapeResult && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Scraped Product Description</h2>
          <textarea className="w-full border rounded p-2 mb-4" rows={5} value={scrapeResult.text} readOnly />
        </div>
      )}
      {scrapeResult && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">AI Product Summary</h2>
          {summaryLoading && <div className="mb-2 text-blue-600">Generating summary...</div>}
          {summaryError && <div className="mb-2 text-red-600">{summaryError}</div>}
          <textarea className="w-full border rounded p-2" rows={4} value={summary} onChange={e => setSummary(e.target.value)} maxLength={1000} placeholder="Summary will appear here..." />
        </div>
      )}
      {/* Brand/Product Name & Logo */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Add media and product details</h2>
        <div className="mb-2">
          <label className="block font-medium mb-1">Brand / Product name</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. AeroFlow hårføner – Blå" />
        </div>
        <div className="mb-2">
          <label className="block font-medium mb-1">Logo (URL)</label>
          <input type="text" className="border rounded px-3 py-2 w-full" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="Paste logo image URL here" />
          {logoUrl && <img src={logoUrl} alt="Logo" className="mt-2 h-12" />}
        </div>
        <div className="mb-2">
          <label className="block font-medium mb-1">Product description</label>
          <textarea className="w-full border rounded p-2" rows={4} value={summary} onChange={e => setSummary(e.target.value)} maxLength={1000} placeholder="Describe your product" />
          <div className="text-right text-xs text-gray-500">{summary.length}/1000</div>
        </div>
      </div>
      {/* Asset selection */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Assets</h2>
        <div className="mb-2 text-sm text-gray-500">Confirm the assets you want to use. Higher-quality clips and images result in better results.</div>
        <div className="flex gap-4 mb-2">
          <button className="px-2 py-1 border rounded text-xs" onClick={handleSelectAllImages}>Select all images</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={handleDeselectAllImages}>Deselect all images</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={handleSelectAllVideos}>Select all videos</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={handleDeselectAllVideos}>Deselect all videos</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {[...(scrapeResult?.images || []), ...uploadedImages].map((src, i) => (
            <div key={i} className={`border rounded p-1 ${selectedImages.includes(src) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleImageSelect(src)}>
              <img src={src} alt="Asset" className="w-20 h-20 object-cover cursor-pointer" />
            </div>
          ))}
          <button className="border rounded p-1 w-20 h-20 flex items-center justify-center bg-gray-100 cursor-pointer" onClick={() => imageInputRef.current?.click()}>
            Upload
            <input type="file" accept="image/*" multiple hidden ref={imageInputRef} onChange={handleImageUpload} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {[...(scrapeResult?.videos || []), ...uploadedVideos].map((src, i) => (
            <div key={i} className={`border rounded p-1 ${selectedVideos.includes(src) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => handleVideoSelect(src)}>
              <video src={src} controls className="w-32 h-20 object-cover cursor-pointer" />
            </div>
          ))}
          <button className="border rounded p-1 w-32 h-20 flex items-center justify-center bg-gray-100 cursor-pointer" onClick={() => videoInputRef.current?.click()}>
            Upload
            <input type="file" accept="video/*" multiple hidden ref={videoInputRef} onChange={handleVideoUpload} />
          </button>
        </div>
      </div>
      {/* Promo info */}
      <div className="mb-6">
        <label className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={showPromo} onChange={e => setShowPromo(e.target.checked)} />
          <span className="font-medium">Promotional info</span>
        </label>
        {showPromo && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Original price</label>
              <input type="text" className="border rounded px-3 py-2 w-full" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promo price</label>
              <input type="text" className="border rounded px-3 py-2 w-full" value={promoPrice} onChange={e => setPromoPrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promotion details</label>
              <input type="text" className="border rounded px-3 py-2 w-full" value={promoDetails} onChange={e => setPromoDetails(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {promoSuggestions.map((s, i) => (
                <button key={i} className="px-2 py-1 border rounded text-xs bg-gray-100 hover:bg-blue-100" type="button" onClick={() => setPromoDetails(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button className="mt-8 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => router.push('/ad/format')}>Continue</button>
    </div>
  )
} 