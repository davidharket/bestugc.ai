import {AbsoluteFill, Video} from 'remotion';

export const FullScreenAvatar: React.FC<{
	src: string;
	startFrom?: number;
}> = ({src, startFrom = 0}) => (
	<AbsoluteFill className="bg-black justify-center items-center">
		<Video
			src={src}
			className="w-full h-full object-cover"
			startFrom={startFrom}
			muted={true} // Audio is handled globally in MainComposition
		/>
	</AbsoluteFill>
);