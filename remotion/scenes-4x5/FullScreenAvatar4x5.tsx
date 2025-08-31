// remotion/scenes-4x5/FullScreenAvatar4x5.tsx
import {AbsoluteFill, Video, useCurrentFrame, useVideoConfig, getInputProps} from 'remotion';
import { COMPOSITION_FPS } from '../constants';

export const FullScreenAvatar4x5: React.FC<{
	src: string;
	startFrom?: number; // <-- Add startFrom prop (in seconds)
}> = ({src, startFrom = 0}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const inputProps = getInputProps();
	
	// Check if we're in preview mode
	const isPreviewMode = (inputProps as any)?.adData?.previewMode === true;
	
	if (!src) {
		console.warn('[FullScreenAvatar4x5] No src provided, showing placeholder');
		return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;
	}

	let videoStartFrame: number;
	
	if (isPreviewMode) {
		// PREVIEW MODE: Use simpler logic without custom looping
		// Just start from the beginning of the scene for preview
		videoStartFrame = 0;
	} else {
		// FINAL RENDER: Use original timing logic for proper lip-sync
		// Use the timeline position passed from Main.tsx for proper sync with processed avatar
		// Use detected avatar FPS if available
		const avatarFps = (inputProps as any)?.avatarFps;
		const effectiveFps = avatarFps || COMPOSITION_FPS;
		videoStartFrame = Math.round(startFrom * effectiveFps);
	}

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
					console.error('[FullScreenAvatar4x5] Video error:', error);
				}}
			/>
		</AbsoluteFill>
	);
};