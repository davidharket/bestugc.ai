// components/TemplatePreview.tsx
import { useState, useEffect } from 'react';

interface TemplatePreviewProps {
  assets: string[];
  avatarSrc: string;
}

const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');

// A helper component to render either an image or a video
const Asset = ({ src }: { src: string }) => {
  if (!src) return <div className="bg-gray-700 w-full h-full" />; // Fallback

  if (isVideo(src)) {
    return <video key={src} src={src} className="w-full h-full object-cover" autoPlay loop muted playsInline />;
  }
  return <img key={src} src={src} alt="Asset preview" className="w-full h-full object-cover" />;
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ assets, avatarSrc }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (assets.length === 0) return;

    // Cycle through the assets every 3 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % assets.length);
    }, 3000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [assets]);

  const currentAsset = assets[currentIndex] || '/placeholder.png'; // Use a fallback image if assets are empty

  return (
    <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl border-4 border-gray-200">
      {/* Background Asset */}
      <div className="absolute inset-0 transition-opacity duration-500 ease-in-out">
        <Asset src={currentAsset} />
      </div>

      {/* Overlay Avatar */}
      <div className="absolute bottom-5 left-5 w-1/3 max-w-[150px] aspect-[9/16] rounded-md overflow-hidden shadow-2xl border-2 border-white">
        <video src={avatarSrc} className="w-full h-full object-cover" autoPlay loop muted playsInline />
      </div>

      {/* Example Text Overlay */}
      <div className="absolute top-5 right-5 p-2 bg-black bg-opacity-50 rounded-md">
        <p className="text-white text-sm font-semibold">PREVIEW</p>
      </div>
    </div>
  );
};