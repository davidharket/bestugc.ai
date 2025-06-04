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
  const [rendered, setRendered] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    setAdData({ templateId: selectedTemplate === null ? undefined : selectedTemplate })
    // eslint-disable-next-line
  }, [selectedTemplate])

  useEffect(() => {
    const generateTts = async () => {
      if (adData.script && adData.language) {
        setTtsLoading(true)
        setTtsError(null)
        setTtsAudioUrl(null)
        try {
          const response = await axios.post('/api/tts/elevenlabs', {
            text: adData.script,
            language: adData.language,
            // voiceId: adData.avatarVoiceId // Assuming avatar selection might also determine a voice ID
          })
          setTtsAudioUrl(response.data.audioUrl)
        } catch (err: any) {
          setTtsError(err.response?.data?.error || 'Failed to generate Text-to-Speech audio.')
        } finally {
          setTtsLoading(false)
        }
      }
    }
    generateTts()
  }, [adData.script, adData.language])

  const handleRender = async () => {
    setRendering(true)
    setSaveError(null)
    setFinalVideoUrl(null)
    try {
      const response = await axios.post('/api/render/final-video', {
        adData: { ...adData, templateId: selectedTemplate },
        ttsAudioUrl: ttsAudioUrl
      });
      
      setFinalVideoUrl(response.data.finalVideoUrl);

      await axios.post('/api/ads', { 
        ...adData, 
        templateId: selectedTemplate, 
        finalVideoUrl: response.data.finalVideoUrl
      });
      
      setRendered(true)
    } catch (e: any) {
      console.error("Error saving ad:", e)
      setSaveError(e.response?.data?.error || 'Failed to save ad. Please try again.')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Render & Preview - Step 5</h1>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Choose a video template</h2>
        {ttsLoading && <div className="mb-2 text-blue-600">Generating voiceover...</div>}
        {ttsError && <div className="mb-2 text-red-600">TTS Error: {ttsError}</div>}
        {ttsAudioUrl && (
          <div className="mb-4 p-2 border rounded bg-green-50">
            <h3 className="text-sm font-medium mb-1">Generated Voiceover:</h3>
            <audio src={ttsAudioUrl} controls className="w-full" />
          </div>
        )}
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
      {!rendered && (
        <button
          className="mt-8 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={handleRender}
          disabled={selectedTemplate === null || rendering}
        >
          {rendering ? 'Rendering...' : 'Render'}
        </button>
      )}
      {rendered && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Your video is ready!</h2>
          {finalVideoUrl ? (
            <video src={finalVideoUrl} controls className="w-full max-w-md h-auto mb-2 rounded shadow-lg" />
          ) : (
            <div className="w-full max-w-md h-64 mb-2 rounded shadow-lg bg-gray-200 flex items-center justify-center text-gray-500">Loading final video...</div>
          )}
          <div className="flex gap-4 mt-4">
            {finalVideoUrl && (
              <a
                href={finalVideoUrl}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download Video
              </a>
            )}
            <button
              className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              onClick={() => {
                resetAdData()
                router.push('/dashboard')
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 