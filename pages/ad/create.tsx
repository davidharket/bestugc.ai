import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useAdCreation, AdCreationData, OrderedAsset } from '../../components/AdCreationContext'
import imageCompression from 'browser-image-compression'

interface ScrapeResult {
  text: string
  images: string[]
  videos: string[]
  screenshots: string[]
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
  
  // Progress tracking for loading screen
  const [progressStep, setProgressStep] = useState<string>('')
  
  // Track if initial renumbering has been done
  const [initialRenumberingDone, setInitialRenumberingDone] = useState(false)
  // Track if we've initialized assets from context
  const [assetsInitialized, setAssetsInitialized] = useState(false)

  // Asset selection and upload
  const [selectedImages, setSelectedImages] = useState<string[]>(adData.selectedImages || [])
  const [selectedVideos, setSelectedVideos] = useState<string[]>(adData.selectedVideos || [])
  const [selectedBRoll, setSelectedBRoll] = useState<string[]>(adData.selectedBRoll || [])
  const [orderedImages, setOrderedImages] = useState<OrderedAsset[]>(adData.orderedImages || [])
  const [orderedVideos, setOrderedVideos] = useState<OrderedAsset[]>(adData.orderedVideos || [])
  const [orderedBRoll, setOrderedBRoll] = useState<OrderedAsset[]>(adData.orderedBRoll || [])
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const [uploadingVideos, setUploadingVideos] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState<string[]>([])
  const [videoUploadProgress, setVideoUploadProgress] = useState<{[key: string]: number}>({})
  const [imageUploadProgress, setImageUploadProgress] = useState<{[key: string]: number}>({})
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Product/brand info
  const [brandName, setBrandName] = useState(adData.brandName || '')

  // Promo info
  const [showPromo, setShowPromo] = useState(adData.showPromo !== undefined ? adData.showPromo : true)
  const [originalPrice, setOriginalPrice] = useState(adData.originalPrice || '')
  const [promoPrice, setPromoPrice] = useState(adData.promoPrice || '')
  const [promoDetails, setPromoDetails] = useState(adData.promoDetails || '')
  const [promoSuggestions, setPromoSuggestions] = useState<string[]>([])
  
  // B-roll suggestions
  const [bRollSuggestions, setBRollSuggestions] = useState<string[]>([])
  const [bRollLoading, setBRollLoading] = useState(false)
  const [previewingVideo, setPreviewingVideo] = useState<string | null>(null)
  const [previewingImage, setPreviewingImage] = useState<string | null>(null)

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

  // Initialize assets from context data when component loads (e.g., when returning from format page)  
  useEffect(() => {
    if (!assetsInitialized && adData.productUrl && adData.summary) {
      // Restore state from context
      if (adData.selectedImages) setSelectedImages(adData.selectedImages)
      if (adData.selectedVideos) setSelectedVideos(adData.selectedVideos)
      if (adData.selectedBRoll) setSelectedBRoll(adData.selectedBRoll)
      if (adData.orderedImages) setOrderedImages(adData.orderedImages)
      if (adData.orderedVideos) setOrderedVideos(adData.orderedVideos)
      if (adData.orderedBRoll) setOrderedBRoll(adData.orderedBRoll)
      if (adData.summary) setSummary(adData.summary)
      if (adData.brandName) setBrandName(adData.brandName)
      
      // Create a mock scrapeResult so the assets display properly
      const allImages = [...(adData.selectedImages || []), ...uploadedImages]
      const allVideos = [...(adData.selectedVideos || []), ...uploadedVideos]
      if (allImages.length > 0 || allVideos.length > 0) {
        setScrapeResult({
          text: adData.summary || '',
          images: allImages,
          videos: allVideos,
          screenshots: [],
          productName: adData.brandName
        })
      }
      
      // Mark as initialized
      setAssetsInitialized(true)
    }
  }, [adData, assetsInitialized, uploadedImages, uploadedVideos])

