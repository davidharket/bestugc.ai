import { AbsoluteFill, Img, staticFile } from 'remotion';
import React from 'react';

export const CollageScene: React.FC<{
  images: string[];
}> = ({ images }) => {
  return (
    <AbsoluteFill className="bg-gray-200">
      <AbsoluteFill>
        {/* A simple 2x2 grid layout */}
        <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
          {images.slice(0, 4).map((image, index) => (
            <div key={index} className="flex items-center justify-center overflow-hidden">
              <Img src={image} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}; 