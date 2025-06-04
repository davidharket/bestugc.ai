import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAdCreation } from '../../components/AdCreationContext'

const scriptTypes = [
  { key: 'cta', label: 'Call to Action' },
  { key: 'lifestyle', label: 'Product Lifestyle' },
  { key: 'brand', label: 'Brand Story' },
  { key: 'trending', label: 'Trending Topics' },
]

export default function ScriptAd() {
  const router = useRouter()
  const { adData, setAdData } = useAdCreation()
  const [activeType, setActiveType] = useState('cta')
  const [script, setScript] = useState(adData.script || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customScript, setCustomScript] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const summary = adData.summary || ''
  const productName = adData.brandName || ''
  const brandName = adData.brandName || ''
  const promoDetails = adData.promoDetails || ''
  const language = adData.language || 'en'

  const handleGenerate = async (type: string) => {
    setLoading(true)
    setError(null)
    setIsCustom(false)
    setCustomScript('')
    try {
      const res = await axios.post('/api/generate-script', {
        promptType: type,
        summary,
        productName,
        brandName,
        promoDetails,
        language,
      })
      setScript(res.data.script)
      setAdData({ script: res.data.script })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate script')
      setScript('')
    } finally {
      setLoading(false)
    }
  }

  // Generate script when tab changes
  const handleTab = (type: string) => {
    setActiveType(type)
    handleGenerate(type)
  }

  // On mount, generate the first script if not present
  useEffect(() => {
    if (!adData.script) handleGenerate(activeType)
    // eslint-disable-next-line
  }, [])

  const handleCustom = () => {
    setIsCustom(true)
    setCustomScript(script)
  }

  useEffect(() => {
    if (isCustom) setAdData({ script: customScript })
    // eslint-disable-next-line
  }, [customScript, isCustom])

  const handleNext = () => {
    // Save script to context/global state here
    router.push('/ad/avatar')
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Script - Step 3</h1>
      <div className="flex gap-4 mb-6">
        {scriptTypes.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 border rounded ${activeType === t.key && !isCustom ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => handleTab(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
        <button
          className={`px-4 py-2 border rounded ${isCustom ? 'bg-blue-600 text-white' : 'bg-white'}`}
          onClick={handleCustom}
          type="button"
        >
          Custom
        </button>
      </div>
      {loading && <div className="mb-4 text-blue-600">Generating script...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {!isCustom && !loading && script && (
        <textarea className="w-full border rounded p-2 mb-4" rows={8} value={script} readOnly />
      )}
      {isCustom && (
        <textarea
          className="w-full border rounded p-2 mb-4"
          rows={8}
          value={customScript}
          onChange={e => setCustomScript(e.target.value)}
          placeholder="Write your own script here..."
        />
      )}
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        onClick={handleNext}
        disabled={(!isCustom && !script) || (isCustom && !customScript)}
      >
        Next
      </button>
    </div>
  )
} 