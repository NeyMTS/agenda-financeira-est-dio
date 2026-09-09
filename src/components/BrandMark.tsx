export function BrandMark({
  className = "size-7",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Nuvie"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="nuvie-gradient"
          x1="10"
          y1="10"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FF5A36" />
          <stop offset="45%" stopColor="#D94FE8" />
          <stop offset="100%" stopColor="#5967F2" />
        </linearGradient>
      </defs>

      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="17"
        fill="url(#nuvie-gradient)"
      />

      <path
        d="M21 43.5C15.8 43.5 12 40.1 12 35.3C12 30.8 15.3 27.5 19.7 27.2C20.8 21.8 25.5 18 31.1 18C37.3 18 42.2 22.6 42.8 28.6C47.8 28.7 52 32.1 52 36.8C52 41 48.4 43.5 43.7 43.5H21Z"
        fill="white"
        fillOpacity="0.96"
      />

      <path
        d="M22 35.5C25.1 32.7 28.2 31.4 31.5 31.4C35 31.4 38 32.8 41.1 35.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.32"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
