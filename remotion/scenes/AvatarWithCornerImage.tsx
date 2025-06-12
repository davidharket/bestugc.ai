import { AbsoluteFill, Img, Video } from 'remotion';
export const AvatarWithCornerImage: React.FC<{ videoUrl: string, imageUrl: string }> = ({ videoUrl, imageUrl }) => (
    <AbsoluteFill>
        <Video src={videoUrl} className="w-full h-full object-cover" />
        <AbsoluteFill className="p-8 justify-end items-start">
            <Img src={imageUrl} className="w-1/4 h-auto shadow-lg rounded-lg border-2 border-white" />
        </AbsoluteFill>
    </AbsoluteFill>
);