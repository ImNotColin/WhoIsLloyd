// Hero.jsx — the opening shot. Fullscreen looping aerial footage, a GSAP
// load-in timeline, and just enough parallax to feel expensive without
// making anyone airsick.

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../hooks/useScrollAnimation.js';
import Logo from '../ui/Logo.jsx';
import GoldButton from '../ui/GoldButton.jsx';
import {
  TAGLINE,
  HERO_VIDEO_LOCAL,
  HERO_VIDEO_FALLBACK,
  HERO_POSTER,
} from '../../content.js';

export default function Hero() {
  const rootRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    // Reduced motion: skip everything. The hero is fully legible standing still.
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // Load-in timeline: logo → name → tagline → CTA → scroll cue. The
      // negative position offsets overlap each entrance with the last —
      // strictly sequential reveals feel like a slideshow, and we bill
      // ourselves as cinematography.
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('[data-hero-logo]', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 1 })
        .fromTo('[data-hero-name]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.4')
        .fromTo('[data-hero-tag]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .fromTo('[data-hero-cta]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-hero-scroll]', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.2');

      // Parallax, exercised with restraint: the background drifts at roughly
      // 0.4x scroll speed. The scale-110 wrapper below provides the overscan
      // so the drift never exposes a bare edge.
      gsap.to(bgRef.current, {
        yPercent: 24, // the 0.4x drift over one viewport of scroll, as % of element height
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);
    // ctx.revert() recalls every tween and ScrollTrigger registered above in
    // one call. A ScrollTrigger that outlives its component keeps flying the
    // old mission on the new page; we do not authorize that flight.
    return () => ctx.revert();
  }, []);

  const scrollToWork = () =>
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="hero" ref={rootRef} className="relative h-screen overflow-hidden">
      {/* Background reel. autoPlay + muted + playsInline is the complete
          paperwork mobile browsers require before granting takeoff clearance
          to a video. Stock footage for now — swap /storage/stock/hero.mp4
          for the real reel when it lands. */}
      <div ref={bgRef} className="absolute inset-0 scale-110">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
          className="w-full h-full object-cover"
        >
          <source src={HERO_VIDEO_LOCAL} type="video/mp4" />
          <source src={HERO_VIDEO_FALLBACK} type="video/mp4" />
        </video>
      </div>

      {/* Bottom-heavy gradient: the footage descends into ink so the next
          section arrives as a controlled descent, not a hard cut. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-ink" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <div data-hero-logo className="text-gold mb-8">
          <Logo size={88} />
        </div>
        <h1
          data-hero-name
          className="heading-display text-[16vw] md:text-[7.5rem] leading-[0.95]"
        >
          DRONES BY COLIN
        </h1>
        <p
          data-hero-tag
          className="mt-5 font-mono text-sm md:text-base tracking-wide2 text-gold"
        >
          {TAGLINE}
        </p>
        <div data-hero-cta className="mt-10">
          <GoldButton onClick={scrollToWork}>SEE THE WORK</GoldButton>
        </div>
      </div>

      {/* Scroll cue. Decorative, hence aria-hidden — screen readers already
          know how scrolling works. */}
      <div
        data-hero-scroll
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] tracking-wide2 text-muted">SCROLL</span>
        <span className="scroll-line block w-px h-12 bg-gold/70" />
      </div>
    </section>
  );
}
