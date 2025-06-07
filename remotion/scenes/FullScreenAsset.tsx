import { AbsoluteFill, Img, Video } from 'remotion';
const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');
export const FullScreenAsset: React.FC<{ assetUrl: string }> = ({ assetUrl }) => (
    <AbsoluteFill className="bg-black">
        {isVideo(assetUrl) ? 
            <Video src={assetUrl} className="w-full h-full object-cover" /> :
            <Img src={assetUrl} className="w-full h-full object-cover" />
        }
    </AbsoluteFill>
);