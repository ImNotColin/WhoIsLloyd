// Portfolio.jsx — section 02, "THE WORK". Fetches published portfolio items
// and lays them out as a clickable thumbnail grid; selecting one opens the
// fullscreen video lightbox.

import { useEffect, useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import VideoLightbox from '../ui/VideoLightbox.jsx';
import { getPortfolio } from '../../services/api.js';
import { SERVICE_LABELS } from '../../content.js';

export default function Portfolio() {
  const ref = useScrollAnimation();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  // Fetch once on mount. A failed request degrades to the empty state below —
  // "follow us on Instagram" is a far better look than a stack trace.
  useEffect(() => {
    getPortfolio()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <section id="work" ref={ref} className="py-24 md:py-32 px-6 bg-surface/40">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-kicker mb-4">02 / PORTFOLIO</p>
        <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-14">
          THE WORK
        </h2>

        {items.length === 0 ? (
          <p data-reveal className="text-muted font-mono text-sm tracking-wide2">
            NEW WORK DROPPING SOON — FOLLOW @DRONESBYCOLIN
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {items.map((item) => (
              <button
                key={item.id}
                data-reveal
                onClick={() =>
                  setActive({ ...item, categoryLabel: SERVICE_LABELS[item.category] })
                }
                className="group relative text-left overflow-hidden border border-line
                  hover:border-gold/50 transition-colors duration-300"
              >
                <div className="aspect-video overflow-hidden bg-ink">
                  <img
                    src={item.thumbnailPath}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700
                      ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                </div>
                {/* Play affordance — hidden until hover, so the grid reads as
                    photography first and reveals itself as video on approach. */}
                <span
                  className="absolute inset-0 flex items-center justify-center opacity-0
                    group-hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                >
                  <span className="w-16 h-16 rounded-full border border-gold/80 bg-black/50 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gold ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </span>
                <div className="p-5 bg-ink/90">
                  <span className="font-mono text-[10px] tracking-wide2 uppercase text-gold">
                    {SERVICE_LABELS[item.category]}
                  </span>
                  <h3 className="heading-display text-2xl mt-1 group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && <VideoLightbox item={active} onClose={() => setActive(null)} />}
    </section>
  );
}
