"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { youtubeService } from "@/lib/youtube";
import { Play, Clock, User, X, Youtube, Film, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
}

interface ItineraryVideosProps {
  destination: string;
  country: string;
}

export function ItineraryVideos({ destination, country }: ItineraryVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [category, setCategory] = useState("all");

  const categories = [
    { id: "all", label: "Tout", icon: Film },
    { id: "travel guide", label: "Guides", icon: Play },
    { id: "culture", label: "Culture", icon: "🏛️" },
    { id: "food", label: "Gastronomie", icon: "🍽️" },
    { id: "adventure", label: "Aventure", icon: "🏔️" },
  ];

  useEffect(() => {
    loadVideos();
  }, [destination, country, category]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      let results;
      if (category === "all") {
        results = await youtubeService.getVideosForDestination(destination, country, 8);
      } else {
        results = await youtubeService.getVideosByCategory(destination, country, category);
      }
      setVideos(results);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 rounded-2xl"
      style={{ background: "rgba(28,35,48,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <h3 className="font-heading font-semibold text-lg text-foreground">
            Découvrir {destination} en vidéo
          </h3>
        </div>
        
        {/* Filtres */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#0F1419" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-heading transition-all flex items-center gap-1"
              style={{
                background: category === cat.id ? "rgba(200,75,49,0.3)" : "transparent",
                color: category === cat.id ? "#E8694A" : "#7A6E62",
              }}
            >
              {typeof cat.icon === 'string' ? cat.icon : <cat.icon className="w-3 h-3" />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille vidéos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-terra-light" />
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -4 }}
              className="rounded-xl overflow-hidden cursor-pointer group"
              style={{ background: "#0F1419", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
                {video.duration && (
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white">
                    {video.duration}
                  </div>
                )}
              </div>
              
              <div className="p-2">
                <h4 className="font-heading font-medium text-xs text-foreground line-clamp-2 mb-1">
                  {video.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-stone-mist">
                  <User className="w-2.5 h-2.5" />
                  <span className="truncate">{video.channelTitle}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-mist">
          <Film className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune vidéo trouvée pour {destination}</p>
        </div>
      )}

      {/* Modal vidéo */}
      <AnimatePresence>
        {selectedVideo && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.95)" }}
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              <div className="mt-3 text-white">
                <h3 className="font-heading font-semibold text-lg">{selectedVideo.title}</h3>
                <p className="text-sm text-stone-mist">{selectedVideo.channelTitle}</p>
              </div>

              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-10 right-0 text-white hover:text-terra-light transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
