import type { AudioPresetTrack } from "./types";

/**
 * Curated Pre-Cleared Instrumental Library
 * High-fidelity traditional South Indian and Indian classical wedding tracks.
 * Pre-cleared for broadcast on Shadify digital invitations.
 */
export const PRESET_AUDIO_LIBRARY: AudioPresetTrack[] = [
  {
    id: "nadaswaram-muhurtham",
    title: "Mangala Vathiyam (Nadaswaram & Thavil)",
    category: "south-indian",
    instruments: ["Nadaswaram", "Thavil"],
    description: "Sacred South Indian temple nadaswaram announcing auspicious muhurtham blessings",
    durationEstimate: "2:45",
    url: "/audio/presets/nadaswaram-muhurtham.mp3",
  },
  {
    id: "kalyana-veenai",
    title: "Kalyana Veenai (Acoustic Veena & Tanpura)",
    category: "south-indian",
    instruments: ["Saraswati Veena", "Tanpura"],
    description:
      "Gentle classical veena resonance evoking purity, grace, and eternal auspiciousness",
    durationEstimate: "3:15",
    url: "/audio/presets/kalyana-veenai.mp3",
  },
  {
    id: "carnatic-flute",
    title: "Carnatic Flute & Morning Tanpura",
    category: "south-indian",
    instruments: ["Bamboo Bansuri", "Tanpura"],
    description: "Soothing Carnatic flute in Raga Kalyani celebrating divine union and tranquility",
    durationEstimate: "2:50",
    url: "/audio/presets/carnatic-flute.mp3",
  },
  {
    id: "shehnai-yaman",
    title: "Shehnai Raga Yaman (Royal Evening Vivah)",
    category: "royal",
    instruments: ["Shehnai", "Dholak", "Surpeti"],
    description: "Auspicious wedding shehnai melody welcoming wedding guests under the mandap",
    durationEstimate: "3:05",
    url: "/audio/presets/shehnai-yaman.mp3",
  },
  {
    id: "sitar-santoor",
    title: "Sitar & Santoor Acoustic Harmony",
    category: "classical",
    instruments: ["Sitar", "Santoor", "Soft Tabla"],
    description: "Warm acoustic strings creating an elegant, aristocratic palace ambiance",
    durationEstimate: "2:30",
    url: "/audio/presets/sitar-santoor.mp3",
  },
  {
    id: "carnatic-violin",
    title: "Carnatic Violin & Mridangam Duet",
    category: "south-indian",
    instruments: ["Violin", "Mridangam"],
    description: "Soulful classical violin strokes accompanied by rhythmic traditional mridangam",
    durationEstimate: "3:10",
    url: "/audio/presets/carnatic-violin.mp3",
  },
  {
    id: "temple-bells",
    title: "Morning Suprabhatam & Temple Bells",
    category: "devotional",
    instruments: ["Temple Chimes", "Shankh", "Tanpura"],
    description: "Serene dawn chants, brass bells, and deep resonance invoking universal peace",
    durationEstimate: "2:15",
    url: "/audio/presets/temple-bells.mp3",
  },
  {
    id: "acoustic-strings",
    title: "Acoustic Wedding Harmony",
    category: "classical",
    instruments: ["Acoustic Guitar", "Cello", "Tanpura"],
    description: "Minimalist contemporary strings blended with subtle warm Indian acoustic tones",
    durationEstimate: "2:40",
    url: "/audio/presets/acoustic-strings.mp3",
  },
];

export function getAudioPresetById(id: string): AudioPresetTrack | undefined {
  return PRESET_AUDIO_LIBRARY.find((track) => track.id === id);
}
