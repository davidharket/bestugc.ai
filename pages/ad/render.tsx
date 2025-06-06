import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useAdCreation } from '../../components/AdCreationContext'
import axios from 'axios'

const templates = [
  { id: 1, name: 'Modern', video: '/templates/modern.mp4', music: '/music/modern.mp3' },
  { id: 2, name: 'Minimal', video: '/templates/minimal.mp4', music: '/music/minimal.mp3' },
  { id: 3, name: 'Bold', video: '/templates/bold.mp4', music: '/music/bold.mp3' },
]

export default function RenderAd() {
  const router = useRouter()
  const { adData, setAdData, resetAdData } = useAdCreation()
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(adData.templateId || null)
  const [rendering, setRendering] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    setAdData({ templateId: selectedTemplate === null ? undefined : selectedTemplate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate])

  const handleRender = async () => {
    if (selectedTemplate === null) return
    setRendering(true)
    setSaveError(null)
    try {
      await axios.post('/api/render/start-job', {
        adData: { ...adData, templateId: selectedTemplate },
        templateId: selectedTemplate,
      })
      setMessage("Great! Your video is being created. You'll see it on your dashboard shortly.")
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e: any) {
      console.error('Error starting render job:', e)
      setSaveError(e.response?.data?.error || 'Failed to start render job.')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Render & Preview - Step 5</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Choose a video template</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {templates.map(t => (
            <div
              key={t.id}
              className={`border rounded p-2 flex flex-col items-center cursor-pointer ${selectedTemplate === t.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedTemplate(t.id)}
            >
              <video src={t.video} controls className="w-48 h-32 mb-2 rounded" />
              <div className="text-sm text-center font-medium mb-1">{t.name}</div>
              <div className="text-xs text-gray-500 mb-1">Background Music:</div>
              <audio src={t.music} controls className="w-full mb-2" />
            </div>
          ))}
        </div>
      </div>
      {saveError && <div className="mb-4 text-red-600">{saveError}</div>}
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <button
        className="mt-8 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        onClick={handleRender}
        disabled={selectedTemplate === null || rendering}
      >
        {rendering ? 'Queuing...' : 'Render'}
      </button>
      <button
        className="mt-4 ml-4 px-4 py-2 border rounded hover:bg-gray-100"
        onClick={() => {
          resetAdData()
          router.push('/dashboard')
        }}
      >
        Cancel
      </button>
    </div>
  )
}
