import type { ComponentType } from 'react';

/**
 * A personal project shown in the projects gallery. Each project is a
 * self-contained mini-app that renders full-screen and gets an `onExit`
 * callback to return to the gallery.
 */
export interface ProjectDefinition {
  id: string;
  name: string;
  /** One-line hook shown on the gallery card. */
  tagline: string;
  /** A short blurb describing what the project does. */
  description: string;
  emoji: string;
  /** Tailwind gradient classes for the card background, e.g. "from-... to-...". */
  gradient: string;
  /** Lifecycle badge, e.g. "Live", "In Progress", "Prototype". */
  status: string;
  /** The full-screen app. Receives `onExit` to go back to the gallery. */
  Component: ComponentType<{ onExit: () => void }>;
}
