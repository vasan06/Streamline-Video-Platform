"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UploadForm from "@/components/UploadForm";

export default function AdminUploadPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-text-muted" size={32} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
        <ShieldCheck size={32} className="text-text-muted" />
        <p className="text-text-muted">You need admin access to upload videos.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 md:px-10 md:py-8 max-w-2xl">
      <Link
        href="/admin"
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      <h1 className="font-display text-2xl font-bold mb-1">Upload a video</h1>
      <p className="text-sm text-text-muted mb-6">
        The source is stored in S3, then GitHub Actions uses ffmpeg to create original, 1080p, 720p, 480p, 360p, 240p, and 144p playback renditions.
      </p>

      <UploadForm />
    </div>
  );
}
