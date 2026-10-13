import { apiFetch } from "./api";
import {
  Video,
  VideoPlayStats,
  UserActivity,
  UserVideoLog,
  RepeatedVideo,
} from "@/types";

export async function listVideos(search?: string): Promise<Video[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<Video[]>(`/videos${qs}`);
}

export async function getVideo(id: number): Promise<Video> {
  return apiFetch<Video>(`/videos/${id}`);
}

export async function logWatch(videoId: number, watchDuration: number) {
  return apiFetch(`/videos/watch-log`, {
    method: "POST",
    body: JSON.stringify({ video_id: videoId, watch_duration: watchDuration }),
  });
}

export async function addFavorite(videoId: number) {
  return apiFetch(`/videos/${videoId}/favorite`, { method: "POST" });
}

export async function removeFavorite(videoId: number) {
  return apiFetch(`/videos/${videoId}/favorite`, { method: "DELETE" });
}

export async function getMyFavorites(): Promise<Video[]> {
  return apiFetch<Video[]>(`/videos/favorites/me`);
}

export async function getMyHistory(): Promise<Video[]> {
  return apiFetch<Video[]>(`/videos/history/me`);
}

export async function uploadVideo(
  title: string,
  description: string,
  file: File
): Promise<{ video: Video; message: string }> {
  const init = await apiFetch<{ video: Video; upload_url: string; message: string }>(
    `/uploads/initiate`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
        filename: file.name,
        content_type: file.type || "application/octet-stream",
      }),
    }
  );

  const upload = await fetch(init.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!upload.ok) {
    throw new Error("S3 upload failed. Check bucket CORS and presigned URL permissions.");
  }

  return apiFetch(`/uploads/${init.video.id}/confirm`, { method: "POST" });
}

export async function deleteVideo(id: number) {
  return apiFetch(`/uploads/${id}`, { method: "DELETE" });
}

export async function getUploadStatus(id: number): Promise<Video> {
  return apiFetch<Video>(`/uploads/status/${id}`);
}

// Analytics (admin)
export async function getVideoStats(): Promise<VideoPlayStats[]> {
  return apiFetch<VideoPlayStats[]>(`/analytics/video-stats`);
}

export async function getUserActivity(): Promise<UserActivity[]> {
  return apiFetch<UserActivity[]>(`/analytics/user-activity`);
}

export async function getUserVideoLogs(userId: number): Promise<UserVideoLog[]> {
  return apiFetch<UserVideoLog[]>(`/analytics/user/${userId}/logs`);
}

export async function getRepeatedVideos(): Promise<RepeatedVideo[]> {
  return apiFetch<RepeatedVideo[]>(`/analytics/repeated-videos`);
}
