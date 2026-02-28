interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 3600000; // 1 heure

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('YouTube API key is missing');
    }
  }

  private async fetchWithCache(url: string, cacheKey: string) {
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey)!;
      if (Date.now() - timestamp < this.cacheDuration) {
        return data;
      }
    }

    // Faire la requête
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
      const data = await response.json();
      
      // Mettre en cache
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('YouTube API fetch error:', error);
      throw error;
    }
  }

  // Rechercher des vidéos pour une destination
  async getVideosForDestination(destination: string, country: string, maxResults: number = 6): Promise<YouTubeVideo[]> {
    const cacheKey = `destination_${destination}_${country}`;
    const queries = [
      `${destination} ${country} travel guide`,
      `${destination} tourism`,
      `visit ${destination} ${country}`,
      `things to do in ${destination}`,
      `${destination} attractions`,
      `${destination} vlog`
    ];

    // Prendre une requête aléatoire pour varier les résultats
    const query = queries[Math.floor(Math.random() * queries.length)];
    
    try {
      const url = `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${this.apiKey}`;
      const data = await this.fetchWithCache(url, cacheKey);

      // Récupérer les durées
      const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
      const durations = await this.getVideoDurations(videoIds);

      return data.items.map((item: any, index: number) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: durations[index] || '00:00'
      }));
    } catch (error) {
      console.error('Error fetching destination videos:', error);
      return [];
    }
  }

  // Obtenir les durées des vidéos
  private async getVideoDurations(videoIds: string): Promise<string[]> {
    if (!videoIds) return [];
    
    try {
      const url = `${this.baseUrl}/videos?part=contentDetails&id=${videoIds}&key=${this.apiKey}`;
      const data = await this.fetchWithCache(url, `durations_${videoIds}`);
      
      return data.items.map((item: any) => {
        const duration = item.contentDetails.duration;
        return this.formatDuration(duration);
      });
    } catch (error) {
      console.error('Error fetching durations:', error);
      return [];
    }
  }

  // Formater la durée ISO 8601
  private formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    const hours = match?.[1] ? parseInt(match[1]) : 0;
    const minutes = match?.[2] ? parseInt(match[2]) : 0;
    const seconds = match?.[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Obtenir des vidéos par catégorie (culture, aventure, gastronomie)
  async getVideosByCategory(destination: string, country: string, category: string): Promise<YouTubeVideo[]> {
    const query = `${destination} ${country} ${category}`;
    return this.getVideosForDestination(destination, country, 4);
  }

  // Nettoyer le cache
  clearCache() {
    this.cache.clear();
  }
}

export const youtubeService = new YouTubeService();