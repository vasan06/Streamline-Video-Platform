export interface User {
  id: number;
  email: string;
  name?: string | null;
  role: "admin" | "user";
  created_at: string;
}

export interface Video {
  id: number;
  title: string;
  description?: string | null;
  status: "pending" | "processing" | "ready" | "failed";
  thumbnail_url?: string | null;
  master_playlist_url?: string | null;
  renditions: string[];
  processing_error?: string | null;
  estimated_seconds?: number | null;
  duration_seconds?: number | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface VideoPlayStats {
  video_id: number;
  title: string;
  total_plays: number;
  unique_viewers: number;
  avg_watch_duration: number;
}

export interface UserActivity {
  user_id: number;
  email: string;
  name?: string | null;
  total_watch_time: number;
  videos_watched: number;
  last_active?: string | null;
}

export interface UserVideoLog {
  video_id: number;
  video_title: string;
  play_count: number;
  total_watch_duration: number;
  last_watched: string;
}

export interface RepeatedVideo {
  video_id: number;
  title: string;
  user_id: number;
  user_email: string;
  play_count: number;
}
