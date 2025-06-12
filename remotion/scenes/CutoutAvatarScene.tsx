import { AbsoluteFill, Img, Video } from 'remotion';

const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.webm');

export const CutoutAvatarScene: React.FC<{
  backgroundUrl: string;
  cutoutUrl: string;
  position: 'center' | 'left' | 'right';
}> = ({ backgroundUrl, cutoutUrl, position }) => {
  
  const getPositionStyles = () => {
    switch (position) {
      case 'left':
        return { left: '10%', bottom: '0' };
      case 'right':
        return { right: '10%', bottom: '0' };
      case 'center':
      default:
        return { left: '50%', bottom: '0', transform: 'translateX(-50%)' };
    }
  };

  return (
    <AbsoluteFill className="bg-black">
      {isVideo(backgroundUrl) ? 
          <Video src={backgroundUrl} className="w-full h-full object-cover" /> :
          <Img src={backgroundUrl} className="w-full h-full object-cover" />
      }
      <AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            ...getPositionStyles(),
            height: '80%', // 4/5 of the container height
          }}
        >
          <Video src={cutoutUrl} className="h-full w-auto" />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};