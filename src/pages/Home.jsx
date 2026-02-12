import { useRef, useEffect } from 'react';
import VideoCard from '../components/VideoCard';
import { useVideoPlayer } from '../context/VideoPlayerContext';
import { videoData } from '../data/videos';
import './Home.css';

export default function Home() {
  const scrollRef = useRef(null);
  const { minimized } = useVideoPlayer();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <main className={`home ${minimized ? 'mini-player-visible' : ''}`} ref={scrollRef}>
      <header className="home-header">
        <h1>Dino Venture</h1>
        <p>Learn AI with short, impactful videos</p>
      </header>

      <div className="video-feed">
        {videoData.categories.map(({ category, contents }) => (
          <section key={category.slug} className="category-section">
            <div className="category-header">
              <img
                src={category.iconUrl}
                alt=""
                className="category-icon"
              />
              <h2 className="category-title">{category.name}</h2>
            </div>
            <div className="video-grid">
              {contents.map((video) => (
                <VideoCard
                  key={video.slug}
                  video={video}
                  category={category}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
