import { lazy } from 'react';
import { ProjectDefinition } from './types';

// Lazy-loaded so its heavier deps (motion, file-saver, html-to-image) only
// download when a visitor actually opens the project — the games home screen
// stays lean.
const VibeCheck = lazy(() =>
  import('./vibecheck/VibeCheck').then((m) => ({ default: m.VibeCheck })),
);

const PlaceTimelapse = lazy(() =>
  import('./streetview/PlaceTimelapse').then((m) => ({
    default: m.PlaceTimelapse,
  })),
);

// Frankie's personal projects — awesome things being built, one card each.
// VibeCheck is the first; add more here as they ship.
export const PROJECTS: ProjectDefinition[] = [
  {
    id: 'vibecheck',
    name: 'VibeCheck',
    tagline: 'The immersive company story generator.',
    description:
      'Type any company or tap a featured profile to generate a highly visual, scrollable story — the rundown, fast facts, a timeline and fun facts, from Wikipedia plus web-grounded profiles pre-baked offline. No API key needed.',
    emoji: '⚡',
    gradient: 'from-[#ccff00] via-[#8fae00] to-[#0a0a0a]',
    status: 'Live',
    Component: VibeCheck,
  },
  {
    id: 'place-timelapse',
    name: 'Place Timelapse',
    tagline: 'Watch any place change over time.',
    description:
      'Watch any place on Earth change over time — a year of NASA satellite imagery (no key, exports a real video) or the ground-level Street View history of your memorable spots. Search, play, scrub the timeline.',
    emoji: '🌍',
    gradient: 'from-[#0ea5e9] via-[#0f766e] to-[#0a0a0a]',
    status: 'Live',
    Component: PlaceTimelapse,
  },
];

export const projectById = (id: string): ProjectDefinition | undefined =>
  PROJECTS.find((p) => p.id === id);
