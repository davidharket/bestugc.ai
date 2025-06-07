import { Composition } from 'remotion';
import { MainComposition } from './Main';
import './style.css';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MainComposition}
        durationInFrames={15 * 30} // 15 seconds
        fps={30}
        width={1080}
        height={1920}
        // You can pass default props to your composition here
        defaultProps={{
          adData: {}, // Pass a default or mock adData object
          template: null, // Pass a default or mock template
          processedAvatarUrl: '', // Pass a default URL
        }}
      />
    </>
  );
}; 