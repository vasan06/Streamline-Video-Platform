import Link from "next/link";
import { Film, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Video } from "@/types";
import { resolveMediaUrl } from "@/services/api";

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoCard({ video }: { video: Video }) {
  const thumb = resolveMediaUrl(video.thumbnail_url);

  const card = (
    <div className="group">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2 border border-border">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <Film size={32} />
          </div>
        )}

        {video.duration_seconds ? (
          <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(video.duration_seconds)}
          </span>
        ) : null}

        {video.status === "processing" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Processing
          </div>
        )}
        {video.status === "failed" && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-sm text-red-400">
            <AlertCircle size={16} />
            Processing failed
          </div>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium truncate group-hover:text-accent transition-colors">
        {video.title}
      </h3>
      {video.description && (
        <p className="text-xs text-text-muted truncate">{video.description}</p>
      )}
    </div>
  );

  if (video.status !== "ready") {
    return <div className="cursor-default opacity-80">{card}</div>;
  }

  return <Link href={`/videos/${video.id}`}>{card}</Link>;
}
