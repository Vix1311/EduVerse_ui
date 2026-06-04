import { extractYouTubeId } from '@/core/utils/extractYouTubeId';
import { useEffect, useMemo, useRef, useState } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';

export interface VideoTimedNote {
  id: number;
  content: string;
  timestampSec: number;
  isPinned?: boolean;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const ss = (safe % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CourseVideoPlayer({
  videoUrl,
  onVideoEnded,
  isLoadingNext,
  onTimeUpdate,
  seekTo,
  timedNotes = [],
}: {
  videoUrl: string;
  onVideoEnded?: () => void;
  isLoadingNext?: boolean;
  onTimeUpdate?: (time: number) => void;
  seekTo?: number | null;
  timedNotes?: VideoTimedNote[];
}) {
  const ytId = extractYouTubeId(videoUrl);
  const isYoutube = Boolean(ytId);
  const isMp4 = videoUrl?.endsWith('.mp4');

  const youtubePlayerRef = useRef<any>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [visibleNoteId, setVisibleNoteId] = useState<number | null>(null);

  const matchedNote = useMemo(() => {
    return timedNotes.find(note => Math.floor(note.timestampSec) === Math.floor(currentTime)) || null;
  }, [timedNotes, currentTime]);

  useEffect(() => {
    if (!matchedNote) return;

    setVisibleNoteId(matchedNote.id);

    const timeout = window.setTimeout(() => {
      setVisibleNoteId(prev => (prev === matchedNote.id ? null : prev));
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [matchedNote]);

  useEffect(() => {
    if (seekTo == null) return;

    if (isYoutube && youtubePlayerRef.current?.seekTo) {
      youtubePlayerRef.current.seekTo(seekTo, true);
    }

    if (!isYoutube && htmlVideoRef.current) {
      htmlVideoRef.current.currentTime = seekTo;
    }
  }, [seekTo, isYoutube]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isYoutube) {
      intervalRef.current = window.setInterval(() => {
        try {
          const player = youtubePlayerRef.current;
          if (!player?.getCurrentTime) return;

          const time = player.getCurrentTime();
          setCurrentTime(time);
          onTimeUpdate?.(time);
        } catch {
          //
        }
      }, 500);
    }

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [videoUrl, isYoutube, onTimeUpdate]);

  const visibleNote =
    visibleNoteId != null ? timedNotes.find(note => note.id === visibleNoteId) || null : null;

  return (
    <div className="w-full h-full relative mb-4">
      {isLoadingNext && (
        <div className="absolute inset-0 z-20 bg-white/90 flex items-center justify-center text-2xl font-semibold text-purple-600 animate-pulse">
          Moving to the next lesson...
        </div>
      )}

      {visibleNote && (
        <div className="absolute right-4 bottom-4 z-30 max-w-sm rounded-xl bg-black/80 text-white px-4 py-3 shadow-xl border border-white/10">
          <div className="text-xs text-purple-200 mb-1">
            Note at {formatTime(visibleNote.timestampSec)}
          </div>
          <div className="text-sm leading-5">{visibleNote.content}</div>
        </div>
      )}

      {isYoutube && (
        <YouTube
          videoId={ytId!}
          className="w-full h-full"
          iframeClassName="w-full h-full"
          opts={{
            width: '100%',
            height: '100%',
            playerVars: { autoplay: 0 },
          }}
          onReady={(event: YouTubeEvent) => {
            youtubePlayerRef.current = event.target;
          }}
          onEnd={onVideoEnded}
        />
      )}

      {!isYoutube && isMp4 && (
        <video
          ref={htmlVideoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          onEnded={onVideoEnded}
          onTimeUpdate={e => {
            const time = e.currentTarget.currentTime;
            setCurrentTime(time);
            onTimeUpdate?.(time);
          }}
        />
      )}

      {!isYoutube && !isMp4 && (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600">
          Invalid video URL
        </div>
      )}
    </div>
  );
}