// BloopersPage.jsx — the outtake reel. Not linked from anywhere obvious.
// You either know where to click, or you don't.

import { useEffect, useState } from 'react';
import Navigation from '../components/layout/Navigation.jsx';
import Footer from '../components/layout/Footer.jsx';
import { getBloopers, apiError } from '../services/api.js';

export default function BloopersPage() {
  const [bloopers, setBloopers] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBloopers().then(setBloopers).catch((err) => setError(apiError(err)));
  }, []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20 px-5 md:px-10 max-w-7xl mx-auto">
        <h1 className="heading-display text-5xl md:text-7xl mb-3">BLOOPERS</h1>
        <p className="font-mono text-xs tracking-wide2 text-muted mb-12">
          YOU FOUND IT. DON&apos;T TELL ANYONE.
        </p>

        {error && <p className="text-red-400 font-mono text-sm mb-8">{error}</p>}

        {bloopers.length === 0 && !error ? (
          <p className="text-muted font-mono text-sm">
            No bloopers yet. The flights have, apparently, all been perfect.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bloopers.map((b) => (
              <div key={b.id} className="group bg-surface border border-line overflow-hidden">
                {playing === b.id ? (
                  /* Once play is clicked, hand full control to the browser. */
                  <video
                    autoPlay
                    controls
                    className="w-full aspect-video bg-black"
                    src={b.videoPath}
                    onEnded={() => setPlaying(null)}
                  />
                ) : (
                  /* Pre-load only metadata — the grid may hold many large files. */
                  <button
                    onClick={() => setPlaying(b.id)}
                    className="relative w-full aspect-video block overflow-hidden"
                    aria-label={`Play ${b.title}`}
                  >
                    <video
                      className="w-full h-full object-cover"
                      src={b.videoPath}
                      muted
                      preload="metadata"
                    />
                    {/* Play button overlay. Gold ring, centered, fades on hover. */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/35 transition-colors">
                      <div className="w-14 h-14 rounded-full border-2 border-gold flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold fill-current ml-1" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}

                <div className="px-4 py-3">
                  <p className="font-mono text-xs tracking-wide2 text-bone">{b.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
