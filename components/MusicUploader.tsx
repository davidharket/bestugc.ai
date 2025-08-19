// components/MusicUploader.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface CustomMusic {
  id: string;
  name: string;
  url: string;
  originalFilename: string;
  uploadedAt: string;
}

interface MusicUploaderProps {
  onMusicUploaded: (music: CustomMusic) => void;
}

const MusicUploader: React.FC<MusicUploaderProps> = ({ onMusicUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('🎵 Uploading music file:', file.name);

      const response = await axios.post('/api/music/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      if (response.data.success) {
        console.log('✅ Music uploaded successfully:', response.data.music);
        toast.success(`Music "${response.data.music.name}" uploaded successfully!`);
        onMusicUploaded(response.data.music);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('❌ Music upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload music file';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onMusicUploaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      'audio/webm': ['.webm'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  });

  const getBorderColor = () => {
    if (isDragReject) return 'border-red-500 bg-red-500/5';
    if (isDragActive) return 'border-orange-500 bg-orange-500/5';
    return 'border-gray-600 hover:border-orange-500/50';
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200 
          ${getBorderColor()}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            <div className="text-sm text-white">
              Uploading... {uploadProgress}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            
            {isDragActive ? (
              <div className="text-orange-400">
                <p className="text-lg font-medium">Drop your music file here!</p>
                <p className="text-sm opacity-75">Release to upload</p>
              </div>
            ) : isDragReject ? (
              <div className="text-red-400">
                <p className="text-lg font-medium">Invalid file type</p>
                <p className="text-sm opacity-75">Please use MP3, M4A, WAV, OGG, or WebM</p>
              </div>
            ) : (
              <div className="text-gray-300">
                <p className="text-lg font-medium">Upload Background Music</p>
                <p className="text-sm opacity-75 mb-2">
                  Drag and drop a music file, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports MP3, M4A, WAV, OGG, WebM (max 10MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-blue-300">
            <div className="font-medium text-xs mb-1">Background Music Tips</div>
            <div className="text-xs">
              • Choose instrumental tracks for better voice clarity<br/>
              • Ensure you have rights to use the music<br/>
              • Lower tempo tracks work well for product ads<br/>
              • The volume will be automatically adjusted to 10% during rendering
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicUploader;