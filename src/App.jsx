import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { VideoPlayerProvider, useVideoPlayer } from './context/VideoPlayerContext';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import './App.css';

function AppContent() {
  const location = useLocation();
  const { showPlayer, minimized } = useVideoPlayer();
  const isWatchRoute = location.pathname.startsWith('/watch');

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:categorySlug/:videoSlug" element={null} />
      </Routes>
      {showPlayer && <VideoPlayer fullscreen={!minimized} />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VideoPlayerProvider>
        <AppContent />
      </VideoPlayerProvider>
    </BrowserRouter>
  );
}
