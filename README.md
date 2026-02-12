# Dino Venture — Video Player App

Mobile-first video player experience built with **React** + **Vite**, inspired by the YouTube mobile UI.

## Links

- **Live app**: [dino-venture-frontend-enginner.vercel.app](https://dino-venture-frontend-enginner.vercel.app/)
- **GitHub**: [Dino_Venture_Frontend-Enginner](https://github.com/akkuu1810/Dino_Venture_Frontend-Enginner)

## Features

- **Scrollable home feed** grouped by category
- **Video cards** with thumbnail, title, duration badge, and category badge
- **Watch route support** (`/watch/:categorySlug/:videoSlug`) for shareable links
- **Full-screen + mini player** experience
- **Custom controls**: play/pause, ±10s skip, seekable progress bar, time display
- **Related videos panel**: swipe up on mobile / sidebar on desktop
- **Smooth transitions** between views
- **Mobile-first touch handling** for dragging and gestures

## Tech stack

- **React 18**
- **Vite 5**
- **React Router DOM 6**
- **YouTube Iframe API**

## Getting started (local)

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Open `http://localhost:5173`

## Scripts

```bash
npm run dev       # start dev server
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
npm run lint      # run eslint
```

## Video durations on cards

Durations are shown on video cards from the start when you provide a **YouTube Data API v3** key.

**Local dev:** create `.env.local` in the project root:

```
VITE_YOUTUBE_API_KEY=your_api_key_here
```

**Vercel:** add `VITE_YOUTUBE_API_KEY` in Project → Settings → Environment Variables, then redeploy.

1. Create a key at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable **YouTube Data API v3** for your project

Without the key, durations appear after you play each video (and are cached in localStorage).

## Deployment (Vercel)

This app is deployed on Vercel. For React Router deep links (e.g. `/watch/...`) to work on refresh, ensure the repo includes a rewrite rule (see `vercel.json`).

Typical Vercel settings:

- **Framework preset**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist`

## Project structure

```
src/
├── components/     # VideoCard, YouTubePlayer
├── context/        # VideoPlayerContext
├── data/           # Video dataset
├── pages/          # Home, VideoPlayer
├── utils/          # YouTube API helpers
├── App.jsx
├── main.jsx
└── index.css
```

## Roadmap (nice-to-haves)

- Search + filters
- Keyboard shortcuts (space/k, j/l, arrows)
- Persist player state (last watched) in localStorage
- Basic analytics (video open, play/pause events)
