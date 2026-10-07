// Event Memories — photos from Build Expo 2026 (stored locally in public/memories).
// Day 1 = 25 Sep 2026 album, Day 2 = 26 Sep 2026 album.
// Original Google Photos albums (for "download all" / full-album view).
export const DAY1_ALBUM_URL = 'https://photos.app.goo.gl/Yt5UceSynYXpw5Qt8';
export const DAY2_ALBUM_URL = 'https://photos.app.goo.gl/MQHk4UQfJAGurrPC7';

export const DAY1_PHOTOS: string[] = Array.from(
  { length: 29 },
  (_, i) => `/memories/day1-${String(i + 1).padStart(2, '0')}.jpg`
);

export const DAY2_PHOTOS: string[] = Array.from(
  { length: 24 },
  (_, i) => {
    const n = i < 9 ? i + 1 : i + 7;
    return `/memories/day2-${String(n).padStart(2, '0')}.jpg`;
  }
);

// Backwards-compatible: all photos (Day 1 + Day 2).
export const MEMORIES: string[] = [...DAY1_PHOTOS, ...DAY2_PHOTOS];
