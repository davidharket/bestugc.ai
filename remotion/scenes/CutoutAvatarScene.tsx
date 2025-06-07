import { AbsoluteFill, Img, Video } from 'remotion';
export const CutoutAvatarScene: React.FC<{
  backgroundUrl: string;
  cutoutUrl: string;
  position: 'center' | 'left' | 'right';
}> = ({ backgroundUrl, cutoutUrl, position }) => {
  const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');
  const positionClasses = {
      center: 'justify-center items-end',
      left: 'justify-center items-end -translate-x-1/4',
      right: 'justify-center items-end translate-x-1/4',
  };

  return (
    <AbsoluteFill>
      {isVideo(backgroundUrl) ? 
          <Video src={backgroundUrl} className="w-full h-full object-cover" /> :
          <Img src={backgroundUrl} className="w-full h-full object-cover" />
      }
      <AbsoluteFill className={`flex ${positionClasses[position]}`}>
        <Video src={cutoutUrl} className="h-4/5 w-auto" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};