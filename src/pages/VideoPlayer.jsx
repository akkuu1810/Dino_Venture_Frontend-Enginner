import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import YouTubePlayer from '../components/YouTubePlayer';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import {
  getVideoById,
  getVideosByCategory,
  getCategoryInfo,
  getNextVideoInCategory,
  extractYoutubeId,
  videoData
} from '../data/videos';
import './VideoPlayer.css';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ fullscreen }) {
  const { categorySlug, videoSlug } = useParams();
  const location = useLocation();
  const { video: ctxVideo, category: ctxCategory, setVideo, setDurationForVideo, minimize, restore, close } = useVideoPlayer();
  const [video, setVideoState] = useState(ctxVideo || location.state?.video || getVideoById(videoSlug, categorySlug));
  const [category, setCategoryState] = useState(ctxCategory || location.state?.category || getCategoryInfo(categorySlug));
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [listVisible, setListVisible] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [nextVideo, setNextVideo] = useState(null);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const dragStartY = useRef(0);
  const listRef = useRef(null);
  const backButtonRef = useRef(null);
  const videoSlugRef = useRef(video?.slug);

  videoSlugRef.current = video?.slug;
  const videoId = extractYoutubeId(video?.mediaUrl) || extractYoutubeId(video?.slug);

  useEffect(() => {
    const v =
      location.state?.video ||
      getVideoById(videoSlug, categorySlug) ||
      ctxVideo;
    const c =
      location.state?.category ||
      getCategoryInfo(categorySlug) ||
      ctxCategory;
    if (v) setVideoState(v);
    if (c) setCategoryState(c);
    if (v && c) setVideo(v, c);
  }, [categorySlug, videoSlug, ctxVideo, ctxCategory, location.state, setVideo]);

  useEffect(() => {
    if (!fullscreen && !isPlaying && playerRef.current?.pauseVideo) {
      try {
        playerRef.current.pauseVideo();
      } catch (_) {}
    }
  }, [fullscreen, isPlaying]);

  useEffect(() => {
    if (!video || !category) {
      const fallback = videoData.categories[0];
      const v = fallback.contents[0];
      setVideoState(v);
      setCategoryState(fallback.category);
      setVideo(v, fallback.category);
      return;
    }
    const list = getVideosByCategory(category.slug).filter((v) => v.slug !== video.slug);
    setRelatedVideos(list);
  }, [video, category, setVideo]);

  const navigate = useNavigate();
  const handleVideoSelect = useCallback(
    (newVideo) => {
      setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setVideoState(newVideo);
      setVideo(newVideo, category);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      setIsReady(false);
      navigate(`/watch/${category.slug}/${newVideo.slug}`, { replace: true, state: { video: newVideo, category } });
    },
    [category, setVideo, navigate]
  );

  const handleBack = () => {
    if (fullscreen) {
      // On mobile, show suggested videos list when back is clicked
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (isMobile && !listVisible) {
        setListVisible(true);
        return;
      }
      if (!isPlaying && playerRef.current?.pauseVideo) {
        try {
          playerRef.current.pauseVideo();
        } catch (_) {}
      }
      minimize();
    }
  };

  const handlePlayerReady = useCallback(
    (ytPlayer) => {
      playerRef.current = ytPlayer;
      setIsReady(true);
      try {
        const d = ytPlayer.getDuration();
        if (Number.isFinite(d)) {
          setDuration(d);
          if (video?.slug) setDurationForVideo(video.slug, d);
        }
      } catch (_) {}
    },
    [video?.slug, setDurationForVideo]
  );

  const handleStateChange = useCallback((state) => {
    if (state === window.YT?.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressPolling();
    } else if (state === window.YT?.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopProgressPolling();
    } else if (state === window.YT?.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressPolling();
      const next = getNextVideoInCategory(video, category?.slug);
      if (next) {
        setNextVideo(next);
        setCountdown(2);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              handleVideoSelect(next);
              setNextVideo(null);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [video, category, handleVideoSelect]);

  const cancelCountdown = () => {
    setCountdown(null);
    setNextVideo(null);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startProgressPolling = () => {
    stopProgressPolling();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (Number.isFinite(t)) setCurrentTime(t);
          if (Number.isFinite(d)) {
            setDuration(d);
            const slug = videoSlugRef.current;
            if (slug && d > 0) setDurationForVideo(slug, d);
          }
          if (Number.isFinite(d) && d > 0) setProgress((t / d) * 100);
        } catch (_) {}
      }
    }, 250);
  };

  const stopProgressPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => () => {
    stopProgressPolling();
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState();
      if (state === window.YT?.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (_) {}
  };

  const skipForward = () => {
    if (!playerRef.current) return;
    try {
      const t = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.min(t + 10, duration || t + 10), true);
    } catch (_) {}
  };

  const skipBackward = () => {
    if (!playerRef.current) return;
    try {
      const t = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, t - 10), true);
    } catch (_) {}
  };

  const handleProgressClick = (e) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    playerRef.current.seekTo(x * duration, true);
  };

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (listVisible) return;
      setControlsVisible(false);
    }, 3000);
  };

  const hideControls = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setControlsVisible(false);
  };

  const getClientY = (e) => {
    if (e.type.startsWith('touch')) {
      return e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY;
    }
    return e.clientY;
  };

  const handlePointerDown = (e) => {
    if (!fullscreen) return;
    // Don't start dragging if clicking on the back button or list area
    if (backButtonRef.current && (backButtonRef.current.contains(e.target) || e.target.closest('.control-back-drag'))) {
      return;
    }
    // Don't start dragging if clicking on the list area
    if (e.target.closest('.in-player-list')) {
      return;
    }
    // Only prevent default on drag handle area to allow page scrolling elsewhere
    const target = e.target;
    const dragHandle = target.closest('.video-player-drag-handle');
    if (dragHandle) {
      e.preventDefault?.();
    }
    setIsDragging(true);
    dragStartY.current = getClientY(e);
    setDragY(0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    // Only prevent default if actually dragging (not just touching)
    if (Math.abs(getClientY(e) - dragStartY.current) > 5) {
      e.preventDefault?.();
    }
    const y = getClientY(e);
    const dy = y - dragStartY.current;
    if (dy > 0) setDragY(dy);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    let dy = dragY;
    if (e.type.startsWith('touch') && e.changedTouches?.[0]) {
      dy = e.changedTouches[0].clientY - dragStartY.current;
    } else if (e.clientY !== undefined) {
      dy = e.clientY - dragStartY.current;
    }
    if (dy > 80) {
      if (!isPlaying && playerRef.current?.pauseVideo) {
        try {
          playerRef.current.pauseVideo();
        } catch (_) {}
      }
      minimize();
    }
    setDragY(0);
    setIsDragging(false);
  };

  const toggleList = () => setListVisible((v) => !v);

  if (!video || !category) {
    return (
      <div className="video-player-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div
      className={`video-player ${fullscreen ? '' : 'mini'} ${listVisible ? 'list-open' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={!fullscreen ? restore : undefined}
      onPointerDown={fullscreen ? (e) => {
        // Only handle pointer events on drag handle area, not on list
        const dragHandle = e.target.closest('.video-player-drag-handle');
        const listArea = e.target.closest('.in-player-list');
        if (dragHandle && !listArea) {
          handlePointerDown(e);
        }
      } : undefined}
      onPointerMove={fullscreen ? (e) => {
        if (isDragging) {
          handlePointerMove(e);
        }
      } : undefined}
      onPointerUp={fullscreen ? (e) => {
        if (isDragging) {
          handlePointerUp(e);
        }
      } : undefined}
      onPointerLeave={fullscreen ? (e) => {
        if (isDragging) {
          handlePointerUp(e);
        }
      } : undefined}
      onTouchStart={fullscreen ? (e) => {
        // Only handle touch on drag handle, allow scrolling elsewhere
        const dragHandle = e.target.closest('.video-player-drag-handle');
        const listArea = e.target.closest('.in-player-list');
        if (dragHandle && !listArea) {
          handlePointerDown(e);
        }
      } : undefined}
      onTouchMove={fullscreen ? (e) => {
        // Only handle touch move if dragging
        if (isDragging) {
          handlePointerMove(e);
        }
      } : undefined}
      onTouchEnd={fullscreen ? (e) => {
        // Only handle touch end if dragging
        if (isDragging) {
          handlePointerUp(e);
        }
      } : undefined}
      onTouchCancel={fullscreen ? handlePointerUp : undefined}
    >
      {fullscreen && (
        <div
          className="video-player-drag-handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={(e) => { 
            e.stopPropagation(); 
            handlePointerDown(e); 
          }}
          onTouchMove={(e) => { 
            if (isDragging) {
              e.preventDefault(); 
              handlePointerMove(e); 
            }
          }}
          onTouchEnd={(e) => { 
            e.stopPropagation(); 
            handlePointerUp(e); 
          }}
          onTouchCancel={handlePointerUp}
        >
          <span className="video-player-drag-handle-bar" />
          <button 
            ref={backButtonRef}
            className="control-back control-back-drag" 
            onClick={(e) => { e.stopPropagation(); handleBack(); }} 
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleBack(); }}
            aria-label="Minimize"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
        </div>
      )}
      <div
        className={`video-player-viewport ${fullscreen ? 'fullscreen' : 'mini'}`}
        style={fullscreen ? { transform: `translateY(${dragY}px)` } : undefined}
        onClick={fullscreen ? (controlsVisible ? hideControls : showControls) : (e) => e.stopPropagation()}
      >
        <div className="youtube-wrapper">
          <YouTubePlayer
            videoId={videoId}
            autoplay={true}
            onReady={handlePlayerReady}
            onStateChange={handleStateChange}
          />
        </div>

        {fullscreen && (
          <>
          <div
            className={`video-controls ${controlsVisible ? 'visible' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="control-center">
            <button
              className="control-play"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="control-bottom">
            <div
              className="progress-bar"
              onClick={handleProgressClick}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
              <div className="progress-thumb" style={{ left: `${progress}%` }} />
            </div>
            <div className="control-actions">
              <button className="control-skip" onClick={skipBackward} aria-label="Rewind 10 seconds">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
                <span>10</span>
              </button>
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration) || '--:--'}
              </span>
              <button className="control-skip" onClick={skipForward} aria-label="Forward 10 seconds">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                </svg>
                <span>10</span>
              </button>
            </div>
          </div>
          </div>

          <button
            className={`reveal-list-btn ${listVisible ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleList();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              toggleList();
            }}
            aria-label={listVisible ? 'Hide list' : 'Show related videos'}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d={listVisible ? 'M7 10l5 5 5-5z' : 'M7 14l5-5 5 5z'} />
            </svg>
          </button>
          </>
        )}

        {!fullscreen && (
          <>
            <div className="video-player-mini-controls" onClick={(e) => e.stopPropagation()}>
              <button className="video-player-mini-play" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <span className="video-player-mini-title">{video.title}</span>
            </div>
            <button
              className="video-player-mini-close"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); close(); }}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); close(); }}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </button>
          </>
        )}
      </div>

      {fullscreen && countdown != null && nextVideo && (
        <div className="countdown-overlay">
          <div className="countdown-card">
            <p>Up next: {nextVideo.title}</p>
            <p className="countdown-number">{countdown}</p>
            <button className="countdown-cancel" onClick={cancelCountdown}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {fullscreen && (
      <div ref={listRef} className={`in-player-list ${listVisible ? 'visible' : ''}`}>
        <div className="in-player-list-header">
          <h3>Up Next</h3>
          <span className="category-tag">{category.name}</span>
        </div>
        <div className="in-player-list-scroll">
          {relatedVideos.map((v) => (
            <button
              key={v.slug}
              className={`in-player-list-item ${v.slug === video.slug ? 'active' : ''}`}
              onClick={() => handleVideoSelect(v)}
            >
              <img src={v.thumbnailUrl} alt="" />
              <div className="item-info">
                <span className="item-title">{v.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
