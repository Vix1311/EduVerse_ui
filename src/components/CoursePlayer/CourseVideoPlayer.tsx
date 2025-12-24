import { extractYouTubeId } from '@/core/utils/extractYouTubeId';
import YouTube from 'react-youtube';

export default function CourseVideoPlayer({
  videoUrl,
  onVideoEnded,
  isLoadingNext,
}: {
  videoUrl: string;
  onVideoEnded?: () => void;
  isLoadingNext?: boolean;
}) {
  const ytId = extractYouTubeId(videoUrl);
  const isYoutube = Boolean(ytId);
  const isMp4 = videoUrl?.endsWith('.mp4');

  return (
    <div className="w-full h-full relative mb-4">
      {isLoadingNext && (
        <div className="absolute inset-0 z-10 bg-white/90 flex items-center justify-center text-2xl font-semibold text-purple-600 animate-pulse">
          Moving to the next lesson...
        </div>
      )}

      {/* YOUTUBE */}
      {isYoutube && (
        <YouTube
          videoId={ytId!}
          className="w-full h-full"
          iframeClassName="w-full h-full" // nếu dùng prop này
          opts={{
            width: '100%',
            height: '100%',
            playerVars: { autoplay: 0 },
          }}
          onEnd={onVideoEnded}
        />
      )}

      {/* MP4 */}
      {!isYoutube && isMp4 && (
        <video src={videoUrl} controls className="w-full h-full" onEnded={onVideoEnded} />
      )}

      {/* INVALID */}
      {!isYoutube && !isMp4 && (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600">
          Invalid video URL
        </div>
      )}
    </div>
  );
}
