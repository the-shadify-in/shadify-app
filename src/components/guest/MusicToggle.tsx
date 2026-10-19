"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Soft traditional Indian shehnai / flute pentatonic scale melody generator (Raag Yaman: Sa Re Ga Ma# Pa Dha Ni)
  const notes = [261.63, 293.66, 329.63, 369.99, 392.0, 440.0, 493.88, 523.25];

  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const note = notes[Math.floor(Math.random() * notes.length)] || 392.0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.3);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const toggleMusic = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playChime();
      intervalRef.current = setInterval(playChime, 2400);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden sm:block">
      <button
        type="button"
        onClick={toggleMusic}
        className={`group flex items-center gap-2 rounded-full border px-4 py-2 font-serif text-xs tracking-wider shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
          isPlaying
            ? "border-[#D4AF37] bg-theme-surface text-theme-text-primary shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            : "border-[#D4AF37]/40 bg-black/50 text-white/80 hover:border-[#D4AF37] hover:bg-black/70 hover:text-white"
        }`}
        aria-label="Toggle traditional wedding music"
      >
        {isPlaying ? (
          <>
            <Volume2 className="h-4 w-4 animate-pulse text-[#D4AF37]" />
            <span className="text-[11px]">Shehnai: Playing 🎵</span>
          </>
        ) : (
          <>
            <VolumeX className="h-4 w-4 text-[#E8B96B]/70" />
            <span className="text-[11px]">Play Shehnai Flute</span>
          </>
        )}
      </button>
    </div>
  );
}
