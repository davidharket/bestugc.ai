// remotion/scenes/FullScreenAvatar.tsx
import {AbsoluteFill, Video, useCurrentFrame, useVideoConfig} from 'remotion';
import { COMPOSITION_FPS } from '../constants';
import { safeGetInputProps } from '../utils/safeInputProps';

export const FullScreenAvatar: React.FC<{
	src: string;
	startFrom?: number; // <-- Add startFrom prop (in seconds)
}> = ({src, startFrom = 0}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const inputProps = safeGetInputProps();
	
	if (!src) {
		console.warn('[FullScreenAvatar] No src provided, showing placeholder');
		return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
	}

	// Get avatar FPS from input props if available, otherwise use composition FPS
	const avatarFps = (inputProps as any)?.avatarFps || fps;
	
	// Simple approach: just use the detected avatar FPS to calculate the start frame
	const videoStartFrame = Math.round(startFrom * avatarFps);

	// Debug logging
	console.log('[FullScreenAvatar] Timeline sync - StartFrom:', startFrom, 'AvatarFPS:', avatarFps, 'VideoStartFrame:', videoStartFrame);

	return (
		<AbsoluteFill className="bg-black justify-center items-center">
			<Video
				src={src}
				className="w-full h-full object-cover"
				startFrom={videoStartFrame}
				muted={true} // Audio is handled globally in MainComposition
				playsInline={true}
				preload="auto"
				onError={(error) => {
					console.error('[FullScreenAvatar] Video error:', error);
				}}
			/>
		</AbsoluteFill>
	);
};