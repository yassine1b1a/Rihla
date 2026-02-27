// components/ui/VideoThumbnail.tsx
"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { VideoModal } from "./VideoModal";

interface VideoThumbnailProps {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
}

export function VideoThumbnail({ videoId, title, thumbnail, channel }: VideoThumbnailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsModalOpen(true)}
        className="relative group rounded-lg overflow-hidden flex-shrink-0 w-24 h-16"
      >
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-terra/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-[8px] p-1 bg-gradient-to-t from-black/80 to-transparent text-white/80 truncate">
          {channel}
        </div>
      </motion.button>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoId={videoId}
        title={title}
      />
    </>
  );
}