  useEffect(() => {
    const fetchScrape = async () => {
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
      // Reset initialization flag for new scrape
      setAssetsInitialized(false)
      
      try {
        // Step 1: Analyzing product page
        setProgressStep('Analyzing product page')
        const res = await axios.post('/api/scrape', { url: productUrl })
        
        // Step 2: Extracting product information
        setProgressStep('Extracting product information')
        // Auto-fill brand name with AI-generated product name
        if (res.data.productName && res.data.productName.trim()) {
          setBrandName(res.data.productName.trim())
        }
        // Give time for users to see the extraction step
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Step 3: Extract images and videos
        setProgressStep('Extract images and videos')
        
        // Start with all assets deselected - user will click to select in order
        const allNewImages = res.data.images || [];
        const allNewVideos = res.data.videos || [];
        const allNewScreenshots = res.data.screenshots || [];
        
        console.log('[CreateAd] Scraper response:', {
          images: allNewImages.length,
          videos: allNewVideos.length,
          screenshots: allNewScreenshots.length,
          screenshotUrls: allNewScreenshots
        });
        
        // Keep selection arrays empty initially
        setSelectedImages([]);
        setSelectedVideos([]);
        
        // Keep ordered arrays empty initially
        setOrderedImages([]);
        setOrderedVideos([]);
        
        // Give time for users to see the media extraction step
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 4: Finding relevant B-roll
        setProgressStep('Finding relevant B-roll')
        try {
          const brollRes = await axios.post('/api/b-roll/suggest', {
            productDescription: res.data.text,
            productName: res.data.productName,
            scrapedText: res.data.text
          })
          setBRollSuggestions(brollRes.data.suggestions || [])
          // Give time to see B-roll step
          await new Promise(resolve => setTimeout(resolve, 800));
        } catch (brollError) {
          console.warn('Failed to fetch B-roll suggestions:', brollError)
          // Don't fail the entire process if B-roll suggestions fail
          await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Step 5: Generate summary
        setProgressStep('Generating summary')
        setSummaryLoading(true)
        try {
          const summaryRes = await axios.post('/api/summarize', { text: res.data.text })
          setSummary(summaryRes.data.summary)
          setAdData({ summary: summaryRes.data.summary, productUrl: productUrl || undefined })
          // Give time to see summary generation
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (summaryErr: any) {
          setSummaryError(summaryErr.response?.data?.error || 'Failed to summarize product')
          setSummary('')
        } finally {
          setSummaryLoading(false)
        }
        
        // Set scrape result after all processing is complete to prevent useEffect conflicts
        setScrapeResult(res.data)
        
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to scrape product page')
      } finally {
        setLoading(false)
        setProgressStep('')
      }
    }

    // Only fetch scrape if:
    // 1. We have a productUrl
    // 2. The URL has changed OR we don't have existing data from this URL
    // 3. We don't already have both scrape result and summary for this URL
    const shouldScrape = productUrl && 
      (productUrl !== adData.productUrl || !adData.summary) &&
      !(scrapeResult && summary && adData.productUrl === productUrl)
    
    if (shouldScrape) {
      fetchScrape()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUrl, adData.productUrl, adData.summary])



  // Helper function to reassign consecutive order numbers starting from 1
  const reassignOrderNumbers = (images: OrderedAsset[], videos: OrderedAsset[], broll: OrderedAsset[] = []) => {
    const allAssets = [...images, ...videos, ...broll].sort((a, b) => a.order - b.order);
    const updatedImages: OrderedAsset[] = [];
    const updatedVideos: OrderedAsset[] = [];
    const updatedBRoll: OrderedAsset[] = [];
    
    allAssets.forEach((asset, index) => {
      const updatedAsset = { ...asset, order: index + 1 }; // Always start from 1
      if (images.some(img => img.url === asset.url)) {
        updatedImages.push(updatedAsset);
      } else if (videos.some(vid => vid.url === asset.url)) {
        updatedVideos.push(updatedAsset);
      } else {
        updatedBRoll.push(updatedAsset);
      }
    });
    
    return { images: updatedImages, videos: updatedVideos, broll: updatedBRoll };
  };

  // Ensure assets are properly numbered when they're first loaded
  useEffect(() => {
    if (!initialRenumberingDone && (orderedImages.length > 0 || orderedVideos.length > 0)) {
      const reassigned = reassignOrderNumbers(orderedImages, orderedVideos, orderedBRoll);
      
      // Check if renumbering is needed
      const needsUpdate = 
        reassigned.images.some((img) => img.order !== orderedImages.find(orig => orig.url === img.url)?.order) ||
        reassigned.videos.some((vid) => vid.order !== orderedVideos.find(orig => orig.url === vid.url)?.order);
      
      if (needsUpdate) {
        setOrderedImages(reassigned.images);
        setOrderedVideos(reassigned.videos);
        setOrderedBRoll(reassigned.broll);
      }
      
      setInitialRenumberingDone(true);
    }
  }, [orderedImages, orderedVideos, initialRenumberingDone]); // Run until initial renumbering is done

  useEffect(() => {
    const dataToSet: Partial<AdCreationData> = {
      productUrl: productUrl || undefined,
      summary: summary || undefined,
      selectedImages,
      selectedVideos,
      selectedBRoll,
      orderedImages,
      orderedVideos,
      orderedBRoll,
      brandName: brandName || undefined,
      showPromo: Boolean(showPromo),
      originalPrice: originalPrice || undefined,
      promoPrice: promoPrice || undefined,
      promoDetails: promoDetails || undefined,
    }
    setAdData(dataToSet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUrl, summary, selectedImages, selectedVideos, selectedBRoll, orderedImages, orderedVideos, orderedBRoll, brandName, showPromo, originalPrice, promoPrice, promoDetails])

  const handleImageSelect = (src: string) => {
    const isSelected = selectedImages.includes(src)
    
    if (isSelected) {
      // Deselect: remove from arrays and renumber all remaining assets consecutively
      const newSelectedImages = selectedImages.filter(i => i !== src);
      const remainingImages = orderedImages.filter(i => i.url !== src);
      
      // Combine all remaining assets and sort by current order
      const allRemainingAssets = [...remainingImages, ...orderedVideos, ...orderedBRoll].sort((a, b) => a.order - b.order);
      
      // Reassign consecutive numbers starting from 1
      const newOrderedImages: OrderedAsset[] = [];
      const newOrderedVideos: OrderedAsset[] = [];
      const newOrderedBRoll: OrderedAsset[] = [];
      
      allRemainingAssets.forEach((asset, index) => {
        const updatedAsset = { ...asset, order: index + 1 };
        if (remainingImages.some(img => img.url === asset.url)) {
          newOrderedImages.push(updatedAsset);
        } else if (orderedVideos.some(vid => vid.url === asset.url)) {
          newOrderedVideos.push(updatedAsset);
        } else {
          newOrderedBRoll.push(updatedAsset);
        }
      });
      
      setSelectedImages(newSelectedImages);
      setOrderedImages(newOrderedImages);
      setOrderedVideos(newOrderedVideos);
      setOrderedBRoll(newOrderedBRoll);
    } else {
      // Select: add to selectedImages and assign next consecutive order number
      const newSelectedImages = [...selectedImages, src];
      const nextOrder = orderedImages.length + orderedVideos.length + orderedBRoll.length + 1;
      const newOrderedImages = [...orderedImages, { url: src, order: nextOrder }];
      
      setSelectedImages(newSelectedImages);
      setOrderedImages(newOrderedImages);
    }
  }
  
  const handleVideoSelect = (src: string) => {
    const isSelected = selectedVideos.includes(src)
    
    if (isSelected) {
      // Deselect: remove from arrays and renumber all remaining assets consecutively
      const newSelectedVideos = selectedVideos.filter(i => i !== src);
      const remainingVideos = orderedVideos.filter(i => i.url !== src);
      
      // Combine all remaining assets and sort by current order
      const allRemainingAssets = [...orderedImages, ...remainingVideos, ...orderedBRoll].sort((a, b) => a.order - b.order);
      
      // Reassign consecutive numbers starting from 1
      const newOrderedImages: OrderedAsset[] = [];
      const newOrderedVideos: OrderedAsset[] = [];
      const newOrderedBRoll: OrderedAsset[] = [];
      
      allRemainingAssets.forEach((asset, index) => {
        const updatedAsset = { ...asset, order: index + 1 };
        if (orderedImages.some(img => img.url === asset.url)) {
          newOrderedImages.push(updatedAsset);
        } else if (remainingVideos.some(vid => vid.url === asset.url)) {
          newOrderedVideos.push(updatedAsset);
        } else {
          newOrderedBRoll.push(updatedAsset);
        }
      });
      
      setSelectedVideos(newSelectedVideos);
      setOrderedImages(newOrderedImages);
      setOrderedVideos(newOrderedVideos);
      setOrderedBRoll(newOrderedBRoll);
    } else {
      // Select: add to selectedVideos and assign next consecutive order number
      const newSelectedVideos = [...selectedVideos, src];
      const nextOrder = orderedImages.length + orderedVideos.length + orderedBRoll.length + 1;
      const newOrderedVideos = [...orderedVideos, { url: src, order: nextOrder }];
      
      setSelectedVideos(newSelectedVideos);
      setOrderedVideos(newOrderedVideos);
    }
  }
  const handleSelectAllImages = () => {
    const allImages = Array.from(new Set([...(scrapeResult?.images || []), ...uploadedImages]))
    setSelectedImages(allImages)
    
    // Create ordered assets preserving existing order, then reassign consecutive numbers
    const newOrderedImages: OrderedAsset[] = []
    
    allImages.forEach((url) => {
      const existingAsset = orderedImages.find(img => img.url === url)
      if (existingAsset) {
        newOrderedImages.push(existingAsset)
      } else {
        // Assign temporary order, will be reassigned below
        newOrderedImages.push({ url, order: 999 })
      }
    })
    
    // Reassign consecutive order numbers
    const reassigned = reassignOrderNumbers(newOrderedImages, orderedVideos, orderedBRoll)
    setOrderedImages(reassigned.images)
    setOrderedVideos(reassigned.videos)
    setOrderedBRoll(reassigned.broll)
  }
  
  const handleDeselectAllImages = () => {
    setSelectedImages([])
    // Reassign order numbers for remaining videos
    const reassigned = reassignOrderNumbers([], orderedVideos, orderedBRoll)
    setOrderedImages([])
    setOrderedVideos(reassigned.videos)
    setOrderedBRoll(reassigned.broll)
  }
  
  const handleSelectAllVideos = () => {
    const allVideos = Array.from(new Set([...(scrapeResult?.videos || []), ...uploadedVideos]))
    setSelectedVideos(allVideos)
    
    // Create ordered assets preserving existing order, then reassign consecutive numbers
    const newOrderedVideos: OrderedAsset[] = []
    
    allVideos.forEach((url) => {
      const existingAsset = orderedVideos.find(vid => vid.url === url)
      if (existingAsset) {
        newOrderedVideos.push(existingAsset)
      } else {
        // Assign temporary order, will be reassigned below
        newOrderedVideos.push({ url, order: 999 })
      }
    })
    
    // Reassign consecutive order numbers
    const reassigned = reassignOrderNumbers(orderedImages, newOrderedVideos, orderedBRoll)
    setOrderedImages(reassigned.images)
    setOrderedVideos(reassigned.videos)
    setOrderedBRoll(reassigned.broll)
  }
  
  const handleDeselectAllVideos = () => {
    setSelectedVideos([])
    // Reassign order numbers for remaining images
    const reassigned = reassignOrderNumbers(orderedImages, [], orderedBRoll)
    setOrderedImages(reassigned.images)
    setOrderedVideos([])
    setOrderedBRoll(reassigned.broll)
  }

  const handleBRollSelect = (src: string) => {
    const isSelected = selectedBRoll.includes(src)
    
    if (isSelected) {
      // Deselect: remove from arrays and renumber all remaining assets consecutively
      const newSelectedBRoll = selectedBRoll.filter(i => i !== src);
      const remainingBRoll = orderedBRoll.filter(i => i.url !== src);
      
      // Combine all remaining assets and sort by current order
      const allRemainingAssets = [...orderedImages, ...orderedVideos, ...remainingBRoll].sort((a, b) => a.order - b.order);
      
      // Reassign consecutive numbers starting from 1
      const newOrderedImages: OrderedAsset[] = [];
      const newOrderedVideos: OrderedAsset[] = [];
      const newOrderedBRoll: OrderedAsset[] = [];
      
      allRemainingAssets.forEach((asset, index) => {
        const updatedAsset = { ...asset, order: index + 1 };
        if (orderedImages.some(img => img.url === asset.url)) {
          newOrderedImages.push(updatedAsset);
        } else if (orderedVideos.some(vid => vid.url === asset.url)) {
          newOrderedVideos.push(updatedAsset);
        } else {
          newOrderedBRoll.push(updatedAsset);
        }
      });
      
      setSelectedBRoll(newSelectedBRoll);
      setOrderedImages(newOrderedImages);
      setOrderedVideos(newOrderedVideos);
      setOrderedBRoll(newOrderedBRoll);
    } else {
      // Select: add to selectedBRoll and assign next consecutive order number
      const newSelectedBRoll = [...selectedBRoll, src];
      const nextOrder = orderedImages.length + orderedVideos.length + orderedBRoll.length + 1;
      const newOrderedBRoll = [...orderedBRoll, { url: src, order: nextOrder }];
      
      setSelectedBRoll(newSelectedBRoll);
      setOrderedBRoll(newOrderedBRoll);
    }
  }

  const handleSelectAllBRoll = () => {
    setSelectedBRoll(bRollSuggestions)
    
    // Create ordered assets preserving existing order, then reassign consecutive numbers
    const newOrderedBRoll: OrderedAsset[] = []
    
    bRollSuggestions.forEach((url) => {
      const existingAsset = orderedBRoll.find(br => br.url === url)
      if (existingAsset) {
        newOrderedBRoll.push(existingAsset)
      } else {
        // Assign temporary order, will be reassigned below
        newOrderedBRoll.push({ url, order: 999 })
      }
    })
    
    // Reassign consecutive order numbers
    const reassigned = reassignOrderNumbers(orderedImages, orderedVideos, newOrderedBRoll)
    setOrderedImages(reassigned.images)
    setOrderedVideos(reassigned.videos)
    setOrderedBRoll(reassigned.broll)
  }

  const handleDeselectAllBRoll = () => {
    setSelectedBRoll([])
    // Reassign order numbers for remaining assets
    const reassigned = reassignOrderNumbers(orderedImages, orderedVideos, [])
    setOrderedImages(reassigned.images)
    setOrderedVideos(reassigned.videos)
    setOrderedBRoll([])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileList = Array.from(files)
      const tempImageKeys: string[] = []
      
      try {
        const allUrls: string[] = []
        
        // Upload files one by one to avoid size limits
        for (const file of fileList) {
          const tempKey = `temp-${file.name}-${Date.now()}`
          
          // Add image to uploading state
          tempImageKeys.push(tempKey)
          setUploadingImages(prev => [...prev, tempKey])
          setImageUploadProgress(prev => ({ ...prev, [tempKey]: 0 }))
          
          let fileToUpload = file
          
          // Update progress during compression
          setImageUploadProgress(prev => ({ ...prev, [tempKey]: 20 }))
          
          // Aggressively compress images
          if (file.type.startsWith('image/')) {
            const options = {
              maxSizeMB: 0.5, // Very aggressive - 500KB max
              maxWidthOrHeight: 1024,
              useWebWorker: true,
              fileType: 'image/jpeg' as const,
              initialQuality: 0.4
            }
            
            try {
              fileToUpload = await imageCompression(file, options)
              console.log(`Compressed ${file.name}: ${(file.size/1024/1024).toFixed(1)}MB → ${(fileToUpload.size/1024/1024).toFixed(1)}MB`)
            } catch (compressionError) {
              console.warn('Compression failed:', compressionError)
            }
          }
          
          // Update progress after compression
          setImageUploadProgress(prev => ({ ...prev, [tempKey]: 40 }))
          
          const formData = new FormData()
          formData.append('files', fileToUpload, file.name)
          
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setImageUploadProgress(prev => {
              const current = prev[tempKey] || 40
              if (current < 90) {
                return { ...prev, [tempKey]: current + Math.random() * 15 }
              }
              return prev
            })
          }, 150)
          
          const response = await fetch('/api/upload-temp', {
            method: 'POST',
            body: formData
          })
          
          clearInterval(progressInterval)
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          const result = await response.json()
          allUrls.push(...result.files.map((f: any) => f.url))
          
          // Complete the progress
          setImageUploadProgress(prev => ({ ...prev, [tempKey]: 100 }))
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Remove from uploading state
          setUploadingImages(prev => prev.filter(key => key !== tempKey))
          setImageUploadProgress(prev => {
            const { [tempKey]: _, ...rest } = prev
            return rest
          })
        }
        
        setUploadedImages(prev => Array.from(new Set([...prev, ...allUrls])))
        setSelectedImages(prev => Array.from(new Set([...prev, ...allUrls])))
        
        // Add uploaded images and reassign all order numbers from 1
        const newOrderedImages = allUrls.map((url, index) => ({
          url,
          order: orderedImages.length + orderedVideos.length + orderedBRoll.length + index + 1
        }))
        setOrderedImages(prev => {
          const combined = [...prev, ...newOrderedImages];
          const reassigned = reassignOrderNumbers(combined, orderedVideos, orderedBRoll);
          setOrderedVideos(reassigned.videos);
          setOrderedBRoll(reassigned.broll);
          return reassigned.images;
        })
      } catch (error) {
        console.error('Error uploading images:', error)
        alert('Failed to upload images. Please try again.')
        
        // Clean up any remaining uploading states
        tempImageKeys.forEach(tempKey => {
          setUploadingImages(prev => prev.filter(key => key !== tempKey))
          setImageUploadProgress(prev => {
            const { [tempKey]: _, ...rest } = prev
            return rest
          })
        })
      }
    }
  }
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileList = Array.from(files)
      const tempVideoKeys: string[] = []
      
      try {
        const allUrls: string[] = []
        
        // Upload videos one by one and check size
        for (const file of fileList) {
          const fileSizeMB = file.size / (1024 * 1024)
          const tempKey = `temp-${file.name}-${Date.now()}`
          
          // Reject videos larger than 50MB
          if (fileSizeMB > 50) {
            alert(`Video "${file.name}" is ${fileSizeMB.toFixed(1)}MB. Please use a video smaller than 50MB.`)
            continue
          }
          
          // Add video to uploading state with temporary key
          tempVideoKeys.push(tempKey)
          setUploadingVideos(prev => [...prev, tempKey])
          setVideoUploadProgress(prev => ({ ...prev, [tempKey]: 0 }))
          
          const formData = new FormData()
          formData.append('files', file)
          
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setVideoUploadProgress(prev => {
              const current = prev[tempKey] || 0
              if (current < 90) {
                return { ...prev, [tempKey]: current + Math.random() * 20 }
              }
              return prev
            })
          }, 200)
          
          const response = await fetch('/api/upload-temp', {
            method: 'POST',
            body: formData
          })
          
          clearInterval(progressInterval)
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          const result = await response.json()
          const uploadedUrls = result.files.map((f: any) => f.url)
          allUrls.push(...uploadedUrls)
          
          // Complete the progress
          setVideoUploadProgress(prev => ({ ...prev, [tempKey]: 100 }))
          
          // Small delay to show completion
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Remove from uploading state
          setUploadingVideos(prev => prev.filter(key => key !== tempKey))
          setVideoUploadProgress(prev => {
            const { [tempKey]: _, ...rest } = prev
            return rest
          })
        }
        
