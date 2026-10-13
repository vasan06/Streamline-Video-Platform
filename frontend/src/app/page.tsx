"use client";

import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import { Video } from "@/types";
import { listVideos } from "@/services/video";
import VideoCard from "@/components/VideoCard";
import SearchBar from "@/components/SearchBar";

function VideoSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-video rounded-lg bg-surface-2 border border-border" />
          <div className="mt-3 h-3 w-3/4 rounded bg-surface-2" />
          <div className="mt-2 h-3 w-1/2 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    function load(showSkeleton = false) {
      if (showSkeleton) setLoading(true);
      listVideos(search || undefined)
      .then((data) => {
          if (active) {
            setVideos(data);
            setError("");
          }
      })
      .catch(() => {
        if (active) setError("Couldn't load videos. Check that the API is running.");
      })
      .finally(() => {
          if (active) setLoading(false);
      });
    }

    load(true);
    const interval = window.setInterval(() => load(false), 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [search]);

  return (
    <div className="px-6 py-6 md:px-10 md:py-8">
      <div className="mb-8">
        <SearchBar onSearch={setSearch} placeholder="Search videos by title" />
      </div>

      <h1 className="font-display text-2xl font-bold mb-6">
        {search ? `Results for "${search}"` : "Browse"}
      </h1>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && <VideoSkeletonGrid />}

      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center text-text-muted py-20 gap-3">
          <Film size={36} />
          <p>
            {search
              ? "No videos match that search."
              : "No videos yet. Check back soon."}
          </p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
