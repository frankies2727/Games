interface PikachuIconProps {
  className?: string;
}

/**
 * A tiny inline-SVG Pikachu face — no external assets, scales crisply at any
 * size. Used as the "secret" button on the games home screen that jumps over to
 * the personal projects gallery.
 */
export function PikachuIcon({ className }: PikachuIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Pikachu"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ears */}
      <path d="M20 20 L9 3 C8 1 11 0 12 2 L24 17 Z" fill="#F7D02C" stroke="#2B2B2B" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M44 20 L55 3 C56 1 53 0 52 2 L40 17 Z" fill="#F7D02C" stroke="#2B2B2B" strokeWidth="1.6" strokeLinejoin="round" />
      {/* Ear tips */}
      <path d="M9 3 C8 1 11 0 12 2 L16.5 7.5 L11.5 10.5 Z" fill="#2B2B2B" />
      <path d="M55 3 C56 1 53 0 52 2 L47.5 7.5 L52.5 10.5 Z" fill="#2B2B2B" />
      {/* Head */}
      <ellipse cx="32" cy="37" rx="23" ry="21" fill="#F7D02C" stroke="#2B2B2B" strokeWidth="1.8" />
      {/* Cheeks */}
      <circle cx="15.5" cy="42" r="6" fill="#E4553B" />
      <circle cx="48.5" cy="42" r="6" fill="#E4553B" />
      {/* Eyes */}
      <circle cx="23" cy="33" r="4.6" fill="#2B2B2B" />
      <circle cx="41" cy="33" r="4.6" fill="#2B2B2B" />
      <circle cx="24.6" cy="31.4" r="1.6" fill="#fff" />
      <circle cx="42.6" cy="31.4" r="1.6" fill="#fff" />
      {/* Nose */}
      <ellipse cx="32" cy="39" rx="1.8" ry="1.2" fill="#2B2B2B" />
      {/* Mouth */}
      <path d="M32 40.5 L32 43 M32 43 C29 47 25 46 24 43 M32 43 C35 47 39 46 40 43" stroke="#2B2B2B" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
