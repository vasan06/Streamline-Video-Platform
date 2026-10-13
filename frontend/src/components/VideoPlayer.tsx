"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { resolveMediaUrl } from "@/services/api";

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgress?: (seconds: number) => void;
}

interface Level {
  index: number;
  height: number;
  label: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? m.toString().padStart(2, "0") : m.toString();
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function VideoPlayer({ src, title, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [cinematic, setCinematic] = useState(false);

  const fullUrl = resolveMediaUrl(src);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !fullUrl) return;

    setError(null);
    setBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(fullUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        const parsedLevels: Level[] = data.levels.map((lvl, idx) => ({
          index: idx,
          height: lvl.height || 0,
          label: lvl.height ? `${lvl.height}p` : `Level ${idx}`,
        }));
        setLevels(parsedLevels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
        setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
      });

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          setError("Unable to load this video. Please try again.");
          setBuffering(false);
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = fullUrl;
    } else {
      setError("HLS playback is not supported in this browser.");
      setBuffering(false);
    }
  }, [fullUrl]);

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onCanPlay = () => setBuffering(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // Report progress periodically
  useEffect(() => {
    if (!onProgress) return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        onProgress(Math.floor(video.currentTime));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [onProgress]);

  // Fullscreen state listener
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setError("Playback was blocked. Try clicking play again."));
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const t = parseFloat(e.target.value);
    video.currentTime = t;
    setCurrentTime(t);
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function selectQuality(levelIndex: number) {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = levelIndex; // -1 = auto
    setCurrentLevel(levelIndex);
    setShowQualityMenu(false);
  }

  function retry() {
    const video = videoRef.current;
    if (!video || !fullUrl) return;
    setError(null);
    setBuffering(true);
    if (hlsRef.current) {
      hlsRef.current.loadSource(fullUrl);
    } else {
      video.src = fullUrl;
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden group ${
        cinematic ? "aspect-[21/9]" : "aspect-video"
      } transition-all`}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
        playsInline
      />

      {buffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-center px-4">
          <AlertTriangle className="text-accent" size={32} />
          <p className="text-sm text-text-muted max-w-xs">{error}</p>
          <button
            onClick={retry}
            className="flex items-center gap-2 text-sm bg-surface-2 hover:bg-surface px-4 py-2 rounded-lg"
          >
            <RotateCcw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Center play/pause overlay */}
      {!error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={playing ? "Pause" : "Play"}
        >
          <span className="bg-black/40 rounded-full p-4">
            {playing ? <Pause size={28} /> : <Play size={28} />}
          </span>
        </button>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pt-8 pb-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 accent-[var(--accent)] cursor-pointer mb-2"
          aria-label="Seek"
        />

        <div className="flex items-center gap-3 text-sm">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 accent-[var(--accent)] cursor-pointer"
            aria-label="Volume"
          />

          <span className="text-xs text-text-muted tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <span className="flex-1 truncate text-xs text-text-muted px-2">{title}</span>

          {/* Quality selector */}
          {levels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu((s) => !s)}
                aria-label="Quality settings"
                className="flex items-center gap-1"
              >
                <Settings size={16} />
                <span className="text-xs">
                  {currentLevel === -1 ? "Auto" : levels[currentLevel]?.label}
                </span>
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-8 right-0 bg-surface border border-border rounded-lg overflow-hidden text-xs min-w-24 shadow-lg">
                  <button
                    onClick={() => selectQuality(-1)}
                    className={`block w-full text-left px-3 py-2 hover:bg-surface-2 ${
                      currentLevel === -1 ? "text-accent" : ""
                    }`}
                  >
                    Auto
                  </button>
                  {levels
                    .slice()
                    .sort((a, b) => b.height - a.height)
                    .map((lvl) => (
                      <button
                        key={lvl.index}
                        onClick={() => selectQuality(lvl.index)}
                        className={`block w-full text-left px-3 py-2 hover:bg-surface-2 ${
                          currentLevel === lvl.index ? "text-accent" : ""
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Cinematic toggle */}
          <button
            onClick={() => setCinematic((c) => !c)}
            title="Cinematic view"
            className={`text-xs px-2 py-1 rounded ${
              cinematic ? "text-accent" : "text-text-muted hover:text-text"
            }`}
          >
            Cinema
          </button>

          <button onClick={toggleFullscreen} aria-label="Fullscreen">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
