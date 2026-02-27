// lib/youtube.ts
import { VideoResult } from "@/types";

// Simple in-memory cache with TTL
interface CacheEntry {
  videos: VideoResult[];
  timestamp: number;
}

const videoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function searchYouTubeVideos(
  query: string, 
  maxResults: number = 2
): Promise<VideoResult[]> {
  // Check cache first
  const cacheKey = `${query}-${maxResults}`;
  const cached = videoCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log("🎥 Using cached videos for:", query);
    return cached.videos;
  }

  try {
    console.log("🎥 Fetching YouTube videos for:", query);
    
    const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
    
    if (!response.ok) {
      console.warn(`YouTube API returned ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Cache the results
    videoCache.set(cacheKey, {
      videos: data.videos || [],
      timestamp: Date.now()
    });
    
    return data.videos || [];
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    return [];
  }
}

// Helper to create search query for a destination
export function createDestinationSearchQuery(
  destinationName: string,
  country: string,
  activity?: string
): string {
  // Clean up the destination name
  const cleanName = destinationName.replace(/[^\w\s]/gi, ' ').trim();
  
  // Create more effective search queries based on activity
  const activityLower = activity?.toLowerCase() || '';
  
  if (activityLower.includes('eat') || activityLower.includes('food') || activityLower.includes('restaurant')) {
    return `${cleanName} ${country} food guide`;
  } else if (activityLower.includes('beach') || activityLower.includes('sea')) {
    return `${cleanName} ${country} beach travel`;
  } else if (activityLower.includes('museum') || activityLower.includes('historical')) {
    return `${cleanName} ${country} museum tour`;
  } else if (activityLower.includes('market') || activityLower.includes('souk')) {
    return `${cleanName} ${country} market shopping`;
  } else {
    return `${cleanName} ${country} travel guide`;
  }
}

// Batch fetch with delay to avoid rate limiting
export async function batchFetchVideos(
  destinations: { name: string; country: string; activity?: string }[]
): Promise<Map<string, VideoResult[]>> {
  const results = new Map<string, VideoResult[]>();
  
  // Process with delay between requests
  for (const dest of destinations) {
    try {
      const query = createDestinationSearchQuery(dest.name, dest.country, dest.activity);
      const videos = await searchYouTubeVideos(query, 2);
      results.set(dest.name, videos);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Failed to fetch videos for ${dest.name}:`, error);
      results.set(dest.name, []);
    }
  }
  
  return results;
}