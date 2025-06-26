import {AbsoluteFill, Img, Video} from 'remotion';

const isVideo = (url: string): boolean => {
	if (!url) return false;
	const lowerUrl = url.toLowerCase();
	return lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm');
};

export const AvatarWithCornerImage: React.FC<{
	videoSrc: string;
	imageSrc: string;
	startFrom?: number;
}> = ({videoSrc, imageSrc, startFrom = 0}) => {
	return (
		<AbsoluteFill className="bg-black">
			{/* Fullscreen avatar video */}
			<Video
				src={videoSrc}
				className="w-full h-full object-cover"
				startFrom={startFrom}
				muted={true}
			/>

			{/* Corner Asset */}
			<div
				style={{
					position: 'absolute',
					bottom: '32px',
					left: '32px',
					width: '30%', // Example size
					aspectRatio: '9/16', // Ensure correct proportions
					borderRadius: '12px',
					overflow: 'hidden',
					border: '3px solid white',
					boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
				}}
			>
				{isVideo(imageSrc) ? (
					<Video
						src={imageSrc}
						className="w-full h-full object-cover"
						muted
						loop
					/>
				) : (
					<Img src={imageSrc} className="w-full h-full object-cover" />
				)}
			</div>
		</AbsoluteFill>
	);
};