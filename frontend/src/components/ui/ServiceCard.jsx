// ServiceCard.jsx — one card per service line. The icons below are hand-drawn
// 24x24 stroke paths; no icon library was bundled in the making of this file.

// Keyed by service.key from content.js.
const ICONS = {
  REAL_ESTATE: (
    // drone hovering over a rooftop
    <path d="M12 3l8 6h-2v2h-2V10.5L12 7.5 8 10.5V11H6V9H4l8-6zm-9 13h4m-2-2v4m14-2h4m-2-2v4M7 16.5a2 2 0 104 0 2 2 0 10-4 0m6 0a2 2 0 104 0 2 2 0 10-4 0M9 16.5h6" />
  ),
  EVENTS: (
    // a crowd, as seen from the sweep overhead
    <path d="M4 19c1.5-2 3-3 4.5-3s3 1 4.5 1 3-1 4.5-1 3 1 4.5 3M3 8h5m-2.5-2.5v5M16 8h5m-2.5-2.5v5M9.5 8a2.5 2.5 0 105 0 2.5 2.5 0 10-5 0" />
  ),
  CONSTRUCTION: (
    // crane and structural frame
    <path d="M3 21h18M6 21V10l9-6v17M15 7l5 2v12M9 13h3m-3 4h3M6 10l9-3" />
  ),
  WEDDINGS: (
    // interlocked rings, top-down — the only angle we sell
    <path d="M9 13.5a4.5 4.5 0 104.4-4.5M15 13.5a4.5 4.5 0 10-4.4-4.5M12 4l1.5 2.5h-3L12 4z" />
  ),
};

export default function ServiceCard({ service }) {
  return (
    <div
      data-reveal
      className="group relative bg-surface border border-line p-8 overflow-hidden
        transition-colors duration-300 hover:border-gold/40"
    >
      {/* Gold accent line — scales in from the left edge on hover, the card's
          equivalent of a runway light coming on. */}
      <span
        className="absolute top-0 left-0 h-[2px] w-full bg-gold scale-x-0 origin-left
          transition-transform duration-500 ease-out group-hover:scale-x-100"
      />
      <svg
        viewBox="0 0 24 24"
        className="w-10 h-10 text-gold mb-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[service.key]}
      </svg>
      <h3 className="heading-display text-3xl mb-3">{service.name}</h3>
      <p className="text-muted leading-relaxed text-sm">{service.description}</p>
    </div>
  );
}
