// app/api/youtube/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const maxResults = parseInt(searchParams.get("maxResults") || "2");
  
  console.log("📹 YouTube API called with query:", query);
  
  if (!query) {
    return NextResponse.json(
      { error: "Query parameter required", videos: [] },
      { status: 400 }
    );
  }

  // Check if API key is configured
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("⚠️ YouTube API key not configured");
    return NextResponse.json(
      { videos: [] },
      { status: 200 }
    );
  }

  try {
    console.log("📹 Fetching from YouTube API...");
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
        query
      )}&key=${process.env.YOUTUBE_API_KEY}&type=video&videoDuration=medium`
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ YouTube API error:", errorData);
      
      // Return empty array instead of error to prevent UI breaking
      return NextResponse.json(
        { videos: [], error: "YouTube API error" },
        { status: 200 }
      );
    }
    
    const data = await response.json();
    
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle
    }));

    console.log(`✅ Found ${videos.length} videos for:`, query);
    
    return NextResponse.json({ videos });
    
  } catch (error) {
    console.error("❌ YouTube API route error:", error);
    // Return empty array instead of error to prevent UI breaking
    return NextResponse.json(
      { videos: [], error: "Failed to fetch videos" },
      { status: 200 }
    );
  }
}