        setUploadedVideos(prev => Array.from(new Set([...prev, ...allUrls])))
        setSelectedVideos(prev => Array.from(new Set([...prev, ...allUrls])))
        
        // Add uploaded videos and reassign all order numbers from 1
        const newOrderedVideos = allUrls.map((url, index) => ({
          url,
          order: orderedImages.length + orderedVideos.length + orderedBRoll.length + index + 1
        }))
        setOrderedVideos(prev => {
          const combined = [...prev, ...newOrderedVideos];
          const reassigned = reassignOrderNumbers(orderedImages, combined, orderedBRoll);
          setOrderedImages(reassigned.images);
          setOrderedBRoll(reassigned.broll);
          return reassigned.videos;
        })
      } catch (error) {
        console.error('Error uploading videos:', error)
        alert('Failed to upload videos. Please try again.')
        
        // Clean up any remaining uploading states
        tempVideoKeys.forEach(tempKey => {
          setUploadingVideos(prev => prev.filter(key => key !== tempKey))
          setVideoUploadProgress(prev => {
            const { [tempKey]: _, ...rest } = prev
            return rest
          })
        })
      }
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

  // Loading Screen Component
  const LoadingScreen = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    
    // Define the steps in order - mapped to actual operations
    const steps = [
      { key: 'analyzing', label: 'Analyzing product page', triggers: ['Analyzing'] },
      { key: 'extracting', label: 'Extracting product information', triggers: ['Extracting'] },
      { key: 'downloading', label: 'Extract images and videos', triggers: ['Extract'] }, // This is the media downloading step
      { key: 'finding', label: 'Finding relevant B-roll', triggers: ['Finding'] },
      { key: 'generating', label: 'Generating summary', triggers: ['Generating', 'Finalizing'] }
    ];

    // Handle step progression
    useEffect(() => {
      if (!progressStep) return;

      // Find which step should be active based on progressStep
      let targetStepIndex = -1;
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].triggers.some(trigger => progressStep.includes(trigger))) {
          targetStepIndex = i;
          break;
        }
      }

      if (targetStepIndex >= 0) {
        // Complete previous steps immediately - preserve existing completed steps
        if (targetStepIndex > currentStepIndex) {
          setCompletedSteps(prev => {
            const newCompleted = new Set(prev);
            for (let i = 0; i < targetStepIndex; i++) {
              newCompleted.add(i);
            }
            return newCompleted;
          });
        }
        setCurrentStepIndex(targetStepIndex);
      }
    }, [progressStep, currentStepIndex, steps]);

    // When processing is complete, mark final step as completed
    useEffect(() => {
      if (!loading && !summaryLoading && progressStep === '') {
        setCompletedSteps(prev => {
          const newCompleted = new Set(prev);
          newCompleted.add(currentStepIndex);
          return newCompleted;
        });
      }
    }, [loading, summaryLoading, progressStep, currentStepIndex]);

    const getStepStatus = (stepIndex: number) => {
      if (completedSteps.has(stepIndex)) return 'completed';
      if (stepIndex === currentStepIndex && progressStep) return 'active';
      return 'pending';
    };

    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center w-full">
          
          <div className="space-y-6">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              
              return (
                <div key={step.key} className="flex items-center justify-between p-6 bg-gray-900 rounded-[20px] border border-gray-700 w-full">
                  <span className="text-white font-normal">{step.label}</span>
                  <div className="flex items-center">
                    {status === 'active' ? (
                      <div className="relative w-4 h-4">
                        <div className="absolute inset-0 border-2 border-gray-900 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-orange-500 border-t-gray-900 rounded-full animate-spin"></div>
                      </div>
                    ) : status === 'completed' ? (
                      <img src="/success.svg" alt="Success" className="w-4 h-4 filter brightness-0 saturate-100" style={{filter: 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'}} />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {productUrl && (
            <div className="mt-8 p-4 bg-gray-900 rounded-[20px] border border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Processing:</span>
                <span className="font-mono text-orange-400 break-all text-xs">{productUrl}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading screen during scraping process
  const isProcessing = (loading || summaryLoading) && productUrl && !error

  if (isProcessing) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Describe your video</h1>
          <p className="text-gray-400">Set up your product information and assets</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
            <div className="text-red-400">
              <strong>Error scraping:</strong> {error}
            </div>
          </div>
        )}

        {/* Assets */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Media Assets</h2>
          <p className="text-gray-400 text-sm mb-6">
            Select the assets you want to use in your video. Numbers indicate the order they'll appear in the final video.
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
            {bRollSuggestions.length > 0 && (
              <>
                <button 
                  className="btn-secondary text-sm" 
                  onClick={handleSelectAllBRoll}
                >
                  Select all B-roll
                </button>
                <button 
                  className="btn-secondary text-sm" 
                  onClick={handleDeselectAllBRoll}
                >
                  Deselect all B-roll
                </button>
              </>
            )}
          </div>
          
          {/* Images */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-3">Images</h3>
            <div className="flex flex-wrap gap-3">
              {/* All Images (scraped + screenshots + uploaded) */}
              {(() => {
                const scrapedImages = scrapeResult?.images || [];
                const screenshots = scrapeResult?.screenshots || [];
                const uploaded = uploadedImages;
                const allDisplayImages = [...scrapedImages, ...screenshots, ...uploaded];
                
                console.log('[CreateAd] Image display breakdown:', {
                  scrapedImages: scrapedImages.length,
                  screenshots: screenshots.length,
                  screenshotPaths: screenshots,
                  uploaded: uploaded.length,
                  totalImages: allDisplayImages.length,
                  allPaths: allDisplayImages
                });
                
                return allDisplayImages;
              })().map((src, i) => (
                <div 
                  key={i} 
                  className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedImages.includes(src) 
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25' 
                      : 'border border-gray-700 hover:border-orange-500/50'
                  } ${
                    (loading || summaryLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={(loading || summaryLoading) ? undefined : () => handleImageSelect(src)}
                >
                  <img src={src} alt={`Asset ${i+1}`} className="w-24 h-24 object-cover" />
                  
                  {/* Preview button */}
                  <button
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewingImage(previewingImage === src ? null : src);
                    }}
                  >
                    {previewingImage === src ? '✕' : '👁'}
                  </button>
                  
                  {selectedImages.includes(src) && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {orderedImages.find(img => img.url === src)?.order || ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Uploading Images with Progress */}
              {uploadingImages.map((tempKey) => {
                const progress = imageUploadProgress[tempKey] || 0
                const fileName = tempKey.split('-')[1] || 'Image'
                
                return (
                  <div 
                    key={tempKey}
                    className="relative w-24 h-24 border border-gray-700 rounded-lg overflow-hidden bg-gray-900"
                  >
                    {/* Upload progress background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin mx-auto mb-1"></div>
                        <div className="text-xs text-gray-400 truncate px-1">{fileName.substring(0, 8)}...</div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    {/* Progress percentage */}
                    <div className="absolute top-1 left-1 text-xs text-white bg-black/70 px-1 rounded">
                      {Math.round(progress)}%
                    </div>
                  </div>
                )
              })}
              
              <button 
                className={`w-24 h-24 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors ${
                  (loading || summaryLoading || uploadingImages.length > 0) ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 hover:text-orange-400'
                }`}
                onClick={() => imageInputRef.current?.click()}
                disabled={loading || summaryLoading || uploadingImages.length > 0}
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">
                  {uploadingImages.length > 0 ? 'Uploading...' : 'Upload'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  hidden 
                  ref={imageInputRef} 
                  onChange={handleImageUpload} 
                  disabled={loading || summaryLoading || uploadingImages.length > 0}
                />
              </button>
            </div>
          </div>
          
          {/* Videos */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Videos</h3>
            <div className="flex flex-wrap gap-3">
              {/* Uploaded Videos */}
              {[...(scrapeResult?.videos || []), ...uploadedVideos].map((src, i) => (
                <div 
                  key={i} 
                  className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedVideos.includes(src) 
                      ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25' 
                      : 'border border-gray-700 hover:border-orange-500/50'
                  } ${
                    (loading || summaryLoading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={(loading || summaryLoading) ? undefined : () => handleVideoSelect(src)}
                >
                  <video src={src} className="w-32 h-20 object-cover" muted />
                  
                  {/* Preview button */}
                  <button
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/90 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewingVideo(previewingVideo === src ? null : src);
                    }}
                  >
                    {previewingVideo === src ? '✕' : '▷'}
                  </button>
                  
                  {selectedVideos.includes(src) && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {orderedVideos.find(vid => vid.url === src)?.order || ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Uploading Videos with Progress */}
              {uploadingVideos.map((tempKey) => {
                const progress = videoUploadProgress[tempKey] || 0
                const fileName = tempKey.split('-')[1] || 'Video'
                
                return (
                  <div 
                    key={tempKey}
                    className="relative w-32 h-20 border border-gray-700 rounded-lg overflow-hidden bg-gray-900"
                  >
                    {/* Upload progress background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-xs text-gray-400 truncate px-1">{fileName}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    {/* Progress percentage */}
                    <div className="absolute top-1 left-1 text-xs text-white bg-black/70 px-1 rounded">
                      {Math.round(progress)}%
                    </div>
                  </div>
                )
              })}
              
              <button 
                className={`w-32 h-20 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors ${
                  (loading || summaryLoading || uploadingVideos.length > 0) ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 hover:text-orange-400'
                }`}
                onClick={() => videoInputRef.current?.click()}
                disabled={loading || summaryLoading || uploadingVideos.length > 0}
              >
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">
                  {uploadingVideos.length > 0 ? 'Uploading...' : 'Upload'}
                </span>
                <input 
                  type="file" 
                  accept="video/*" 
                  multiple 
                  hidden 
                  ref={videoInputRef} 
                  onChange={handleVideoUpload} 
                  disabled={loading || summaryLoading || uploadingVideos.length > 0}
                />
              </button>
            </div>
          </div>
          
          {/* B-roll */}
          {bRollSuggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">B-roll</h3>
              <div className="flex flex-wrap gap-3">
                {bRollSuggestions.map((src, i) => {
                  const orderNum = orderedBRoll.find(asset => asset.url === src)?.order;
                  const isSelected = selectedBRoll.includes(src);
                  
                  return (
                    <div 
                      key={i} 
                      className={`relative rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/25' 
                          : 'border border-gray-700 hover:border-orange-500/50'
                      }`}
                      onClick={() => handleBRollSelect(src)}
                    >
                      <video 
                        src={src.startsWith('b-roll/') ? `/api/serve-broll/${src.replace('b-roll/', '')}` : src} 
                        className="w-32 h-20 object-cover" 
                        muted
                      />
                      
                      {/* Preview button */}
                      <button
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/90 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingVideo(previewingVideo === src ? null : src);
                        }}
                      >
                        {previewingVideo === src ? '✕' : '▷'}
                      </button>
                      
                      {/* Selection overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                          <div className="bg-orange-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {orderNum}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Video preview modal */}
              {previewingVideo && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewingVideo(null)}>
                  <div className="relative max-w-4xl max-h-full">
                    <video 
                      src={previewingVideo.startsWith('b-roll/') ? `/api/serve-broll/${previewingVideo.replace('b-roll/', '')}` : previewingVideo}
                      className="w-full h-auto max-h-[80vh] rounded-lg"
                      controls
                      autoPlay
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                      onClick={() => setPreviewingVideo(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Image preview modal */}
              {previewingImage && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewingImage(null)}>
                  <div className="relative max-w-4xl max-h-full">
                    <img 
                      src={previewingImage}
                      alt="Preview"
                      className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                      onClick={() => setPreviewingImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Product Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 font-normal mb-2">Brand / Product name</label>
              <input 
                type="text" 
                className="input w-full" 
                value={brandName} 
                onChange={e => setBrandName(e.target.value)} 
                placeholder="e.g. iPhone 20" 
                maxLength={100}
              />
            </div>
            

            
            <div>
              <label className="block text-gray-300 font-normal mb-2">Product description</label>
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

        {/* Promotional Information */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <input 
                type="checkbox" 
                id="showPromo"
                checked={showPromo} 
                onChange={e => setShowPromo(e.target.checked)}
                className="sr-only"
              />
              <label htmlFor="showPromo" className="flex items-center cursor-pointer">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  showPromo 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'bg-transparent border-gray-600 hover:border-orange-500'
                }`}>
                  {showPromo && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-lg font-normal text-white ml-3">Add promotional information</span>
              </label>
            </div>
          </div>
          
          {showPromo && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 font-normal mb-2">Original price</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={originalPrice} 
                    onChange={e => setOriginalPrice(e.target.value)}
                    placeholder="e.g. $99.99"
                    disabled={loading || summaryLoading}
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-normal mb-2">Promo price</label>
                  <input 
                    type="text" 
                    className="input w-full" 
                    value={promoPrice} 
                    onChange={e => setPromoPrice(e.target.value)}
                    placeholder="e.g. $79.99"
                    disabled={loading || summaryLoading}
                    maxLength={50}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 font-normal mb-2">Promotion details</label>
                <input 
                  type="text" 
                  className="input w-full" 
                  value={promoDetails} 
                  onChange={e => setPromoDetails(e.target.value)}
                  placeholder="e.g. Limited time offer - 20% off"
                  disabled={loading || summaryLoading}
                  maxLength={200}
                />
              </div>
              
              {/* Promo Suggestions */}
              {promoSuggestions.length > 0 && (
                <div>
                  <label className="block text-gray-300 font-normal mb-2">Quick suggestions</label>
                  <div className="flex flex-wrap gap-2">
                    {promoSuggestions.map((suggestion, i) => (
                      <button 
                        key={i} 
                        className="px-3 py-2 text-sm border border-gray-600 rounded-[10px] text-gray-300 hover:border-orange-500 transition-colors duration-200" 
                        style={{ backgroundColor: '#111827' }}
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
