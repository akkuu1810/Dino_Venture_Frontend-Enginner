# Dino Venture - Video Player App

A mobile-first video player application built with **React 18** and **Vite**, inspired by the YouTube mobile experience.

## Features

- **Home Page** – Scrollable video feed grouped by category (Social Media AI, AI Income, AI Essentials)
- **Video Cards** – Thumbnail, title, duration badge, and category badge
- **Full-Page Video Player** – Auto-play, custom controls (play/pause, ±10s skip, seekable progress bar, time display)
- **In-Player Video List** – Swipe up (mobile) or sidebar (desktop) to reveal related videos from the same category
- **Smooth Transitions** – Fade animations between views

## Tech Stack

- React 18
- Vite 5
- React Router DOM 6
- YouTube Iframe API (for embedded videos)

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/     # VideoCard, YouTubePlayer
├── data/           # Video dataset
├── pages/          # Home, VideoPlayer
├── utils/          # YouTube API helper
├── App.jsx
├── main.jsx
└── index.css
```
