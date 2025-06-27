// remotion/scenes/FullScreenAvatar.tsx
import {AbsoluteFill, Video} from 'remotion';
import { COMPOSITION_FPS } from '../constants';

export const FullScreenAvatar: React.FC<{
	src: string;
	startFrom?: number; // <-- Add startFrom prop (in seconds)
}> = ({src, startFrom = 0}) => {
	// Convert seconds to frames for Video startFrom parameter
	const startFromFrames = Math.round(startFrom * COMPOSITION_FPS);

	return (
		<AbsoluteFill className="bg-black justify-center items-center">
			<Video
				src={src}
				className="w-full h-full object-cover"
				startFrom={startFromFrames} // <-- Use frames instead of seconds
				muted={true} // Audio is handled globally in MainComposition
			/>
		</AbsoluteFill>
	);
};