import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring, Easing } from 'remotion';
export const SequentialLayeringScene: React.FC<{ backgroundUrl: string, images: string[] }> = ({ backgroundUrl, images }) => {
  const frame = useCurrentFrame();
  const fps = 30;

  return (
    <AbsoluteFill>
        <Img src={backgroundUrl} className="w-full h-full object-cover" />
        {images.map((img, i) => {
            // Each image gets 2 seconds: 1s to appear, 1s to disappear
            const inStart = i * fps;
            const outStart = (i + images.length) * fps;
            
            const scale = spring({ frame, from: 0, to: 1, fps, durationInFrames: 30 });
            const opacityIn = interpolate(frame, [inStart, inStart + fps], [0, 1], { extrapolateRight: 'clamp' });
            const opacityOut = interpolate(frame, [outStart, outStart + fps], [1, 0], { extrapolateLeft: 'clamp' });
            
            return (
                <AbsoluteFill key={i} className="justify-center items-center" style={{ opacity: Math.min(opacityIn, opacityOut) }}>
                    <Img src={img} style={{ transform: `scale(${scale}) rotate(${(i-1)*5}deg)`, width: '70%' }} className="shadow-2xl rounded-xl"/>
                </AbsoluteFill>
            )
        })}
    </AbsoluteFill>
  );
};