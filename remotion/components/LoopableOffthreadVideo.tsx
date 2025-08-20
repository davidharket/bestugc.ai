import {mediaParserController, parseMedia} from '@remotion/media-parser';
import React, {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, getRemotionEnvironment, Loop, OffthreadVideo, useVideoConfig, Video} from 'remotion';

// Define the props interface manually since RemotionOffthreadVideoProps might not be available
interface OffthreadVideoProps {
  src: string;
  style?: React.CSSProperties;
  muted?: boolean;
  startFrom?: number;
  transparent?: boolean;
  volume?: number;
  playbackRate?: number;
  onError?: (error: Error) => void;
}

const LoopedOffthreadVideo: React.FC<OffthreadVideoProps> = (props) => {
  const [duration, setDuration] = useState<number | null>(null);
  const [handle] = useState(() => delayRender());
  const {fps} = useVideoConfig();

  useEffect(() => {
    const controller = mediaParserController();

    parseMedia({
      src: props.src,
      acknowledgeRemotionLicense: true,
      controller,
      fields: {
        slowDurationInSeconds: true,
      },
    })
      .then(({slowDurationInSeconds}) => {
        console.log(`[LoopableOffthreadVideo] Extracted duration: ${slowDurationInSeconds}s for ${props.src}`);
        setDuration(slowDurationInSeconds);
        continueRender(handle);
      })
      .catch((err) => {
        console.warn(`[LoopableOffthreadVideo] Failed to extract duration for ${props.src}:`, err);
        cancelRender(err);
      });

    return () => {
      continueRender(handle);
      controller.abort();
    };
  }, [handle, props.src]);

  if (duration === null) {
    return null;
  }

  return (
    <Loop durationInFrames={Math.floor(duration * fps)}>
      <OffthreadVideo {...props} />
    </Loop>
  );
};

export const LoopableOffthreadVideo: React.FC<
  OffthreadVideoProps & {
    loop?: boolean;
  }
> = ({loop = true, ...props}) => {
  if (getRemotionEnvironment().isRendering) {
    if (loop) {
      return <LoopedOffthreadVideo {...props} />;
    }

    return <OffthreadVideo {...props} />;
  }

  return <Video loop={loop} {...props} />;
};