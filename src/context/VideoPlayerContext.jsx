import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getVideoById, getCategoryInfo } from '../data/videos';
import { loadDurationCache, saveDurationCache } from '../utils/durationStorage';

const VideoPlayerContext = createContext(null);

export function VideoPlayerProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/watch')) {
      setMinimized(false);
    }
  }, [location.pathname]);
  const [video, setVideoState] = useState(null);
  const [category, setCategoryState] = useState(null);
  const [durationCache, setDurationCacheState] = useState(() => loadDurationCache());

  useEffect(() => {
    saveDurationCache(durationCache);
  }, [durationCache]);

  const setDurationForVideo = useCallback((slug, seconds) => {
    setDurationCacheState((prev) => {
      if (prev[slug] === seconds) return prev;
      const next = { ...prev, [slug]: seconds };
      saveDurationCache(next);
      return next;
    });
  }, []);

  const setVideo = useCallback((v, c) => {
    setVideoState(v);
    setCategoryState(c);
  }, []);

  const minimize = useCallback(() => {
    setMinimized(true);
    navigate('/', { replace: true });
  }, [navigate]);

  const restore = useCallback(() => {
    setMinimized(false);
    if (video && category) {
      navigate(`/watch/${category.slug}/${video.slug}`, {
        replace: true,
        state: { video, category }
      });
    }
  }, [video, category, navigate]);

  const close = useCallback(() => {
    setMinimized(false);
    setVideoState(null);
    setCategoryState(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const openVideo = useCallback((v, c) => {
    setVideoState(v);
    setCategoryState(c);
    setMinimized(false);
    navigate(`/watch/${c.slug}/${v.slug}`, { state: { video: v, category: c } });
  }, [navigate]);

  const isWatchRoute = location.pathname.startsWith('/watch');
  const hasActiveVideo = video && category;
  const showPlayer = isWatchRoute || (minimized && hasActiveVideo);

  return (
    <VideoPlayerContext.Provider
      value={{
        video,
        category,
        minimized,
        setVideo,
        setDurationForVideo,
        durationCache,
        minimize,
        restore,
        close,
        openVideo,
        showPlayer,
        hasActiveVideo
      }}
    >
      {children}
    </VideoPlayerContext.Provider>
  );
}

export function useVideoPlayer() {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  return ctx;
}
