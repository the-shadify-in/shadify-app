"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import type { WeddingAudioConfig } from "@/lib/audio/types";

interface MusicToggleProps {
  audio?: WeddingAudioConfig;
  isEnvelopeOpened?: boolean;
  className?: string;
  variant?: "floating" | "navbar";
}

const STORAGE_KEY = "shadify_audio_muted";
const TARGET_VOLUME = 0.45;
const FADE_STEP_INTERVAL_MS = 50;
const FADE_DURATION_MS = 500;

export function MusicToggle({
  audio,
  isEnvelopeOpened = false,
  className = "",
  variant = "floating",
}: MusicToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Discriminator check: discriminated union narrows audio when enabled is true
  const activeAudio = audio?.enabled ? audio : null;
  const audioUrl = activeAudio?.url;

  // 1. Safe localStorage access
  const getStoredMutePreference = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  }, []);

  const setStoredMutePreference = useCallback((muted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
    } catch {
      // Safe fallback when localStorage is restricted
    }
  }, []);

  // 2. Smooth volume fader
  const fadeVolume = useCallback((targetVol: number, onComplete?: () => void) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const audioElement = audioRef.current;
    if (!audioElement) return;

    const startVol = audioElement.volume;
    const diff = targetVol - startVol;
    const steps = Math.max(1, Math.floor(FADE_DURATION_MS / FADE_STEP_INTERVAL_MS));
    const stepDelta = diff / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (!audioRef.current) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        return;
      }

      const nextVol = Math.max(0, Math.min(1, startVol + stepDelta * currentStep));
      audioRef.current.volume = nextVol;

      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        audioRef.current.volume = targetVol;
        onComplete?.();
      }
    }, FADE_STEP_INTERVAL_MS);
  }, []);

  // 3. Audio instance lifecycle
  useEffect(() => {
    if (!audioUrl) return;

    const el = new Audio(audioUrl);
    el.loop = true;
    el.preload = "none"; // Bandwidth optimization: wait until guest interaction
    el.volume = 0;

    const handleError = () => {
      // Graceful error fallback: fail silently without UI disruption
      setIsPlaying(false);
    };

    el.addEventListener("error", handleError);
    audioRef.current = el;

    const storedMute = getStoredMutePreference();
    setIsMuted(storedMute);

    return () => {
      el.removeEventListener("error", handleError);
      el.pause();
      el.src = "";
      audioRef.current = null;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [audioUrl, getStoredMutePreference]);

  // 4. Trigger playback upon explicit guest interaction ("OPEN INVITATION")
  useEffect(() => {
    if (!activeAudio || !isEnvelopeOpened || hasInteracted) return;

    setHasInteracted(true);
    const storedMute = getStoredMutePreference();
    if (storedMute) {
      setIsMuted(true);
      return;
    }

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.volume = 0;
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
            fadeVolume(TARGET_VOLUME);
          })
          .catch(() => {
            // Browser autoplay rejection handled gracefully
            setIsPlaying(false);
            setIsMuted(true);
          });
      }
    }
  }, [activeAudio, isEnvelopeOpened, hasInteracted, getStoredMutePreference, fadeVolume]);

  // 5. User toggle handler (min 44x44px accessible button)
  const handleToggle = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying && !isMuted) {
      // Fade out and pause
      fadeVolume(0, () => {
        audioElement.pause();
        setIsPlaying(false);
        setIsMuted(true);
        setStoredMutePreference(true);
      });
    } else {
      // Play and fade in
      audioElement.volume = 0;
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
            setStoredMutePreference(false);
            fadeVolume(TARGET_VOLUME);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsMuted(true);
          });
      }
    }
  };

  if (!activeAudio) {
    return null;
  }

  const title = activeAudio.title;
  const ariaLabel = isPlaying && !isMuted ? `Mute ${title}` : `Play ${title}`;

  if (variant === "navbar") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={ariaLabel}
        className={`flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full border border-[#D4AF37]/50 bg-black/40 text-theme-text-primary shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#D4AF37] hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 ${className}`}
        title={`${title} (${isPlaying && !isMuted ? "Playing" : "Muted"})`}
      >
        {isPlaying && !isMuted ? (
          <Volume2 className="h-4 w-4 animate-pulse text-[#D4AF37]" />
        ) : (
          <VolumeX className="h-4 w-4 text-theme-text-muted opacity-80" />
        )}
      </button>
    );
  }

  // Floating variant (responsive 44x44 circular button on mobile, full pill on desktop)
  return (
    <div className={`fixed bottom-20 left-4 z-40 sm:bottom-6 sm:left-6 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={ariaLabel}
        className={`group flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border p-2.5 font-serif text-xs tracking-wider shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] active:scale-95 sm:px-4 sm:py-2 ${
          isPlaying && !isMuted
            ? "bg-theme-surface/95 border-[#D4AF37] text-theme-text-primary shadow-[0_0_20px_rgba(212,175,55,0.25)]"
            : "border-[#D4AF37]/40 bg-black/60 text-white/80 hover:border-[#D4AF37] hover:bg-black/80 hover:text-white"
        }`}
        title={`${title} (${isPlaying && !isMuted ? "Playing" : "Muted"})`}
      >
        <span className="flex h-5 w-5 items-center justify-center">
          {isPlaying && !isMuted ? (
            <Volume2 className="h-4 w-4 animate-pulse text-[#D4AF37]" />
          ) : (
            <VolumeX className="h-4 w-4 text-[#E8B96B]/70 group-hover:text-white" />
          )}
        </span>

        <span className="hidden items-center gap-1.5 text-[11px] font-medium sm:flex">
          <Music className="h-3 w-3 text-[#D4AF37]" />
          <span className="max-w-[150px] truncate">{title}</span>
          {isPlaying && !isMuted && (
            <span className="inline-flex items-center gap-0.5 pl-1">
              <span className="inline-block h-2 w-0.5 animate-pulse bg-[#D4AF37]" />
              <span className="inline-block h-3 w-0.5 animate-pulse bg-[#D4AF37] delay-75" />
              <span className="inline-block h-1.5 w-0.5 animate-pulse bg-[#D4AF37] delay-150" />
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
