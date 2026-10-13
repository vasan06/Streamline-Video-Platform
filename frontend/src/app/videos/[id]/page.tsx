"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Heart, AlertTriangle, Loader2 } from "lucide-react";
import { Video } from "@/types";
import { getVideo, logWatch, addFavorite, removeFavorite, getMyFavorites } from "@/services/video";
import { useAuth } from "@/context/AuthContext";
import VideoPlayer from "@/components/VideoPlayer";

export default function WatchPage() {
  const params = useParams();
  const videoId = Number(params.id);
  const { user } = useAuth();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let active = true;
    getVideo(videoId)
      .then((v) => {
        if (active) setVideo(v);
      })
      .catch(() => {
        if (active) setError("This video could not be found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [videoId]);

  useEffect(() => {
    if (!user) return;
    getMyFavorites()
      .then((favs) => setIsFavorite(favs.some((f) => f.id === videoId)))
      .catch(() => {});
  }, [user, videoId]);

  const handleProgress = useCallback(
    (seconds: number) => {
      if (!user) return;
      logWatch(videoId, seconds).catch(() => {});
    },
    [user, videoId]
  );

  async function toggleFavorite() {
    if (!user) return;
    try {
      if (isFavorite) {
        await removeFavorite(videoId);
        setIsFavorite(false);
      } else {
        await addFavorite(videoId);
        setIsFavorite(true);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
        <AlertTriangle className="text-accent" size={32} />
        <p className="text-text-muted">{error || "Video not found."}</p>
      </div>
    );
  }

  if (video.status !== "ready" || !video.master_playlist_url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
        <AlertTriangle className="text-accent" size={32} />
        <p className="text-text-muted">
          This video is still processing. Check back in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-10 md:py-8 max-w-5xl mx-auto">
      <VideoPlayer
        src={video.master_playlist_url}
        title={video.title}
        onProgress={handleProgress}
      />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold">{video.title}</h1>
          {video.description && (
            <p className="text-sm text-text-muted mt-1">{video.description}</p>
          )}
        </div>

        {user && (
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm shrink-0 ${
              isFavorite ? "text-accent border-accent" : "text-text-muted hover:text-text"
            }`}
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "Favorited" : "Favorite"}
          </button>
        )}
      </div>
    </div>
  );
}
