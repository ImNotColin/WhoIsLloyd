// useScrollAnimation.js — the house GSAP reveal. We animate things as you
// scroll, but we never hijack the scroll itself. There is a line, and it is
// drawn here.

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Checked at mount time by every animation on the site. If the OS says
// reduce motion, GSAP stays in the hangar and content renders in place.
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Standard cinematic reveal: children marked with [data-reveal] rise 48px
 * with a fade, staggered 0.12s apart, when the section reaches 78% of the
 * viewport. Fires once — sections do not re-perform on the scroll back up;
 * this is cinema, not a loop of the trailer.
 * Returns a ref to attach to the section root. gsap.context handles cleanup
 * on unmount, so ScrollTriggers don't pile up across route changes.
 */
export function useScrollAnimation() {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const targets = ref.current?.querySelectorAll('[data-reveal]');
      if (!targets?.length) return;
      gsap.fromTo(
        targets,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 78%',
            once: true,
          },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return ref;
}

// Re-exported so components needing bespoke timelines import from here and
// get the plugin already registered, instead of registering it again.
export { gsap, ScrollTrigger };
