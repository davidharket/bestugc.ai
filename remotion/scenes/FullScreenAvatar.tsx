// remotion/scenes/FullScreenAvatar.tsx
import {AbsoluteFill, Video, useCurrentFrame, useVideoConfig, getInputProps} from 'remotion';
import { COMPOSITION_FPS } from '../constants';

export const FullScreenAvatar: React.FC<{
	src: string;
	startFrom?: number; // <-- Add startFrom prop (in seconds)
}> = ({src, startFrom = 0}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const inputProps = getInputProps();
	
	// Check if we're in preview mode
	const isPreviewMode = (inputProps as any)?.adData?.previewMode === true;
	
	if (!src) {
		console.warn('[FullScreenAvatar] No src provided, showing placeholder');
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
		videoStartFrame = Math.round(startFrom * COMPOSITION_FPS);
	}

	return (
		<AbsoluteFill className="bg-black justify-center items-center">
			<Video
				src={src}
				className="w-full h-full object-cover"
				startFrom={videoStartFrame}
				muted={true} // Audio is handled globally in MainComposition
				playsInline={true}
				preload="metadata"
				onError={(error) => {
					console.error('[FullScreenAvatar] Video error:', error);
				}}
			/>
		</AbsoluteFill>
	);
};