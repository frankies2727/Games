import { lazy } from 'react';
import { ProjectDefinition } from './types';

// Lazy-loaded so its heavy deps (recharts, motion, genai) only download when a
// visitor actually opens the project — the games home screen stays lean.
const VibeCheck = lazy(() =>
  import('./vibecheck/VibeCheck').then((m) => ({ default: m.VibeCheck })),
);

// Frankie's personal projects — awesome things being built, one card each.
// VibeCheck is the first; add more here as they ship.
export const PROJECTS: ProjectDefinition[] = [
  {
    id: 'vibecheck',
    name: 'VibeCheck',
    tagline: 'The immersive company story generator.',
    description:
      'Type any company or tap a trending brand to generate a highly visual, scrollable story — finances, timeline, origin lore, cultural impact and AI-generated art for each scene.',
    emoji: '⚡',
    gradient: 'from-[#ccff00] via-[#8fae00] to-[#0a0a0a]',
    status: 'Live',
    Component: VibeCheck,
  },
];

export const projectById = (id: string): ProjectDefinition | undefined =>
  PROJECTS.find((p) => p.id === id);
