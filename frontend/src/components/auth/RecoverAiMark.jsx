export default function RecoverAiMark({ className = "size-5", color = "#38bdf8" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="RecoverAI Mark"
    >
      {/* Starting transaction node */}
      <circle cx="4.5" cy="18" r="2.25" fill={color} />
      
      {/* Recovery route turning upward */}
      <path
        d="M4.5 18H14C16.2091 18 18 16.2091 18 14V6"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Upward recovery arrowhead / affirmative check vector */}
      <path
        d="M14.5 9.5L18 6L21.5 9.5"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
