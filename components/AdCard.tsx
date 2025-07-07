import React from 'react';

interface AdCardProps {
  ad: {
    id: string;
    status: string;
    finalVideoUrl?: string;
    brandName?: string;
    createdAt: string;
    // Add other ad properties as needed
  };
  onDelete: (adId: string) => void;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, onDelete }) => {
  return (
    <>
      {ad.status === 'COMPLETED' && ad.finalVideoUrl && (
        <>
          <a
            href={`***REMOVED***${ad.finalVideoUrl}`}  // Force localhost for downloads
            download={`${ad.brandName || 'video'}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-3 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            Download
          </a>
          {/* Also add a local preview button */}
          <a
            href={`***REMOVED***${ad.finalVideoUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
          >
            Preview
          </a>
          <button
            onClick={() => onDelete(ad.id)}
            className="bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm"
          >
            Delete
          </button>
        </>
      )}
    </>
  );
};
