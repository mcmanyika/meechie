export const MOOD_STORAGE_KEY = "meechieos.mood";

export const MOODS = [
  {
    id: "joy",
    label: "Joy",
    blurb: "Classic Meechie green and sunshine accents",
    swatch: "#1db954",
  },
  {
    id: "play",
    label: "Play",
    blurb: "Mint and sky with softer, rounder shapes",
    swatch: "#7bf9aa",
  },
  {
    id: "hype",
    label: "Hype",
    blurb: "High-contrast black with neon pops",
    swatch: "#ea8afd",
  },
  {
    id: "calm",
    label: "Calm",
    blurb: "Soft sky tones and quieter contrast",
    swatch: "#73d0fc",
  },
  {
    id: "sunshine",
    label: "Sunshine",
    blurb: "Yellow-forward warmth with blue accents",
    swatch: "#fdf279",
  },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export const DEFAULT_MOOD: MoodId = "joy";

export function isMoodId(value: string | null | undefined): value is MoodId {
  return Boolean(value && MOODS.some((mood) => mood.id === value));
}
