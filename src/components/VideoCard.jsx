import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { formatDuration } from '../data/videos';
import './VideoCard.css';

export default function VideoCard({ video, category }) {
  const navigate = useNavigate();
  const { durationCache } = useVideoPlayer();
  const [imageLoaded, setImageLoaded] = useState(false);
  const durationDisplay =
    video.duration != null
      ? formatDuration(video.duration)
      : durationCache[video.slug] != null
        ? formatDuration(durationCache[video.slug])
        : '—';

  const handleClick = () => {
    navigate(`/watch/${category.slug}/${video.slug}`, {
      state: { video, category }
    });
  };

  return (
    <article
      className="video-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="video-card-thumbnail">
        {!imageLoaded && <div className="video-card-skeleton" aria-hidden="true" />}
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={imageLoaded ? 'video-card-img-loaded' : ''}
        />
        <span className="video-card-duration">{durationDisplay}</span>
        <span className="video-card-category-badge">{category.name}</span>
      </div>
      <h3 className="video-card-title">{video.title}</h3>
    </article>
  );
}
