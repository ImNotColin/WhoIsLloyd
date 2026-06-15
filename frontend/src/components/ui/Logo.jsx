/**
 * Logo — the CS monogram in a double circle, matched to the business card
 * mark. Strokes inherit currentColor, so it wears whatever the parent is
 * wearing (almost always gold), and the whole thing scales off one `size`
 * prop because it is, in the end, just geometry.
 *
 * Three clicks within 1.5 seconds unlocks the bloopers page for the session.
 * This is not documented anywhere on the site, which is sort of the point.
 */
import { useRef } from 'react';

export default function Logo({ size = 56, className = '', onSecretUnlock }) {
  const clickCount = useRef(0);
  const resetTimer = useRef(null);

  const handleClick = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    clickCount.current += 1;

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      onSecretUnlock?.();
    } else {
      // If the next click doesn't arrive in 1.5 seconds, the count resets.
      // Fast fingers only.
      resetTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 1500);
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label="Drones by Colin — CS monogram"
      role="img"
      onClick={handleClick}
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
