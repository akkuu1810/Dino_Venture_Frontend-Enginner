import { useEffect, useRef, useState } from 'react';
import { waitForYouTubeAPI } from '../utils/youtube';

export default function YouTubePlayer({
  videoId,
  autoplay = true,
  onReady,
  onStateChange
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [apiReady, setApiReady] = useState(!!window.YT?.Player);

  useEffect(() => {
    if (!window.YT?.Player) {
      waitForYouTubeAPI().then(() => setApiReady(true));
    }
  }, []);

  useEffect(() => {
    if (!videoId || !apiReady) return;

    const loadPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 0,
          disablekb: 0,
          fs: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (e) => onReady?.(e.target),
          onStateChange: (e) => onStateChange?.(e.data)
        }
      });
    };

    loadPlayer();
    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, autoplay, apiReady, onReady, onStateChange]);

  if (!apiReady) {
    return (
      <div className="youtube-player-container youtube-loading">
        <span>Loading player...</span>
      </div>
    );
  }

  return <div ref={containerRef} className="youtube-player-container" />;
}
