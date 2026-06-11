/**
 * Logo — the CS monogram in a double circle, matched to the business card
 * mark. Strokes inherit currentColor, so it wears whatever the parent is
 * wearing (almost always gold), and the whole thing scales off one `size`
 * prop because it is, in the end, just geometry.
 */
export default function Logo({ size = 56, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="Drones by Colin — CS monogram"
      role="img"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.4"
      />
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="38"
        letterSpacing="3"
        fill="currentColor"
      >
        CS
      </text>
    </svg>
  );
}
