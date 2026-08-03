interface PikachuIconProps {
  className?: string;
}

/**
 * A cute, front-facing sitting Pikachu with a warm glow, drawn as an original
 * inline SVG — no external assets, scales crisply at any size. Used as the
 * "secret" button on the games home screen that jumps to the projects gallery.
 */
export function PikachuIcon({ className }: PikachuIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label="Pikachu"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="pika-glow" cx="50%" cy="52%" r="55%">
          <stop offset="0%" stopColor="#FFE873" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#F7D02C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#F7D02C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Warm glow (echoes a Pikachu night-light) */}
      <circle cx="100" cy="108" r="92" fill="url(#pika-glow)" />
      <g stroke="#2B2B2B" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Tail (lightning bolt), behind the body on the right */}
        <path d="M140,118 L150,96 L138,94 L152,72 L176,66 L160,84 L172,86 L150,116 Z" fill="#F7D02C" />
        {/* Left ear */}
        <path d="M82,60 C72,46 62,27 54,11 C51,5 43,6 43,14 C44,28 57,51 70,65 C74,69 80,66 82,60 Z" fill="#F7D02C" />
        {/* Right ear */}
        <path d="M118,60 C128,46 138,27 146,11 C149,5 157,6 157,14 C156,28 143,51 130,65 C126,69 120,66 118,60 Z" fill="#F7D02C" />
        {/* Body + head (single chubby seated blob) */}
        <path d="M100,54 C70,54 55,82 55,116 C55,150 72,182 100,182 C128,182 145,150 145,116 C145,82 130,54 100,54 Z" fill="#F7D02C" />
        {/* Feet */}
        <ellipse cx="80" cy="178" rx="15" ry="9" fill="#F7D02C" />
        <ellipse cx="120" cy="178" rx="15" ry="9" fill="#F7D02C" />
        {/* Front paws resting on the belly */}
        <path d="M78,150 C70,150 66,158 72,163 C78,167 86,164 88,157 Z" fill="#F7D02C" />
        <path d="M122,150 C130,150 134,158 128,163 C122,167 114,164 112,157 Z" fill="#F7D02C" />
      </g>
      {/* Ear tips (black) */}
      <path d="M54,11 C51,5 43,6 43,14 C44,22 48,32 55,42 L67,24 Z" fill="#2B2B2B" />
      <path d="M146,11 C149,5 157,6 157,14 C156,22 152,32 145,42 L133,24 Z" fill="#2B2B2B" />
      {/* Cheeks */}
      <circle cx="66" cy="120" r="12" fill="#E4553B" />
      <circle cx="134" cy="120" r="12" fill="#E4553B" />
      {/* Eyes */}
      <circle cx="80" cy="102" r="11" fill="#2B2B2B" />
      <circle cx="120" cy="102" r="11" fill="#2B2B2B" />
      <circle cx="84" cy="97" r="4" fill="#fff" />
      <circle cx="124" cy="97" r="4" fill="#fff" />
      <circle cx="77" cy="106" r="2" fill="#fff" />
      <circle cx="117" cy="106" r="2" fill="#fff" />
      {/* Nose */}
      <ellipse cx="100" cy="112" rx="2.4" ry="1.5" fill="#2B2B2B" />
      {/* Gentle closed smile */}
      <path d="M90,117 C94,124 106,124 110,117" fill="none" stroke="#2B2B2B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
