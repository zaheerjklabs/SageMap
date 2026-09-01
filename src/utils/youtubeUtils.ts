/**
 * YouTube and YouTube Playlist Utility Functions
 */

export interface YouTubeInfo {
  isYouTube: boolean;
  isPlaylist: boolean;
  videoId?: string;
  playlistId?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
}

/**
 * Parses any YouTube URL (single video, shorts, playlist, or video inside a playlist)
 */
export function parseYouTubeUrl(url?: string): YouTubeInfo {
  if (!url || typeof url !== 'string') {
    return { isYouTube: false, isPlaylist: false };
  }

  const trimmed = url.trim();

  // Check if URL is from a YouTube domain
  const isYouTube = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
  if (!isYouTube) {
    return { isYouTube: false, isPlaylist: false };
  }

  let videoId: string | undefined;
  let playlistId: string | undefined;

  // Extract playlist ID: list=PL... or list=UU... or list=RD... or list=...
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (listMatch && listMatch[1]) {
    playlistId = listMatch[1];
  }

  // Extract video ID: watch?v=..., youtu.be/..., embed/..., v/..., shorts/...
  const videoMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  if (videoMatch && videoMatch[1]) {
    videoId = videoMatch[1];
  }

  const isPlaylist = !!playlistId || trimmed.includes('/playlist');

  let thumbnailUrl: string | undefined;
  if (videoId) {
    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  let embedUrl: string | undefined;
  if (videoId && playlistId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}?list=${playlistId}`;
  } else if (playlistId) {
    embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
  } else if (videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}`;
  }

  return {
    isYouTube: true,
    isPlaylist,
    videoId,
    playlistId,
    thumbnailUrl,
    embedUrl
  };
}

/**
 * Checks if a given string or URL is a YouTube Playlist
 */
export function isYouTubePlaylist(url?: string, videoType?: string): boolean {
  if (videoType === 'Playlist') return true;
  const parsed = parseYouTubeUrl(url);
  return parsed.isYouTube && parsed.isPlaylist;
}

/**
 * Extracts a high-res thumbnail for YouTube or returns fallback
 */
export function getYouTubeThumbnailUrl(url?: string, customImageUrl?: string): string {
  if (customImageUrl && customImageUrl.trim()) {
    return customImageUrl.trim();
  }
  const parsed = parseYouTubeUrl(url);
  return parsed.thumbnailUrl || '';
}
