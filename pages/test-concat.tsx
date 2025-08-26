import React, { useState } from 'react'

export default function TestConcatenation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const runTest = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/test-concatenation', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err: any) {
      setError(`Request failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Concatenation Test</h1>
        
        <div className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test FFmpeg Concatenation</h2>
          <p className="text-gray-400 mb-6">
            This will test concatenating the existing generated video with the avatar video using the new FFmpeg command.
          </p>
          
          <button
            onClick={runTest}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Running Test...
              </>
            ) : (
              'Run Concatenation Test'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-900/50 border border-green-500 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Test Successful!</h3>
            <div className="space-y-2 mb-6">
              <p><strong>Message:</strong> {result.message}</p>
              <p><strong>File Size:</strong> {(result.fileSize / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Test Result Video:</h4>
              <video 
                src={result.videoUrl}
                controls
                className="w-full max-w-md rounded-lg"
                style={{ aspectRatio: '9/16' }}
              >
                Your browser does not support video playback.
              </video>
              <div className="mt-3">
                <a 
                  href={result.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Video in New Tab
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3">Test Details</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p><strong>Generated Video:</strong> /temp/generated_1755876623990.mp4</p>
            <p><strong>Avatar Video:</strong> /public/avatars/female-blonde5-adult-inside-new.mp4</p>
            <p><strong>FFmpeg Command:</strong> Uses concat filter with video-only concatenation and audio from avatar</p>
          </div>
        </div>
      </div>
    </div>
  )
}