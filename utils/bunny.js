/**
 * Utility functions for Bunny.net video streaming
 */

/**
 * Generate Bunny CDN playback URL from video ID
 * @param {string} videoId - The Bunny.net video ID
 * @param {string} libraryId - The Bunny.net library ID (from environment)
 * @returns {string} - The CDN playback URL
 */
export function generateBunnyPlaybackUrl(videoId, libraryId) {
  if (!videoId || !libraryId) {
    throw new Error('Video ID and Library ID are required for Bunny playback URL');
  }
  
  // Bunny.net CDN playback URL format
  return `https://vz-${libraryId}.b-cdn.net/${videoId}/playlist.m3u8`;
}

/**
 * Validate Bunny video ID format
 * @param {string} videoId - The video ID to validate
 * @returns {boolean} - Whether the video ID is valid
 */
export function isValidBunnyVideoId(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return false;
  }
  
  // Basic validation - Bunny video IDs are typically UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(videoId);
}