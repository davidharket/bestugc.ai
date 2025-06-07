import { AbsoluteFill, Video } from 'remotion';
import React from 'react';

export const AvatarScene: React.FC<{
  processedAvatarUrl: string;
  text?: string;
}> = ({ processedAvatarUrl, text }) => {
  return (
    <AbsoluteFill className="bg-gray-200">
      <div className="grid grid-cols-2 h-full">
        <div className="flex items-center justify-center p-8">
          {text && (
            <h1 className="text-4xl font-bold text-center leading-tight">
              {text}
            </h1>
          )}
        </div>
        <div className="flex items-center justify-center">
          <Video src={processedAvatarUrl} className="h-full" />
        </div>
      </div>
    </AbsoluteFill>
  );
}; 