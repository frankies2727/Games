interface PikachuIconProps {
  className?: string;
}

/**
 * A cute, front-facing standing Pikachu with a soft glow, drawn as an original
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
        <radialGradient id="pika-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#FFE873" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#F7D02C" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F7D02C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft warm glow */}
      <circle cx="100" cy="110" r="94" fill="url(#pika-glow)" />
      <g stroke="#2B2B2B" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Tail (lightning bolt), behind the body on the left */}
        <path d="M60,120 L48,98 L60,96 L44,74 L20,80 L38,98 L26,100 L50,118 Z" fill="#F7D02C" />
        {/* Left ear */}
        <path d="M80,58 C70,44 60,26 52,12 C49,6 41,7 41,15 C42,29 55,50 68,64 C72,68 78,64 80,58 Z" fill="#F7D02C" />
        {/* Right ear */}
        <path d="M120,58 C130,44 140,26 148,12 C151,6 159,7 159,15 C158,29 145,50 132,64 C128,68 122,64 120,58 Z" fill="#F7D02C" />
        {/* Body + head (chubby, standing) */}
        <path d="M100,50 C66,50 48,80 48,112 C48,142 62,170 78,180 C86,185 114,185 122,180 C138,170 152,142 152,112 C152,80 134,50 100,50 Z" fill="#F7D02C" />
        {/* Feet */}
        <ellipse cx="84" cy="183" rx="15" ry="8" fill="#F7D02C" />
        <ellipse cx="116" cy="183" rx="15" ry="8" fill="#F7D02C" />
        {/* Arms at the sides */}
        <path d="M52,128 C43,131 38,142 43,151 C48,158 57,153 59,144 Z" fill="#F7D02C" />
        <path d="M148,128 C157,131 162,142 157,151 C152,158 143,153 141,144 Z" fill="#F7D02C" />
      </g>
      {/* Ear tips (black) */}
      <path d="M52,12 C49,6 41,7 41,15 C42,23 46,33 53,43 L65,25 Z" fill="#2B2B2B" />
      <path d="M148,12 C151,6 159,7 159,15 C158,23 154,33 147,43 L135,25 Z" fill="#2B2B2B" />
      {/* Cheeks */}
      <circle cx="62" cy="122" r="13" fill="#E4553B" />
      <circle cx="138" cy="122" r="13" fill="#E4553B" />
      {/* Eyes */}
      <circle cx="79" cy="101" r="11" fill="#2B2B2B" />
      <circle cx="121" cy="101" r="11" fill="#2B2B2B" />
      <circle cx="83" cy="96" r="4" fill="#fff" />
      <circle cx="125" cy="96" r="4" fill="#fff" />
      <circle cx="76" cy="105" r="2" fill="#fff" />
      <circle cx="118" cy="105" r="2" fill="#fff" />
      {/* Nose */}
      <ellipse cx="100" cy="110" rx="2.4" ry="1.5" fill="#2B2B2B" />
      {/* Gentle closed smile */}
      <path d="M89,116 C94,123 106,123 111,116" fill="none" stroke="#2B2B2B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
