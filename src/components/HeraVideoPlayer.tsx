import React, { useState, useEffect, useCallback } from "react";
import { Play, Video, Loader2 } from "lucide-react";
import type { VideoScript } from "../types/edgeElevate";

interface HeraVideoPlayerProps {
  videoScript: VideoScript | null;
  brandName: string;
}

export function HeraVideoPlayer({ videoScript, brandName }: HeraVideoPlayerProps) {
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for video completion
  useEffect(() => {
    if (!videoJobId || videoUrl) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/video-status/${videoJobId}`);
        const data = await res.json();
        if (data.status === "completed" && data.video_url) {
          setVideoUrl(data.video_url);
          setIsGenerating(false);
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setError("Video generation failed");
          setIsGenerating(false);
          clearInterval(pollInterval);
        }
      } catch {
        // Keep polling on network errors
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [videoJobId, videoUrl]);

  const handleGenerateVideo = useCallback(async () => {
    if (!videoScript || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);

    try {
      const res = await fetch("http://localhost:8000/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_script: videoScript,
          brand_name: brandName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to start video generation");
      }

      const data = await res.json();
      setVideoJobId(data.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setIsGenerating(false);
    }
  }, [videoScript, brandName, isGenerating]);

  return (
    <div className="glass-panel rounded-lg p-5">
      <label className="text-sm font-bold tracking-widest uppercase text-[var(--ink)] mb-4 block">
        HERA Visual Narrative Engine
      </label>

      {/* Video Display Area */}
      <div className="video-placeholder aspect-video rounded-lg overflow-hidden relative group cursor-pointer mb-3">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
            autoPlay
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent)]/5 group-hover:bg-[var(--accent)]/10 transition-colors">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="text-[var(--accent)] animate-spin" size={32} />
                <span className="text-xs text-[var(--ink-muted)]">Generating...</span>
              </div>
            ) : (
              <div className="video-play-button flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 transition-all glow-primary">
                <Play className="text-[var(--accent)]" size={24} />
              </div>
            )}
          </div>
        )}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 surface-1 backdrop-blur rounded-lg">
          <div className={`status-dot ${isGenerating ? "status-dot-warning" : "status-dot-primary"}`}></div>
          <div className="text-xs text-[var(--ink-muted)] font-mono font-bold">
            {isGenerating ? "RENDERING" : videoUrl ? "READY" : "SIM_ACTIVE"}
          </div>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="tag-primary text-xs px-3 py-1.5 rounded-lg font-bold uppercase font-mono tracking-widest">
            CEO_SCRIPT_DRAFTER
          </div>
        </div>
      </div>

      {/* Video Script Display */}
      <div className="surface-1 rounded-lg p-4 overflow-y-auto max-h-[150px] mb-4">
        {videoScript && !("parse_error" in videoScript) ? (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">
              {videoScript.title}
            </h3>
            <p className="text-sm text-[var(--ink-dim)] leading-relaxed line-clamp-3">
              {videoScript.description}
            </p>
            <div className="text-[10px] text-[var(--ink-muted)] font-mono">
              Duration: {videoScript.duration_minutes} min
            </div>
          </div>
        ) : (
          <div className="text-xs text-[var(--ink-dim)] italic">
            Synthesizing executive narrative flow...
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-400 mb-3 p-2 bg-red-500/10 rounded">
          {error}
        </div>
      )}

      {/* Generate Video Button */}
      <button
        onClick={handleGenerateVideo}
        disabled={isGenerating || !videoScript}
        className="btn-primary px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Video size={14} />
            <span>Generate Video</span>
          </>
        )}
      </button>
    </div>
  );
}
