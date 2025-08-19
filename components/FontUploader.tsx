// components/FontUploader.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UploadedFontData {
  id: string;
  name: string;
  path: string;
}

interface FontUploaderProps {
  onFontUploaded?: (font: UploadedFontData) => void;
  className?: string;
}

const FontUploader: React.FC<FontUploaderProps> = ({ onFontUploaded, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fontName, setFontName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!fontName.trim()) {
      toast.error('Please enter a font name first');
      return;
    }

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('font', file);
      formData.append('name', fontName.trim());

      const response = await axios.post('/api/fonts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      if (response.data.success) {
        toast.success('Font uploaded successfully!');
        setFontName('');
        setUploadProgress(0);
        
        if (onFontUploaded) {
          onFontUploaded(response.data.font);
        }
      }

    } catch (error: any) {
      console.error('Font upload error:', error);
      const message = error.response?.data?.error || 'Failed to upload font';
      toast.error(message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [fontName, onFontUploaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'font/woff': ['.woff'],
      'font/woff2': ['.woff2'],
      'font/ttf': ['.ttf'],
      'font/otf': ['.otf'],
      'application/font-woff': ['.woff'],
      'application/font-woff2': ['.woff2'],
      'application/x-font-ttf': ['.ttf'],
      'application/x-font-otf': ['.otf'],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isUploading
  });

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Upload Custom Font</h3>
        <p className="text-gray-400 text-sm mb-4">
          Upload your own font files (.woff, .woff2, .ttf, .otf) up to 5MB
        </p>
        
        {/* Font Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Font Name *
          </label>
          <input
            type="text"
            value={fontName}
            onChange={(e) => setFontName(e.target.value)}
            placeholder="Enter a name for your font"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={isUploading}
          />
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive && !isDragReject
              ? 'border-orange-500 bg-orange-500/10'
              : isDragReject
              ? 'border-red-500 bg-red-500/10'
              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-3">
              <div className="text-orange-400">
                <svg className="w-8 h-8 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="text-white font-medium">Uploading... {uploadProgress}%</div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : isDragActive ? (
            isDragReject ? (
              <div className="space-y-2">
                <div className="text-red-400">
                  <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-red-400 font-medium">Invalid file type</div>
                <div className="text-gray-400 text-sm">Only .woff, .woff2, .ttf, and .otf files are allowed</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-orange-400">
                  <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-white font-medium">Drop your font file here</div>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="text-gray-400">
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-white font-medium">Click to select or drag & drop</div>
              <div className="text-gray-400 text-sm">
                Supports .woff, .woff2, .ttf, .otf files (max 5MB)
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-500">
          <p><strong>Tip:</strong> For best results, use WOFF2 format for smaller file sizes and better browser support.</p>
        </div>
      </div>
    </div>
  );
};

export default FontUploader;