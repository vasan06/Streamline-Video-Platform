"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, CheckCircle, XCircle } from "lucide-react";
import { getUploadStatus, uploadVideo } from "@/services/video";
import { ApiError } from "@/services/api";

export default function UploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Choose a video file to upload.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading source to S3...");

    try {
      const res = await uploadVideo(title, description, file);
      setMessage(res.message);
      setTitle("");
      setDescription("");
      setFile(null);

      let current = res.video;
      for (let attempt = 0; attempt < 120 && current.status === "processing"; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        current = await getUploadStatus(res.video.id);
        setMessage(
          current.estimated_seconds
            ? `Processing renditions. Estimated ${Math.ceil(current.estimated_seconds / 60)} min remaining.`
            : "Processing renditions..."
        );
      }

      if (current.status === "ready") {
        setStatus("success");
        setMessage("Video uploaded and ready to watch.");
        router.push(`/videos/${current.id}`);
      } else {
        setStatus(current.status === "failed" ? "error" : "success");
        setMessage(
          current.status === "failed"
            ? current.processing_error || "Upload finished but processing failed."
            : "Upload confirmed. Processing will continue in GitHub Actions."
        );
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm mb-1 text-text-muted">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          placeholder="Video title"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-text-muted">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          placeholder="What's this video about?"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-text-muted">Video file</label>
        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg py-8 cursor-pointer hover:border-accent transition-colors">
          <UploadCloud size={28} className="text-text-muted" />
          <span className="text-sm text-text-muted">
            {file ? file.name : "Click to choose a video file"}
          </span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "uploading"}
        className="flex items-center justify-center gap-2 w-full bg-accent text-black font-medium rounded-lg py-2.5 disabled:opacity-60"
      >
        {status === "uploading" && <Loader2 size={16} className="animate-spin" />}
        {status === "uploading" ? "Uploading..." : "Upload video"}
      </button>

      {message && (
        <div
          className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            status === "error"
              ? "bg-red-950/40 text-red-400"
              : status === "success"
              ? "bg-green-950/40 text-green-400"
              : "bg-surface text-text-muted"
          }`}
        >
          {status === "error" && <XCircle size={16} />}
          {status === "success" && <CheckCircle size={16} />}
          {status === "uploading" && <Loader2 size={16} className="animate-spin" />}
          {message}
        </div>
      )}
    </form>
  );
}
