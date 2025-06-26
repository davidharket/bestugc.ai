import { AbsoluteFill, Img, Video, staticFile } from 'remotion';
import React from 'react';

const isVideo = (url: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mov') || lowerUrl.includes('.avi');
};

export const CollageScene: React.FC<{
  images: string[];
}> = ({ images }) => {
  return (
    <AbsoluteFill className="bg-gray-200">
      <AbsoluteFill>
        {/* A simple 2x2 grid layout */}
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
          {images.slice(0, 4).map((image, index) => {
            const isImageVideo = isVideo(image);
            
            return (
              <div key={index} className="flex items-center justify-center overflow-hidden">
                {isImageVideo ? (
                  <Video src={image} className="w-full h-full object-cover" muted />
                ) : (
                  <Img src={image} className="w-full h-full object-cover" />
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}; 