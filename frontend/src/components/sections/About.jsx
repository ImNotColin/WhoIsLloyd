// About.jsx — section 03, "THE PILOT". Bio copy, the FAA Part 107 credential,
// and a decorative quadcopter rendered in SVG line art.

import { useEffect, useState } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import { ABOUT_COPY, BUSINESS } from '../../content.js';
import api from '../../services/api.js';

export default function About() {
  const ref = useScrollAnimation();
  const [part107Path, setPart107Path] = useState(null);

  // Fetch the Part 107 certificate image path from public settings. If the
  // request fails we fly without it — the fallback badge below makes the same
  // (true) claim, just without the framed photo.
  useEffect(() => {
    api
      .get('/admin/settings/public')
      .then((r) => setPart107Path(r.data.part107Path))
      .catch(() => {});
  }, []);

  return (
    <section id="about" ref={ref} className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <div>
          <p data-reveal className="section-kicker mb-4">03 / ABOUT</p>
          <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-10">
            THE PILOT
          </h2>
          {ABOUT_COPY.map((para, i) => (
            <p key={i} data-reveal className="text-bone/80 leading-relaxed mb-5">
              {para}
            </p>
          ))}

          {/* FAA Part 107 credential — the uploaded certificate when Colin has
              provided one, otherwise the styled badge. Either way, the FAA is
              satisfied and so is the layout. */}
          <div data-reveal className="mt-8">
            {part107Path ? (
              <figure className="inline-block border border-gold/40 p-2 bg-surface">
                <img
                  src={part107Path}
                  alt="FAA Part 107 Remote Pilot Certificate"
                  className="max-w-xs"
                />
                <figcaption className="font-mono text-[10px] tracking-wide2 text-gold mt-2 text-center">
                  FAA PART 107 · REMOTE PILOT CERTIFICATE
                </figcaption>
              </figure>
            ) : (
              <div className="inline-flex items-center gap-4 border border-gold/50 bg-surface px-6 py-4">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                  <path d="M8.5 12l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="font-display tracking-cinematic text-xl text-bone">
                    FAA PART 107 CERTIFIED
                  </div>
                  <div className="font-mono text-[10px] tracking-wide2 text-muted">
                    LICENSED COMMERCIAL REMOTE PILOT
                  </div>
                </div>
              </div>
            )}
          </div>

          <p data-reveal className="mt-8">
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="link-slide font-mono text-sm tracking-wide2 text-gold"
            >
              {BUSINESS.instagram} →
            </a>
          </p>
        </div>

        {/* Decorative quadcopter, hand-plotted in SVG. aria-hidden because it
            carries exactly zero information — it just hovers there, on brand. */}
        <div data-reveal className="hidden md:flex items-center justify-center" aria-hidden="true">
          <svg
            viewBox="0 0 400 400"
            className="w-full max-w-md text-gold/70"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="100" cy="100" r="58" opacity="0.9" />
            <circle cx="300" cy="100" r="58" opacity="0.9" />
            <circle cx="100" cy="300" r="58" opacity="0.9" />
            <circle cx="300" cy="300" r="58" opacity="0.9" />
            <circle cx="100" cy="100" r="6" fill="currentColor" />
            <circle cx="300" cy="100" r="6" fill="currentColor" />
            <circle cx="100" cy="300" r="6" fill="currentColor" />
            <circle cx="300" cy="300" r="6" fill="currentColor" />
            <path d="M60 100h80M100 60v80M260 100h80M300 60v80M60 300h80M100 260v80M260 300h80M300 260v80" opacity="0.35" />
            <rect x="165" y="165" width="70" height="70" rx="14" />
            <path d="M140 140l28 28m92-28l-28 28m-92 92l28-28m92 28l-28-28" />
            <circle cx="200" cy="200" r="16" opacity="0.7" />
            <circle cx="200" cy="200" r="7" fill="currentColor" opacity="0.8" />
          </svg>
        </div>
      </div>
    </section>
  );
}
