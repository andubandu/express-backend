export function generateBunnyPlaybackUrl(videoId, libraryId) {
  if (!videoId || !libraryId) {
    throw new Error('Video ID and Library ID are required for Bunny playback URL');
  }
  
  return `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
}

export function isValidBunnyVideoId(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(videoId);
}