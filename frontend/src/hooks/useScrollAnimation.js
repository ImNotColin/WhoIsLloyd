import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Standard cinematic reveal: children marked with [data-reveal] animate up
 * with a fade, staggered, when the section scrolls into view.
 * Returns a ref to attach to the section root. Cleans up on unmount.
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

export { gsap, ScrollTrigger };
