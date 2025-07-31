// YouTube Videos Configuration
// Simply add YouTube URLs here and the system will automatically:
// - Extract video IDs
// - Generate thumbnails
// - Create proper embed links

export const youtubeVideos = [
  'https://www.youtube.com/shorts/20-rmBDLbUw',
  'https://www.youtube.com/shorts/rTTZ7rEAl4g',
  'https://www.youtube.com/shorts/oI6_FyZPOUY',
  'https://www.youtube.com/shorts/buwVEneweuo',
  'https://www.youtube.com/shorts/RHt4mMfU2u4',
  'https://www.youtube.com/shorts/hRiWsFQyRwk',
  'https://www.youtube.com/shorts/NxZIqzqHfA4',
];

// Optional: Custom titles for videos (if you want to override auto-generated ones)
export const customTitles = {
  '20-rmBDLbUw': 'Master the Art of Farming',
  'rTTZ7rEAl4g': 'Organic Techniques Revealed',
  'oI6_FyZPOUY': 'Quick Tips for Urban Gardens',
  'buwVEneweuo': 'Experience Nature at Home',
  'RHt4mMfU2u4': 'Innovations in Organic Farming',
  'hRiWsFQyRwk': 'Garden Transformation Ideas',
  'NxZIqzqHfA4': 'Garden Transformation Ideas',
};

// Utility function to extract YouTube video ID from URL
export function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Utility function to generate YouTube thumbnail URL
export function generateThumbnailUrl(videoId, quality = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

// Utility function to generate embed URL
export function generateEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`;
}

// Static metadata for consistent hydration
const staticMetadata = [
  { views: '2.3K', timeAgo: '3 days ago', duration: '0:45' },
  { views: '1.8K', timeAgo: '1 week ago', duration: '0:58' },
  { views: '4.1K', timeAgo: '5 days ago', duration: '0:32' },
  { views: '3.2K', timeAgo: '2 days ago', duration: '1:12' },
  { views: '5.6K', timeAgo: '1 day ago', duration: '0:42' },
  { views: '2.9K', timeAgo: '4 days ago', duration: '1:08' },
  { views: '7.8K', timeAgo: '6 days ago', duration: '0:35' },
];

// Process all videos and return formatted data
export function getProcessedVideos() {
  return youtubeVideos.map((url, index) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.warn(`Invalid YouTube URL: ${url}`);
      return null;
    }

    // Use static metadata to avoid hydration mismatches
    const metadata = staticMetadata[index % staticMetadata.length];

    return {
      id: index + 1,
      title: customTitles[videoId] || `Farming Video ${index + 1}`,
      duration: metadata.duration,
      instructor: 'Nisargamitra Farm',
      youtubeId: videoId,
      shortsUrl: url,
      embedUrl: generateEmbedUrl(videoId),
      thumbnailUrl: generateThumbnailUrl(videoId),
      views: metadata.views,
      timeAgo: metadata.timeAgo,
    };
  }).filter(Boolean); // Remove any null entries from invalid URLs
}
