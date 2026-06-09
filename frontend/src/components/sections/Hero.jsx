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
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // Cinematic load-in: logo → name → tagline → CTA
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('[data-hero-logo]', { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 1 })
        .fromTo('[data-hero-name]', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.4')
        .fromTo('[data-hero-tag]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .fromTo('[data-hero-cta]', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .fromTo('[data-hero-scroll]', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.2');

      // Parallax: background moves at 0.4x scroll speed
      gsap.to(bgRef.current, {
        yPercent: 24, // (1 - 0.4) * 0.4 viewport offset feel
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const scrollToWork = () =>
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="hero" ref={rootRef} className="relative h-screen overflow-hidden">
      {/* Looping stock drone footage — swap /storage/stock/hero.mp4 with real reel */}
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

      {/* bottom-heavy dark gradient */}
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

      {/* scroll indicator */}
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
