interface PikachuIconProps {
  className?: string;
}

/**
 * A full-body, waving Pikachu drawn as an original inline SVG — no external
 * assets, scales crisply at any size. Used as the "secret" button on the games
 * home screen that jumps over to the personal projects gallery.
 */
export function PikachuIcon({ className }: PikachuIconProps) {
  return (
    <svg
      viewBox="0 0 200 205"
      className={className}
      role="img"
      aria-label="Pikachu"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="#2B2B2B" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Tail (lightning bolt), behind the body */}
        <path d="M150,120 L142,150 L158,146 L150,172 L180,132 L164,136 L172,110 Z" fill="#F7D02C" />
        {/* Left ear */}
        <path d="M86,64 C76,50 62,32 52,18 C48,12 40,13 40,21 C41,33 54,52 68,68 C74,74 82,70 86,64 Z" fill="#F7D02C" />
        {/* Right ear */}
        <path d="M116,62 C118,44 124,24 130,10 C133,4 141,5 140,14 C139,28 130,50 122,66 C118,72 112,70 116,62 Z" fill="#F7D02C" />
        {/* Left arm (raised, rounded paw) */}
        <path d="M72,104 L43,75 A10 10 0 0 0 29,89 L58,116 Z" fill="#F7D02C" />
        {/* Right arm (out, rounded paw) */}
        <path d="M129,105 L167,86 A10 10 0 0 1 176,100 L138,120 Z" fill="#F7D02C" />
        {/* Body */}
        <path d="M100,56 C76,56 62,78 60,104 C58,128 64,152 72,166 C80,180 90,186 100,186 C110,186 120,180 128,166 C136,152 142,128 140,104 C138,78 124,56 100,56 Z" fill="#F7D02C" />
        {/* Feet */}
        <path d="M82,180 C74,184 74,192 84,192 C93,192 94,185 91,180 Z" fill="#F7D02C" />
        <path d="M109,180 C106,185 107,192 116,192 C126,192 126,184 118,180 Z" fill="#F7D02C" />
      </g>
      {/* Ear tips (black) */}
      <path d="M52,18 C48,12 40,13 40,21 C41,29 46,39 53,49 L65,31 Z" fill="#2B2B2B" />
      <path d="M130,10 C133,4 141,5 140,14 C139,23 135,33 129,44 L117,29 Z" fill="#2B2B2B" />
      {/* Cheeks */}
      <circle cx="72" cy="118" r="11.5" fill="#E4553B" />
      <circle cx="128" cy="118" r="11.5" fill="#E4553B" />
      {/* Eyes */}
      <circle cx="83" cy="98" r="10.5" fill="#2B2B2B" />
      <circle cx="117" cy="98" r="10.5" fill="#2B2B2B" />
      <circle cx="86.5" cy="93.5" r="3.6" fill="#fff" />
      <circle cx="120.5" cy="93.5" r="3.6" fill="#fff" />
      {/* Nose */}
      <ellipse cx="100" cy="109" rx="2.4" ry="1.5" fill="#2B2B2B" />
      {/* Happy open mouth with tongue */}
      <path d="M100,112 C91,112 84,118 87,127 C90,136 110,136 113,127 C116,118 109,112 100,112 Z" fill="#8a2418" stroke="#2B2B2B" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M90,128 C94,133 106,133 110,128 C106,125 94,125 90,128 Z" fill="#E4553B" />
    </svg>
  );
}
