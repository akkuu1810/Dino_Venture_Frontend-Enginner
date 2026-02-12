/**
 * Fetches video durations from YouTube Data API v3.
 * Requires VITE_YOUTUBE_API_KEY to be set.
 * Duration is returned in ISO 8601 (e.g. PT4M13S) - we parse to seconds.
 */

const API_BASE = 'https://www.googleapis.com/youtube/v3/videos';
const MAX_IDS_PER_REQUEST = 50;

function parseISO8601Duration(duration) {
  if (!duration || typeof duration !== 'string') return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

/**
 * @param {string[]} videoIds - YouTube video IDs
 * @param {(slug: string, seconds: number) => void} onResult - callback for each result
 * @returns {Promise<void>}
 */
export async function fetchVideoDurations(videoIds, onResult) {
  const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY;
  if (!apiKey || !videoIds?.length) return;

  const ids = [...new Set(videoIds)].filter(Boolean);
  for (let i = 0; i < ids.length; i += MAX_IDS_PER_REQUEST) {
    const batch = ids.slice(i, i + MAX_IDS_PER_REQUEST);
    const url = `${API_BASE}?part=contentDetails&id=${batch.join(',')}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.items) continue;
      for (const item of json.items) {
        const id = item?.id;
        const dur = item?.contentDetails?.duration;
        if (id && dur != null) {
          const seconds = parseISO8601Duration(dur);
          if (seconds > 0) onResult(id, seconds);
        }
      }
    } catch (_) {
      break;
    }
  }
}
